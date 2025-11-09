import Order from "../models/Order"
import Reservation from "../models/Reservation"
import { VNPAY_CONFIG, generateSecureHash } from "../config/vnpay.config"
import qs from 'qs'

class PaymentService {
    /**
     * Generic VNPay URL builder for arbitrary amount and txnRef
     */
    // Accept an optional returnUrl which can be provided by callers (dev-only override)
    private buildVnpayUrl(amountVnd: number, orderInfo: string, txnRef: string, bankCode?: string, clientIp: string = "127.0.0.1", returnUrl?: string): string {
        const amount = Math.round(amountVnd * 100)
    // VNPay expects createDate in format YYYYMMDDHHMMSS (no 'T' or timezone)
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const createDate = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`

        // Normalize client IP: VNPay may not accept IPv6 loopback (::1); convert to IPv4 loopback
        let normalizedIp = String(clientIp || '127.0.0.1')
        if (normalizedIp === '::1') normalizedIp = '127.0.0.1'
        // Some proxies present IPv4 as IPv6 mapped (::ffff:127.0.0.1)
        if (normalizedIp.startsWith('::ffff:')) normalizedIp = normalizedIp.replace('::ffff:', '')

        // Determine effective return URL. Preference order:
        // 1. explicit returnUrl param (dev-only override)
        // 2. VNP_RETURN_URL_APP_USER environment variable (if provided)
        // 3. derive app_user return URL from configured VNP_RETURN_URL by replacing
        //    the '/api/payments' base with '/api/app_user/payment' so callbacks
        //    hit the app_user controller instead of the admin payments controller
        // 4. fallback to configured VNP_RETURN_URL
        // Additionally, in development when VNP_RETURN_URL points to localhost,
        // prefer VNP_DEV_RETURN_OVERRIDE (or its app_user-derived path) so mobile
        // devices can be reached via ngrok.
        let effectiveReturnUrl = returnUrl || String(process.env.VNP_RETURN_URL || VNPAY_CONFIG.VNP_RETURN_URL || '')
        try {
            // Prefer an explicit app_user override env var when present
            const appUserEnv = String(process.env.VNP_RETURN_URL_APP_USER || '').trim()
            if (!returnUrl && appUserEnv) {
                effectiveReturnUrl = appUserEnv
            } else if (!returnUrl && !appUserEnv) {
                // Try to derive app_user path from the configured return URL
                const configured = String(VNPAY_CONFIG.VNP_RETURN_URL || '') || String(process.env.VNP_RETURN_URL || '')
                if (configured && configured.includes('/api/payments')) {
                    effectiveReturnUrl = configured.replace('/api/payments', '/api/app_user/payment')
                } else if (!returnUrl && configured) {
                    // fallback to configured return url
                    effectiveReturnUrl = configured
                }
            }

            if (process.env.NODE_ENV !== 'production') {
                const devOverride = String(process.env.VNP_DEV_RETURN_OVERRIDE || '').trim()
                if (devOverride) {
                    if (devOverride.includes('/api/payments')) {
                        effectiveReturnUrl = devOverride.replace('/api/payments', '/api/app_user/payment')
                    } else {
                        effectiveReturnUrl = devOverride
                    }
                }
            }

            // Always prefer app_user path when the configured return URL points to admin payments
            try {
                if (effectiveReturnUrl && effectiveReturnUrl.includes('/api/payments')) {
                    effectiveReturnUrl = effectiveReturnUrl.replace('/api/payments', '/api/app_user/payment')
                }
            } catch (e) {
                /* ignore */
            }
        } catch (e) { /* ignore */ }

        // Ensure VNPay callback URL targets the app_user controller path
        let appUserReturnUrl = effectiveReturnUrl
        try {
            if (!appUserReturnUrl) {
                const base = String(process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '')
                appUserReturnUrl = base + '/api/app_user/payment/vnpay/return'
            } else {
                // If the URL points to the admin payments path, map it to app_user
                if (appUserReturnUrl.includes('/api/payments')) {
                    appUserReturnUrl = appUserReturnUrl.replace('/api/payments', '/api/app_user/payment')
                }
            }
        } catch (e) { /* ignore */ }

        const vnpParams: Record<string, any> = {
            vnp_Version: VNPAY_CONFIG.VNP_VERSION,
            vnp_Command: VNPAY_CONFIG.VNP_COMMAND,
            vnp_TmnCode: VNPAY_CONFIG.VNP_TMN_CODE,
            vnp_Amount: amount,
            vnp_CreateDate: createDate,
            vnp_CurrCode: VNPAY_CONFIG.VNP_CURR_CODE,
            vnp_IpAddr: normalizedIp,
            vnp_Locale: VNPAY_CONFIG.VNP_LOCALE,
            vnp_OrderInfo: orderInfo,
            vnp_OrderType: 'other',
            // Use app_user specific return URL to ensure callbacks hit app_user controller
            vnp_ReturnUrl: appUserReturnUrl,
            vnp_TxnRef: txnRef,
        }

        // Include the secure hash type expected by VNPay. The sandbox and
        // production integrations expect the value 'HMACSHA512'. Keep this
        // explicit to avoid mismatches that lead to "Invalid data format".
        vnpParams.vnp_SecureHashType = 'HMACSHA512'

        if (bankCode) {
            vnpParams.vnp_BankCode = bankCode
        }

        // Build signing params: copy and explicitly remove secure hash
        const paramsForSign: Record<string, any> = { ...vnpParams }
        delete paramsForSign.vnp_SecureHash

        // Use canonical generateSecureHash (it internally excludes vnp_SecureHash and vnp_SecureHashType)
        const secureHash = generateSecureHash(paramsForSign)

        // Build query string using VNPay ordering: encode keys, encode values (replace %20 with '+'), sort by encoded keys
        const sortObject = (obj: Record<string, any>) => {
            const encoded: Record<string, any> = {}
            const encodedKeys: string[] = []
            const mapEncodedToOriginal: Record<string, string> = {}
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const encKey = encodeURIComponent(key)
                    encodedKeys.push(encKey)
                    mapEncodedToOriginal[encKey] = key
                }
            }
            encodedKeys.sort()
            for (let i = 0; i < encodedKeys.length; i++) {
                const encKey = encodedKeys[i]
                const originalKey = mapEncodedToOriginal[encKey]
                const value = obj[originalKey]
                encoded[encKey] = encodeURIComponent(String(value)).replace(/%20/g, '+')
            }
            return encoded
        }

        const paramsForQuery = { ...vnpParams }
        // ensure we don't include vnp_SecureHash in the query-building copy (we will append it)
        delete paramsForQuery.vnp_SecureHash

        const sortedParams = sortObject(paramsForQuery)
        const queryString = qs.stringify(sortedParams, { encode: false })
        const finalUrl = `${VNPAY_CONFIG.VNP_URL}?${queryString}&vnp_SecureHash=${secureHash}`
        if (process.env.NODE_ENV !== 'production') {
            try {
                console.debug('[VNPAY] Generated params:', JSON.stringify(vnpParams))
                console.debug('[VNPAY] effectiveReturnUrl:', effectiveReturnUrl)
                console.debug('[VNPAY] Redirect URL:', finalUrl)
            } catch (_) {}
        }
        return finalUrl
    }
    /**
     * Generate VNPay payment URL with proper hash
     * @param order - Order object
     * @param bankCode - Optional bank code
     * @param clientIp - Client IP address
     * @returns VNPay payment URL
     */
    /**
     * Generate VNPay payment URL with optional amount override (in VND)
     */
    // Allow optional returnUrl override (dev-only) as last parameter
    generateVnpayRedirectUrl(order: Order, bankCode?: string, clientIp: string = "127.0.0.1", amountOverride?: number, returnUrl?: string): string {
        const amountVnd = typeof amountOverride === 'number' ? amountOverride : Number(order.final_amount || order.total_amount)
        // Use the full order id as txnRef (prefixed) so callback can lookup the
        // order by primary key. VNPay accepts sufficiently long txn refs in
        // sandbox; if you hit length limits switch to storing a mapping.
        const txnRef = `ORDER_${String(order.id || '')}`
        return this.buildVnpayUrl(amountVnd, `Thanh toan don hang ${order.id}`, txnRef, bankCode, clientIp, returnUrl)
    }

    /**
     * Generate VNPay URL for deposits (order or reservation)
     */
    // Allow optional returnUrl override (dev-only) as last parameter
    generateVnpayDepositUrl(target: "order" | "reservation", targetId: string, amountVnd: number, bankCode?: string, clientIp: string = "127.0.0.1", returnUrl?: string): string {
        const prefix = target === "order" ? "DEPOSIT_ORDER" : "DEPOSIT_RES"
        // Use full targetId so callback can find the referenced entity by PK
        const txnRef = `${prefix}_${String(targetId || '')}`
        const orderInfo = target === "order" ? `Dat coc don hang ${targetId}` : `Dat coc dat ban ${targetId}`
        return this.buildVnpayUrl(Number(amountVnd), orderInfo, txnRef, bankCode, clientIp, returnUrl)
    }

    /**
     * Verify VNPay return parameters
     * @param params - VNPay return parameters
     * @returns boolean indicating if payment was successful
     */
    verifyVnpayReturn(params: Record<string, any>): { isValid: boolean; isSuccess: boolean; kind?: "order" | "deposit_order" | "deposit_reservation"; targetId?: string } {
        const { vnp_SecureHash, vnp_ResponseCode, vnp_TxnRef } = params

        if (!vnp_SecureHash) {
            return { isValid: false, isSuccess: false }
        }

        // Compute expected hash using a params copy that excludes the secure hash fields
        const paramsForVerify = { ...params }
        delete paramsForVerify.vnp_SecureHash
        delete paramsForVerify.vnp_SecureHashType
        const isValid = this.verifySecureHash(paramsForVerify, vnp_SecureHash)
        const isSuccess = isValid && vnp_ResponseCode === "00"

        let kind: "order" | "deposit_order" | "deposit_reservation" | undefined
        let targetId: string | undefined
        if (typeof vnp_TxnRef === "string") {
            // VNPay txnRef may include additional underscores; treat the first
            // segment (before the first underscore) as the prefix and the
            // remainder as the identifier to support IDs that contain '_'.
            const firstUnderscore = vnp_TxnRef.indexOf('_')
            let prefix = vnp_TxnRef
            let id = ''
            if (firstUnderscore >= 0) {
                prefix = vnp_TxnRef.substring(0, firstUnderscore)
                id = vnp_TxnRef.substring(firstUnderscore + 1)
            }
            targetId = id || undefined
            if (prefix === "ORDER") kind = "order"
            else if (prefix === "DEPOSIT_ORDER") kind = "deposit_order"
            else if (prefix === "DEPOSIT_RES") kind = "deposit_reservation"
        }

        return { isValid, isSuccess, kind, targetId }
    }

    /**
     * Verify secure hash for VNPay parameters
     * @param params - VNPay parameters
     * @param secureHash - Hash to verify
     * @returns boolean indicating if hash is valid
     */
    private verifySecureHash(params: Record<string, any>, secureHash: string): boolean {
        // Developer convenience: when running locally allow requests that include
        // a debug flag (vnp_debug=1) or when VNP_ALLOW_DEBUG is enabled to bypass
        // strict HMAC verification. This helps testing with sandbox/ngrok where
        // the callback may be mutated by intermediate proxies or the sandbox UI.
        const debugFlag = String(params?.vnp_debug || params?.debug || '').toLowerCase() === '1'
        const allowDebug = String(process.env.VNP_ALLOW_DEBUG || '').toLowerCase() === 'true'
        if (process.env.NODE_ENV !== 'production' && (debugFlag || allowDebug)) {
            return true
        }

        const { generateSecureHash } = require("../config/vnpay.config")
        // Ensure we don't accidentally include secure hash fields when generating the expected hash
        const copy: Record<string, any> = { ...params }
        delete copy.vnp_SecureHash
        delete copy.vnp_SecureHashType
        const expectedHash = generateSecureHash(copy)
        return expectedHash === secureHash
    }
}

export default new PaymentService()


