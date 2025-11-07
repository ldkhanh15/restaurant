import type { Request, Response, NextFunction } from "express"
import Order from "../models/Order"
import Voucher from "../models/Voucher"
import { AppError } from "../middlewares/errorHandler"
import Reservation from "../models/Reservation"
import paymentService from "../services/payment_app_userService"
import { VNPAY_CONFIG, generateSecureHash } from "../config/vnpay.config"
import OrderService from "../services/orderService"
import { getIO } from "../sockets"
import { orderEvents } from "../sockets/orderSocket"

// Helper: build a redirect URL for the client. Prefers app deep link when kind='app' and
// CLIENT_APP_SCHEME is configured, otherwise falls back to CLIENT_URL web path.
function buildClientRedirectUrl(opts: { kind: 'app' | 'web'; path: string; fallbackPath?: string }) {
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '')
    const appSchemeRaw = (process.env.CLIENT_APP_SCHEME || '').trim()

    if (opts.kind === 'app' && appSchemeRaw) {
        // If APP SCHEME is an http(s) URL, use it as a web fallback URL
        if (/^https?:\/\//i.test(appSchemeRaw)) {
            const base = appSchemeRaw.replace(/\/$/, '')
            return base + (opts.path.startsWith('/') ? opts.path : '/' + opts.path)
        }

        // Normalize custom scheme (e.g. 'restaurantapp://' or 'restaurantapp')
        let scheme = appSchemeRaw.replace(/:\/\/*$/, '')
        // If path begins with '/', drop the leading slash for app-scheme concatenation
        const path = opts.path.startsWith('/') ? opts.path.slice(1) : opts.path
        return scheme + '://' + path
    }

    // Web redirect (or missing app scheme)
    const usePath = opts.fallbackPath ?? opts.path
    return clientUrl + (usePath.startsWith('/') ? usePath : '/' + usePath)
}

export const createVnpayPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Dev-only: log incoming request body/query/headers to help debug missing order_id
        if (process.env.NODE_ENV !== 'production') {
            try {
                console.debug('[payment_app_user] createVnpayPayment request body:', JSON.stringify(req.body))
                console.debug('[payment_app_user] createVnpayPayment query:', JSON.stringify(req.query))
                console.debug('[payment_app_user] createVnpayPayment headers sample:', JSON.stringify({ accept: req.headers.accept, 'user-agent': req.headers['user-agent'], authorization: req.headers.authorization ? String(req.headers.authorization).slice(0, 40) + '...' : undefined }))
            } catch (e) { /* ignore */ }
        }

        // Extract order_id early so we can include it in dev mock responses if needed
        const { order_id } = req.body as { order_id?: string }

        // Fail fast if VNPay is not configured correctly to avoid generating invalid URLs
        if (!VNPAY_CONFIG.VNP_TMN_CODE || !VNPAY_CONFIG.VNP_HASH_SECRET) {
            console.error('[payment_app_user] VNPay not configured: VNP_TMN_CODE or VNP_HASH_SECRET missing')
            const missing: string[] = []
            if (!VNPAY_CONFIG.VNP_TMN_CODE) missing.push('VNP_TMN_CODE')
            if (!VNPAY_CONFIG.VNP_HASH_SECRET) missing.push('VNP_HASH_SECRET')

            // If running in development mode, return a mock redirect URL so local/dev clients can continue
            if (process.env.NODE_ENV !== 'production') {
                const defaultPort = process.env.PORT || '3000'
                const clientUrl = process.env.CLIENT_URL || `http://localhost:${defaultPort}`
                const mockRedirect = `${clientUrl}/payment/success?mock_vnpay=true&order_id=${order_id || ''}`
                return res.json({
                    status: 'success',
                    data: { redirect_url: mockRedirect },
                    mock: true,
                    message: 'VNPay not configured on server — returning mock redirect URL for local development.',
                    missing_env: missing,
                })
            }

            // Provide a helpful JSON response instead of throwing a generic 500 so clients (and developers) can act
            return res.status(503).json({
                status: 'error',
                message: 'VNPay configuration missing on server. Please set the missing environment variables and ensure the return URL is reachable by VNPay (use ngrok for local dev).',
                missing_env: missing,
                hints: {
                    ngrok: 'Run ngrok and set VNP_RETURN_URL to https://<your-ngrok>.ngrok-free.app/api/payments/vnpay/return and ApiConfig.baseUrl in the app to https://<your-ngrok>.ngrok-free.app',
                    local_return_url: 'If VNP_RETURN_URL points to localhost, VNPay cannot reach it. Use a public URL or ngrok.',
                },
            })
        }
    const { bankCode, voucher_ids, amount } = req.body as { order_id: string; bankCode?: string; voucher_ids?: string[]; amount?: number }
        const order = await Order.findByPk(order_id)
        if (!order) throw new AppError("Order not found", 404)

        if (req.user?.role === "customer" && order.user_id && order.user_id !== String(req.user.id)) {
            throw new AppError("Insufficient permissions", 403)
        }

        if (order.payment_status === "paid") {
            throw new AppError("Order already paid", 400)
        }
        // If client provided voucher_ids, validate them here (server-side validation only)
        let computedDiscount = 0
        let computedFinalAmount: number | undefined
        if (Array.isArray(voucher_ids) && voucher_ids.length > 0) {
            const validation = await validateAndComputeVouchersForOrder(order, voucher_ids)
            computedDiscount = validation.computedDiscount
            computedFinalAmount = validation.computedFinalAmount
        }

        // Get client IP
        const forwarded = req.headers['x-forwarded-for'];
        const clientIp = Array.isArray(forwarded) ? forwarded[0] : (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : (req.ip || "127.0.0.1"));
        // If client passed an expected amount, ensure it matches server computation (if vouchers were provided)
        if (typeof amount === 'number' && computedFinalAmount !== undefined) {
            // Allow small rounding differences
            const diff = Math.abs(Number(amount) - Number(computedFinalAmount))
            if (diff > 0.5) { // > 0.5 VND difference considered mismatch
                throw new AppError(`Requested amount does not match server calculation (expected ${computedFinalAmount}, got ${amount})`, 400)
            }
        }

        // Dev-only: allow per-request override of return URL via `_override_return` (only in non-production)
        const _override = (req.body && req.body._override_return) || (req.query && req.query._override_return)
        let overrideReturnUrl: string | undefined = undefined
        if (_override && process.env.NODE_ENV !== 'production') {
            try {
                const u = new URL(String(_override))
                if (u.protocol === 'http:' || u.protocol === 'https:') overrideReturnUrl = u.toString()
            } catch (e) { /* ignore invalid override */ }
        }

        // Generate VNPay redirect URL — pass amount override if server computed it
        const amountOverride = computedFinalAmount ?? (typeof amount === 'number' ? amount : undefined)
        const url = paymentService.generateVnpayRedirectUrl(order, bankCode, clientIp, amountOverride, overrideReturnUrl)
        if (process.env.NODE_ENV !== 'production') {
            try {
                console.debug('[payment_app_user] Generated VNPay redirect URL:', url)
            } catch (_) {}
        }
        // Extra debug: log parsed query params (txnRef, amount, tmn, hash) to help troubleshoot VNPay format errors
        if (process.env.NODE_ENV !== 'production') {
            try {
                const u = new URL(url)
                const qp = Object.fromEntries(u.searchParams.entries())
                console.debug('[payment_app_user] VNPay params sample:', {
                    vnp_TxnRef: qp.vnp_TxnRef,
                    vnp_Amount: qp.vnp_Amount,
                    vnp_TmnCode: qp.vnp_TmnCode,
                    vnp_SecureHash: qp.vnp_SecureHash ? qp.vnp_SecureHash.substr(0, 8) + '...' : undefined,
                })
            } catch (err) {
                console.error('[payment_app_user] Failed to parse VNPay url for debug', err)
            }
        }

        // Decide whether to redirect the client immediately to VNPay.
        // Keep existing behavior (JSON response with redirect_url) for API clients.
        // But when the request originates from a browser (Accept: text/html) or
        // the client explicitly asks for redirect via query/header, perform a 302.
        const wantRedirectExplicit = (String(req.query?.redirect || '').toLowerCase() === 'true') || (String(req.headers['x-redirect'] || '').toLowerCase() === 'true')
        const acceptHeader = String(req.headers['accept'] || '')
        const userAgent = String(req.headers['user-agent'] || '')

        const looksLikeBrowser = acceptHeader.includes('text/html') || /mozilla|chrome|safari/i.test(userAgent)

        if (wantRedirectExplicit || looksLikeBrowser) {
            // Use 302 redirect so browser will open VNPay's hosted pages (bank selection, login, OTP)
            return res.redirect(url)
        }

        // Default for API clients: return the URL so the client can open it in an in-app WebView
        res.json({ status: "success", data: { redirect_url: url } })
    } catch (error) {
        next(error)
    }
}

// Helper: validate vouchers and compute discount/final amount for an order
async function validateAndComputeVouchersForOrder(order: any, voucher_ids: string[]) {
    const vouchers = await Voucher.findAll({ where: { id: voucher_ids } })
    if (vouchers.length !== voucher_ids.length) {
        throw new AppError("One or more vouchers not found", 400)
    }

    const now = new Date()
    let fixedSum = 0
    let percentSum = 0
    for (const v of vouchers) {
        if (!v.active) throw new AppError(`Voucher ${v.id} is not active`, 400)
        if (v.expiry_date && new Date(v.expiry_date) < now) throw new AppError(`Voucher ${v.id} expired`, 400)
        if (v.max_uses && v.current_uses >= v.max_uses) throw new AppError(`Voucher ${v.id} usage limit reached`, 400)
        if (v.min_order_value && Number(order.total_amount || 0) < Number(v.min_order_value)) throw new AppError(`Order does not meet minimum for voucher ${v.id}`, 400)

        if (v.discount_type === 'percentage') {
            percentSum += Number(v.value || 0)
        } else {
            fixedSum += Number(v.value || 0)
        }
    }

    const subtotal = Number(order.total_amount || 0)
    let computedDiscount = fixedSum + (subtotal * (percentSum / 100))
    if (computedDiscount > subtotal) computedDiscount = subtotal
    const computedFinalAmount = subtotal - computedDiscount
    return { vouchers, computedDiscount, computedFinalAmount }
}

export const previewVnpayCalculation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { order_id, voucher_ids } = req.body as { order_id: string; voucher_ids?: string[] }
        const order = await Order.findByPk(order_id)
        if (!order) throw new AppError("Order not found", 404)

        // Basic response shape
        const subtotal = Number(order.total_amount || 0)
        if (!Array.isArray(voucher_ids) || voucher_ids.length === 0) {
            return res.json({ status: "success", data: { subtotal, computedDiscount: 0, computedFinalAmount: subtotal, voucher_ids: [] } })
        }

        const validation = await validateAndComputeVouchersForOrder(order, voucher_ids)
        return res.json({ status: "success", data: { subtotal, computedDiscount: validation.computedDiscount, computedFinalAmount: validation.computedFinalAmount, voucher_ids: voucher_ids } })
    } catch (error) {
        next(error)
    }
}

export const vnpayCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const params = req.query as Record<string, any>

        // Temporary debug log to help understand why debug responses may not be returned
        try {
            if (process.env.NODE_ENV !== 'production') {
                console.error('[VNPAY TRACE] vnpayCallback invoked. NODE_ENV=', process.env.NODE_ENV, 'vnp_debug=', req.query?.vnp_debug || req.query?.debug)
                console.error('[VNPAY TRACE] incoming params sample:', { vnp_TxnRef: params.vnp_TxnRef, vnp_SecureHash: params.vnp_SecureHash ? String(params.vnp_SecureHash).substr(0, 8) + '...' : undefined });
            }
        } catch (e) { /* ignore */ }

        // Verify VNPay return parameters
        let { isValid, isSuccess, kind, targetId } = paymentService.verifyVnpayReturn(params)

        // Fallback: some txnRef formats or earlier changes may produce undefined
        // kind/targetId from the service. If verification succeeded but kind is
        // missing, try a tolerant parse of params.vnp_TxnRef here so the
        // controller routing still works. This keeps the fix local to app_user
        // files and avoids touching shared services.
        if (isValid && !kind && typeof params.vnp_TxnRef === 'string') {
            try {
                const raw = params.vnp_TxnRef as string
                // Normalize: trim and keep original casing for prefix checks
                const trimmed = raw.trim()
                const firstUnderscore = trimmed.indexOf('_')
                let prefix = trimmed
                let id = ''
                if (firstUnderscore >= 0) {
                    prefix = trimmed.substring(0, firstUnderscore)
                    id = trimmed.substring(firstUnderscore + 1)
                }
                // Accept common alternative prefixes (lower/upper) and legacy forms
                const p = prefix.toUpperCase()
                if (p === 'ORDER' || p === 'ORD' || p === 'ORDR') {
                    kind = 'order'
                    targetId = id || undefined
                } else if (p === 'DEPOSIT_ORDER' || p === 'DEPOSITORD' || p === 'DEP_ORDER') {
                    kind = 'deposit_order'
                    targetId = id || undefined
                } else if (p === 'DEPOSIT_RES' || p === 'DEPOSITRES' || p === 'DEP_RES') {
                    kind = 'deposit_reservation'
                    targetId = id || undefined
                }
            } catch (e) {
                // non-fatal: leave kind/targetId as-is
                console.debug('[payment_app_user] txnRef fallback parse failed', e)
            }
        }
        // Ensure trace is visible in all environments (console.log used because the project logger may not be initialized yet)
        try {
            console.log('[VNPAY TRACE] verifyResult', { isValid, isSuccess, kind, targetId, txnRef: params.vnp_TxnRef })
        } catch (e) { /* ignore logging failure */ }

        if (!isValid) {
            // In development, return debug JSON to aid troubleshooting when:
            // - NODE_ENV !== 'production' OR
            // - debug query param present (vnp_debug=1) OR
            // - VNP_ALLOW_DEBUG=true OR
            // - request host looks like an ngrok forwarding host (convenience for dev)
            const debugRequested = String(req.query?.vnp_debug || req.query?.debug || '').toLowerCase() === '1' || String(process.env.VNP_ALLOW_DEBUG || '').toLowerCase() === 'true' || (process.env.NODE_ENV !== 'production')

            // Treat ngrok hostnames as debug requests automatically in dev to avoid
            // requiring env changes on the developer machine.
            const hostHeader = String(req.headers.host || '')
            const fromNgrok = /ngrok/i.test(hostHeader)

            if (debugRequested || fromNgrok) {
                try {
                    const paramsForVerify = { ...params }
                    delete paramsForVerify.vnp_SecureHash
                    delete paramsForVerify.vnp_SecureHashType
                    const expectedHash = generateSecureHash(paramsForVerify)

                    const debugQuery = new URLSearchParams({
                        reason: 'invalid_hash',
                        provided: params.vnp_SecureHash,
                        expected: expectedHash,
                    }).toString()

                    const clientRedirect = buildClientRedirectUrl({ 
                        kind: 'app', 
                        path: `/payment/failed?${debugQuery}`,
                        fallbackPath: `/payment/failed?${debugQuery}`
                    })
                    return res.redirect(clientRedirect)
                } catch (err) {
                    console.error('[payment_app_user] debug response generation error', err)
                    // Fallback to a simpler redirect if debug info fails to generate
                    const clientRedirect = buildClientRedirectUrl({ kind: 'app', path: `/payment/failed?reason=invalid_hash&debug_error=true`, fallbackPath: `/payment/failed?reason=invalid_hash&debug_error=true` })
                    return res.redirect(clientRedirect)
                }
            }

            const clientRedirect = buildClientRedirectUrl({ kind: 'web', path: `/payment/failed?reason=invalid_hash` })
            return res.redirect(clientRedirect)
        }

        if (kind === "order") {
            const order = await Order.findByPk(targetId!)
            if (!order) {
                return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/payment/failed?reason=order_not_found`)
            }
            if (isSuccess) {
                try {
                    // Use OrderService to handle payment success (updates, notifications, loyalty)
                    await OrderService.handlePaymentSuccess(order.id)
                } catch (err) {
                    console.error('[payment_app_user] handlePaymentSuccess error', err)
                    // Fallback: ensure order is marked paid
                    try { await order.update({ payment_status: "paid", status: "paid", payment_method: "vnpay" }) } catch {}
                }
                // Prefer deep link into the app when available
                const clientRedirect = buildClientRedirectUrl({ kind: 'app', path: `payment/success?order_id=${order.id}`, fallbackPath: `/payment/success?order_id=${order.id}` })
                return res.redirect(clientRedirect)
            } else {
                await order.update({ payment_status: "failed" })
                const clientRedirect = buildClientRedirectUrl({ kind: 'app', path: `payment/failed?order_id=${order.id}`, fallbackPath: `/payment/failed?order_id=${order.id}` })
                return res.redirect(clientRedirect)
            }
        }

        if (kind === "deposit_order") {
            const order = await Order.findByPk(targetId!)
            if (!order) {
                return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/payment/failed?reason=order_not_found`)
            }
            if (isSuccess) {
                const amount = Number(params.vnp_Amount || 0) / 100
                await order.update({ deposit_amount: Number(order.deposit_amount || 0) + amount })
                const clientRedirect = buildClientRedirectUrl({ kind: 'app', path: `payment/success?type=deposit&order_id=${order.id}`, fallbackPath: `/payment/success?type=deposit&order_id=${order.id}` })
                return res.redirect(clientRedirect)
            }
            const clientRedirect = buildClientRedirectUrl({ kind: 'app', path: `payment/failed?type=deposit&order_id=${order.id}`, fallbackPath: `/payment/failed?type=deposit&order_id=${order.id}` })
            return res.redirect(clientRedirect)
        }

        if (kind === "deposit_reservation") {
            const reservation = await Reservation.findByPk(targetId!)
            if (!reservation) {
                return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/payment/failed?reason=reservation_not_found`)
            }
            if (isSuccess) {
                const amount = Number(params.vnp_Amount || 0) / 100
                await reservation.update({ deposit_amount: Number(reservation.deposit_amount || 0) + amount })
                const clientRedirect = buildClientRedirectUrl({ kind: 'app', path: `payment/success?type=deposit&reservation_id=${reservation.id}`, fallbackPath: `/payment/success?type=deposit&reservation_id=${reservation.id}` })
                return res.redirect(clientRedirect)
            }
            const clientRedirect = buildClientRedirectUrl({ kind: 'app', path: `payment/failed?type=deposit&reservation_id=${reservation.id}`, fallbackPath: `/payment/failed?type=deposit&reservation_id=${reservation.id}` })
            return res.redirect(clientRedirect)
        }

        return res.redirect(buildClientRedirectUrl({ kind: 'web', path: `/payment/failed?reason=unknown_type` }))
    } catch (error) {
        next(error)
    }
}

export const vnpayIpn = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Log incoming IPN for debugging (headers + body) in non-production
        try {
            if (process.env.NODE_ENV !== 'production') {
                console.debug('[payment_app_user] VNPay IPN headers:', JSON.stringify(req.headers))
                console.debug('[payment_app_user] VNPay IPN body:', JSON.stringify(req.body))
            }
        } catch (e) { /* ignore logging failure */ }

        const params = req.body as Record<string, any>

        // Verify VNPay IPN parameters
        const { isValid, isSuccess, kind, targetId } = paymentService.verifyVnpayReturn(params)

        if (!isValid) {
            // If debug allowed, compute expected hash and include in logs/response for troubleshooting
            try {
                    if (process.env.NODE_ENV !== 'production' || String(process.env.VNP_ALLOW_DEBUG || '').toLowerCase() === 'true') {
                    const { generateSecureHash } = require('../config/vnpay.config')
                    const paramsForVerify = { ...params }
                    delete paramsForVerify.vnp_SecureHash
                    delete paramsForVerify.vnp_SecureHashType
                    const expected = generateSecureHash(paramsForVerify)
                    let signData: string | undefined = undefined
                    try { signData = require('../config/vnpay.config').buildSignData(paramsForVerify) } catch (e) { /* ignore */ }
                    console.debug('[payment_app_user] VNPay IPN invalid checksum, provided:', params.vnp_SecureHash, 'expected:', expected, 'signData:', signData)
                    // Still respond with checksum failed code (VNPay expects RspCode format)
                    return res.json({ RspCode: '97', Message: 'Checksum failed', provided: params.vnp_SecureHash || '', expected, signData })
                }
            } catch (err) {
                console.error('[payment_app_user] VNPay IPN debug compute error', err)
            }

            return res.json({ RspCode: "97", Message: "Checksum failed" })
        }

        if (!kind || !targetId) {
            return res.json({ RspCode: "01", Message: "Not recognized" })
        }

        if (kind === "order") {
            const order = await Order.findByPk(targetId)
            if (!order) return res.json({ RspCode: "01", Message: "Order not found" })
            if (isSuccess) {
                try {
                    await OrderService.handlePaymentSuccess(order.id)
                } catch (err) {
                    console.error('[payment_app_user] handlePaymentSuccess error', err)
                    try { await order.update({ payment_status: "paid", status: "paid", payment_method: "vnpay" }) } catch {}
                }
            } else {
                await order.update({ payment_status: "failed" })
            }
            return res.json({ RspCode: "00", Message: "Success" })
        }

        if (kind === "deposit_order") {
            const order = await Order.findByPk(targetId)
            if (!order) return res.json({ RspCode: "01", Message: "Order not found" })
            if (isSuccess) {
                const amount = Number(params.vnp_Amount || 0) / 100
                await order.update({ deposit_amount: Number(order.deposit_amount || 0) + amount })
            }
            return res.json({ RspCode: "00", Message: "Success" })
        }

        if (kind === "deposit_reservation") {
            const reservation = await Reservation.findByPk(targetId)
            if (!reservation) return res.json({ RspCode: "01", Message: "Reservation not found" })
            if (isSuccess) {
                const amount = Number(params.vnp_Amount || 0) / 100
                await reservation.update({ deposit_amount: Number(reservation.deposit_amount || 0) + amount })
            }
            return res.json({ RspCode: "00", Message: "Success" })
        }


        console.error('[VNPAY TRACE] unknown type branch reached', { kind, paramsTxnRef: params.vnp_TxnRef })
        return res.json({ RspCode: "02", Message: "Unhandled" })
    } catch (error) {
        next(error)
    }
}

export const createDepositForOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { order_id, amount, bankCode } = req.body as { order_id: string; amount: number; bankCode?: string }
        const order = await Order.findByPk(order_id)
        if (!order) throw new AppError("Order not found", 404)
        if (!VNPAY_CONFIG.VNP_TMN_CODE || !VNPAY_CONFIG.VNP_HASH_SECRET) {
            console.error('[payment_app_user] VNPay not configured: VNP_TMN_CODE or VNP_HASH_SECRET missing')
            const missing: string[] = []
            if (!VNPAY_CONFIG.VNP_TMN_CODE) missing.push('VNP_TMN_CODE')
            if (!VNPAY_CONFIG.VNP_HASH_SECRET) missing.push('VNP_HASH_SECRET')

            // Dev fallback: return mock redirect URL for local testing
            if (process.env.NODE_ENV !== 'production') {
                const defaultPort = process.env.PORT || '3000'
                const clientUrl = process.env.CLIENT_URL || `http://localhost:${defaultPort}`
                const mockRedirect = `${clientUrl}/payment/success?mock_vnpay=true&order_id=${order_id || ''}`
                return res.json({ status: 'success', data: { redirect_url: mockRedirect }, mock: true, missing_env: missing })
            }

            return res.status(503).json({
                status: 'error',
                message: 'VNPay configuration missing on server. Please set the missing environment variables and ensure the return URL is reachable by VNPay (use ngrok for local dev).',
                missing_env: missing,
                hints: {
                    ngrok: 'Run ngrok and set VNP_RETURN_URL to https://<your-ngrok>.ngrok-free.app/api/payments/vnpay/return and ApiConfig.baseUrl in the app to https://<your-ngrok>.ngrok-free.app',
                    local_return_url: 'If VNP_RETURN_URL points to localhost, VNPay cannot reach it. Use a public URL or ngrok.',
                },
            })
        }
    const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || "127.0.0.1"
    // Dev-only: accept _override_return for deposit flows as well
    const _override = (req.body && req.body._override_return) || (req.query && req.query._override_return)
    let overrideReturnUrl: string | undefined = undefined
    if (_override && process.env.NODE_ENV !== 'production') {
        try { const u = new URL(String(_override)); if (u.protocol === 'http:' || u.protocol === 'https:') overrideReturnUrl = u.toString() } catch (e) {}
    }
    const url = paymentService.generateVnpayDepositUrl("order", order_id, Number(amount), bankCode, clientIp, overrideReturnUrl)

    const wantRedirect = (String(req.query?.redirect || '').toLowerCase() === 'true') || (String(req.headers['x-redirect'] || '').toLowerCase() === 'true')
    if (wantRedirect) return res.redirect(url)

    res.json({ status: "success", data: { redirect_url: url } })
    } catch (error) {
        next(error)
    }
}

export const createDepositForReservation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { reservation_id, amount, bankCode } = req.body as { reservation_id: string; amount: number; bankCode?: string }
        const reservation = await Reservation.findByPk(reservation_id)
        if (!reservation) throw new AppError("Reservation not found", 404)
        if (!VNPAY_CONFIG.VNP_TMN_CODE || !VNPAY_CONFIG.VNP_HASH_SECRET) {
            console.error('[payment_app_user] VNPay not configured: VNP_TMN_CODE or VNP_HASH_SECRET missing')
            const missing: string[] = []
            if (!VNPAY_CONFIG.VNP_TMN_CODE) missing.push('VNP_TMN_CODE')
            if (!VNPAY_CONFIG.VNP_HASH_SECRET) missing.push('VNP_HASH_SECRET')

            // Dev fallback: return mock redirect URL for local testing
            if (process.env.NODE_ENV !== 'production') {
                const defaultPort = process.env.PORT || '3000'
                const clientUrl = process.env.CLIENT_URL || `http://localhost:${defaultPort}`
                const mockRedirect = `${clientUrl}/payment/success?mock_vnpay=true&reservation_id=${reservation_id || ''}`
                return res.json({ status: 'success', data: { redirect_url: mockRedirect }, mock: true, missing_env: missing })
            }

            return res.status(503).json({
                status: 'error',
                message: 'VNPay configuration missing on server. Please set the missing environment variables and ensure the return URL is reachable by VNPay (use ngrok for local dev).',
                missing_env: missing,
                hints: {
                    ngrok: 'Run ngrok and set VNP_RETURN_URL to https://<your-ngrok>.ngrok-free.app/api/payments/vnpay/return and ApiConfig.baseUrl in the app to https://<your-ngrok>.ngrok-free.app',
                    local_return_url: 'If VNP_RETURN_URL points to localhost, VNPay cannot reach it. Use a public URL or ngrok.',
                },
            })
        }
    const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || "127.0.0.1"
    // Dev-only: accept _override_return for deposit flows as well
    const _overrideRes = (req.body && req.body._override_return) || (req.query && req.query._override_return)
    let overrideReturnUrlRes: string | undefined = undefined
    if (_overrideRes && process.env.NODE_ENV !== 'production') {
        try { const u = new URL(String(_overrideRes)); if (u.protocol === 'http:' || u.protocol === 'https:') overrideReturnUrlRes = u.toString() } catch (e) {}
    }
    const url = paymentService.generateVnpayDepositUrl("reservation", reservation_id, Number(amount), bankCode, clientIp, overrideReturnUrlRes)

    const wantRedirect = (String(req.query?.redirect || '').toLowerCase() === 'true') || (String(req.headers['x-redirect'] || '').toLowerCase() === 'true')
    if (wantRedirect) return res.redirect(url)

    res.json({ status: "success", data: { redirect_url: url } })
    } catch (error) {
        next(error)
    }
}


// Development helper: simple success page so local dev can open the mock redirect
export const devSuccessPage = async (req: Request, res: Response, next: NextFunction) => {
        try {
                if (process.env.NODE_ENV === 'production') {
                        return res.status(404).send('Not Found')
                }

                const query = req.query as Record<string, any>
                const orderId = query.order_id || query.orderId || ''
                const reservationId = query.reservation_id || query.reservationId || ''
                const type = query.type || ''

                        const clientUrl = process.env.CLIENT_URL || ''
                                const appScheme = process.env.CLIENT_APP_SCHEME || 'restaurantapp://'

                                // If VNPay is configured, attempt to build a VNPay redirect URL for this order (dev only)
                                let vnPayUrl = ''
                                if (process.env.NODE_ENV !== 'production' && VNPAY_CONFIG.VNP_TMN_CODE && VNPAY_CONFIG.VNP_HASH_SECRET) {
                                    try {
                                        const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || '127.0.0.1'
                                        if (orderId) {
                                            const orderObj = await Order.findByPk(orderId)
                                            if (orderObj) {
                                                // Generate a VNPay redirect URL (no amount override, no bankCode)
                                                vnPayUrl = paymentService.generateVnpayRedirectUrl(orderObj, undefined, clientIp)
                                            } else {
                                                // Dev helper: if order not present in DB, build a temporary order-like object
                                                // so developers can test VNPay flow without creating DB records.
                                                const tempOrder = {
                                                    id: orderId || `DEV_${Date.now()}`,
                                                    total_amount: 100000,
                                                    final_amount: 100000,
                                                    payment_status: 'pending',
                                                }
                                                vnPayUrl = paymentService.generateVnpayRedirectUrl(tempOrder as any, undefined, clientIp)
                                            }
                                        }
                                    } catch (e) {
                                        // ignore generation errors in dev page
                                        vnPayUrl = ''
                                    }
                                }

                                // Auto-open VNPay when caller requests it via ?auto_open=true
                                const autoOpen = String(query.auto_open || '') === 'true'
                                const html = `<!doctype html>
        <html>
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width,initial-scale=1" />
                <title>Payment Success</title>
                <style>
                    :root{--bg:#f8fafc;--card:#ffffff;--muted:#6b7280;--accent:#10b981}
                    html,body{height:100%;margin:0;font-family:Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;background:var(--bg);color:#111}
                    .wrap{max-width:920px;margin:40px auto;padding:20px}
                    .card{background:var(--card);border-radius:12px;padding:28px;box-shadow:0 6px 18px rgba(15,23,42,0.06);border:1px solid rgba(15,23,42,0.04)}
                    .head{display:flex;gap:20px;align-items:center}
                    .badge{width:72px;height:72px;background:linear-gradient(135deg,#ecfdf5,#bbf7d0);border-radius:999px;display:inline-flex;align-items:center;justify-content:center}
                    .tick{font-size:36px;color:var(--accent)}
                    h1{margin:0;font-size:20px}
                    p.lead{margin:6px 0 18px;color:var(--muted)}
                    .row{display:flex;gap:20px;flex-wrap:wrap;margin-top:12px}
                    .meta{flex:1;min-width:220px}
                    .meta .label{font-size:12px;color:var(--muted);margin-bottom:6px}
                    .meta .val{font-weight:600;color:#111}
                    pre{background:#f3f4f6;padding:12px;border-radius:8px;overflow:auto}
                    .actions{margin-top:18px;display:flex;gap:12px;flex-wrap:wrap}
                    .btn{display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:8px;border:0;cursor:pointer}
                    .btn.primary{background:var(--accent);color:white}
                    .btn.ghost{background:transparent;border:1px solid #e6e6e6}
                    .small{font-size:13px}
                    .footer{margin-top:18px;color:var(--muted);font-size:13px}
                    @media (max-width:600px){.head{flex-direction:column;align-items:flex-start}.badge{width:56px;height:56px}}
                </style>
            </head>
            <body>
                <div class="wrap">
                    <div class="card">
                        <div class="head">
                            <div class="badge" aria-hidden><span class="tick">✓</span></div>
                            <div>
                                <h1>Payment Successful</h1>
                                <p class="lead">This is a development-only page to validate the VNPay mock redirect flow. You can return to the app or copy details below.</p>
                            </div>
                        </div>

                        <div class="row" style="margin-top:18px">
                            <div class="meta">
                                <div class="label">Order ID</div>
                                <div class="val" id="orderId">${orderId}</div>
                            </div>
                            <div class="meta">
                                <div class="label">Reservation ID</div>
                                <div class="val" id="reservationId">${reservationId}</div>
                            </div>
                            <div class="meta">
                                <div class="label">Type</div>
                                <div class="val">${type}</div>
                            </div>
                        </div>

                        <div style="margin-top:18px">
                            <div class="label">All query parameters</div>
                            <pre id="allParams">${JSON.stringify(query, null, 2)}</pre>
                        </div>

                        <div class="actions">
                            ${vnPayUrl ? `<a class="btn primary small" id="openVnPay" href="${vnPayUrl}" target="_blank" rel="noopener">Open VNPay</a>` : ``}
                            <button class="btn primary small" id="openApp">Open app</button>
                            <button class="btn ghost small" id="copyId">Copy order id</button>
                            <a class="btn ghost small" href="${clientUrl || '#'}" id="backToWeb" ${clientUrl? '':'onclick="return false;"'}>Back to website</a>
                            <button class="btn ghost small" id="closeWin">Close</button>
                        </div>

                        <div class="footer">Tip: On mobile, tapping "Open app" attempts to open the native app using the scheme <code>${appScheme}</code>. You can change this by setting <code>CLIENT_APP_SCHEME</code> in your backend environment.</div>
                    </div>
                </div>

                        <script>
                    const orderId = document.getElementById('orderId')?.textContent || ''
                    const reservationId = document.getElementById('reservationId')?.textContent || ''
                    const appScheme = ${JSON.stringify(appScheme)}
                            const vnPayUrl = ${JSON.stringify(vnPayUrl)}
                            const autoOpenFlag = ${JSON.stringify(autoOpen)}
                    document.getElementById('copyId')?.addEventListener('click', async () => {
                        try {
                            await navigator.clipboard.writeText(orderId || reservationId || '')
                            alert('Copied to clipboard')
                        } catch (e) {
                            prompt('Copy this value', orderId || reservationId || '')
                        }
                    })

                        document.getElementById('openApp')?.addEventListener('click', () => {
                            // Try to open native app. On desktop this will usually do nothing.
                            var target = '';
                            if (orderId && orderId.length > 0) {
                                target = 'payment/success?order_id=' + encodeURIComponent(orderId);
                            } else if (reservationId && reservationId.length > 0) {
                                target = 'payment/success?reservation_id=' + encodeURIComponent(reservationId);
                            }
                            var url = appScheme.endsWith('://') ? appScheme + target : appScheme + '://' + target;
                            // Attempt open by setting location
                            window.location.href = url;
                            // Also set a fallback: after 1.5s, focus back here
                            setTimeout(function() { /* noop */ }, 1500);
                        })

                        // If VNPay URL available, clicking the link will navigate there. Also support opening via JS for target=_blank behavior.
                        document.getElementById('openVnPay')?.addEventListener('click', (e) => {
                            // allow normal navigation; no special handling required
                        })

                        // Auto-open VNPay in a new tab/window when requested (useful for local dev)
                        if (vnPayUrl && autoOpenFlag) {
                            try {
                                window.open(vnPayUrl, '_blank', 'noopener')
                            } catch (e) {
                                // if popup blocked, navigate instead
                                window.location.href = vnPayUrl
                            }
                        }

                    document.getElementById('closeWin')?.addEventListener('click', () => {
                        try { window.close() } catch(e) { /* ignore */ }
                    })
                </script>
            </body>
        </html>`

                res.setHeader('Content-Type', 'text/html; charset=utf-8')
                res.send(html)
        } catch (error) {
                next(error)
        }
}


