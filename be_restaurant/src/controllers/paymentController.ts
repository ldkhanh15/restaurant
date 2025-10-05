import type { Request, Response, NextFunction } from "express"
import Order from "../models/Order"
import { AppError } from "../middlewares/errorHandler"
import Reservation from "../models/Reservation"
import paymentService from "../services/paymentService"
import { getIO } from "../sockets"
import { orderEvents } from "../sockets/orderSocket"

export const createVnpayPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { order_id, bankCode } = req.body as { order_id: string; bankCode?: string }
        const order = await Order.findByPk(order_id)
        if (!order) throw new AppError("Order not found", 404)

        if (req.user?.role === "customer" && order.user_id && order.user_id !== String(req.user.id)) {
            throw new AppError("Insufficient permissions", 403)
        }

        if (order.payment_status === "paid") {
            throw new AppError("Order already paid", 400)
        }

        // Get client IP
        const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || "127.0.0.1"

        const url = paymentService.generateVnpayRedirectUrl(order, bankCode, clientIp)
        res.json({ status: "success", data: { redirect_url: url } })
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
                await order.update({ payment_status: "paid", status: "paid", payment_method: "vnpay" })
                try { orderEvents.paymentCompleted(getIO(), order) } catch { }
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
                await order.update({ payment_status: "paid", status: "paid", payment_method: "vnpay" })
                try { orderEvents.paymentCompleted(getIO(), order) } catch { }
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


