import Order from "../models/Order"
import Reservation from "../models/Reservation"
import { VNPAY_CONFIG, generateSecureHash } from "../config/vnpay.config"

class PaymentService {
    /**
     * Generic VNPay URL builder for arbitrary amount and txnRef
     */
    private buildVnpayUrl(amountVnd: number, orderInfo: string, txnRef: string, bankCode?: string, clientIp: string = "127.0.0.1"): string {
        const amount = Math.round(amountVnd * 100)
        const createDate = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "")

        const vnpParams: Record<string, any> = {
            vnp_Version: VNPAY_CONFIG.VNP_VERSION,
            vnp_Command: VNPAY_CONFIG.VNP_COMMAND,
            vnp_TmnCode: VNPAY_CONFIG.VNP_TMN_CODE,
            vnp_Amount: amount,
            vnp_CreateDate: createDate,
            vnp_CurrCode: VNPAY_CONFIG.VNP_CURR_CODE,
            vnp_IpAddr: clientIp,
            vnp_Locale: VNPAY_CONFIG.VNP_LOCALE,
            vnp_OrderInfo: orderInfo,
            vnp_ReturnUrl: VNPAY_CONFIG.VNP_RETURN_URL,
            vnp_TxnRef: txnRef,
        }

        if (bankCode) {
            vnpParams.vnp_BankCode = bankCode
        }

        const secureHash = generateSecureHash(vnpParams)
        vnpParams.vnp_SecureHash = secureHash

        const queryString = Object.keys(vnpParams)
            .sort()
            .map((key) => `${key}=${encodeURIComponent(vnpParams[key])}`)
            .join("&")

        return `${VNPAY_CONFIG.VNP_URL}?${queryString}`
    }
    /**
     * Generate VNPay payment URL with proper hash
     * @param order - Order object
     * @param bankCode - Optional bank code
     * @param clientIp - Client IP address
     * @returns VNPay payment URL
     */
    generateVnpayRedirectUrl(order: Order, bankCode?: string, clientIp: string = "127.0.0.1"): string {
        const amountVnd = Number(order.final_amount || order.total_amount)
        const txnRef = `ORDER_${order.id}_${Date.now()}`
        return this.buildVnpayUrl(amountVnd, `Thanh toan don hang ${order.id}`, txnRef, bankCode, clientIp)
    }

    /**
     * Generate VNPay URL for deposits (order or reservation)
     */
    generateVnpayDepositUrl(target: "order" | "reservation", targetId: string, amountVnd: number, bankCode?: string, clientIp: string = "127.0.0.1"): string {
        const prefix = target === "order" ? "DEPOSIT_ORDER" : "DEPOSIT_RES"
        const txnRef = `${prefix}_${targetId}_${Date.now()}`
        const orderInfo = target === "order" ? `Dat coc don hang ${targetId}` : `Dat coc dat ban ${targetId}`
        return this.buildVnpayUrl(Number(amountVnd), orderInfo, txnRef, bankCode, clientIp)
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

        const isValid = this.verifySecureHash(params, vnp_SecureHash)
        const isSuccess = isValid && vnp_ResponseCode === "00"

        let kind: "order" | "deposit_order" | "deposit_reservation" | undefined
        let targetId: string | undefined
        if (typeof vnp_TxnRef === "string") {
            const parts = vnp_TxnRef.split("_")
            const prefix = parts[0]
            const id = parts[1]
            targetId = id
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
        const { generateSecureHash } = require("../config/vnpay.config")
        const expectedHash = generateSecureHash(params)
        return expectedHash === secureHash
    }
}

export default new PaymentService()


