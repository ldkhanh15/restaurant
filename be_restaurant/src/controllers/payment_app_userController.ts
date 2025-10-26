import type { Request, Response, NextFunction } from "express"
import Order from "../models/Order"
import Voucher from "../models/Voucher"
import { AppError } from "../middlewares/errorHandler"
import Reservation from "../models/Reservation"
import paymentService from "../services/payment_app_userService"
import OrderService from "../services/orderService"
import { getIO } from "../sockets"
import { orderEvents } from "../sockets/orderSocket"

export const createVnpayPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { order_id, bankCode, voucher_ids, amount } = req.body as { order_id: string; bankCode?: string; voucher_ids?: string[]; amount?: number }
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
        const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || "127.0.0.1"
        // If client passed an expected amount, ensure it matches server computation (if vouchers were provided)
        if (typeof amount === 'number' && computedFinalAmount !== undefined) {
            // Allow small rounding differences
            const diff = Math.abs(Number(amount) - Number(computedFinalAmount))
            if (diff > 0.5) { // > 0.5 VND difference considered mismatch
                throw new AppError(`Requested amount does not match server calculation (expected ${computedFinalAmount}, got ${amount})`, 400)
            }
        }

        // Generate VNPay redirect URL — pass amount override if server computed it
        const amountOverride = computedFinalAmount ?? (typeof amount === 'number' ? amount : undefined)
        const url = paymentService.generateVnpayRedirectUrl(order, bankCode, clientIp, amountOverride)
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

        // Verify VNPay return parameters
        const { isValid, isSuccess, kind, targetId } = paymentService.verifyVnpayReturn(params)

        if (!isValid) {
            return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/payment/failed?reason=invalid_hash`)
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
                return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/payment/success?order_id=${order.id}`)
            } else {
                await order.update({ payment_status: "failed" })
                return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/payment/failed?order_id=${order.id}`)
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
                return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/payment/success?type=deposit&order_id=${order.id}`)
            }
            return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/payment/failed?type=deposit&order_id=${order.id}`)
        }

        if (kind === "deposit_reservation") {
            const reservation = await Reservation.findByPk(targetId!)
            if (!reservation) {
                return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/payment/failed?reason=reservation_not_found`)
            }
            if (isSuccess) {
                const amount = Number(params.vnp_Amount || 0) / 100
                await reservation.update({ deposit_amount: Number(reservation.deposit_amount || 0) + amount })
                return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/payment/success?type=deposit&reservation_id=${reservation.id}`)
            }
            return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/payment/failed?type=deposit&reservation_id=${reservation.id}`)
        }

        return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/payment/failed?reason=unknown_type`)
    } catch (error) {
        next(error)
    }
}

export const vnpayIpn = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const params = req.body as Record<string, any>

        // Verify VNPay IPN parameters
        const { isValid, isSuccess, kind, targetId } = paymentService.verifyVnpayReturn(params)

        if (!isValid) {
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
        const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || "127.0.0.1"
        const url = paymentService.generateVnpayDepositUrl("order", order_id, Number(amount), bankCode, clientIp)
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
        const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || "127.0.0.1"
        const url = paymentService.generateVnpayDepositUrl("reservation", reservation_id, Number(amount), bankCode, clientIp)
        res.json({ status: "success", data: { redirect_url: url } })
    } catch (error) {
        next(error)
    }
}


