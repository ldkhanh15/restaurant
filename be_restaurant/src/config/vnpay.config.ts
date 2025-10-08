import crypto from "crypto"

export const VNPAY_CONFIG = {
    VNP_VERSION: "2.1.0",
    VNP_COMMAND: "pay",
    VNP_CURR_CODE: "VND",
    VNP_LOCALE: "vn",
    VNP_TMN_CODE: process.env.VNP_TMN_CODE || "",
    VNP_HASH_SECRET: process.env.VNP_HASH_SECRET || "",
    VNP_URL: process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    VNP_RETURN_URL: process.env.VNP_RETURN_URL || "http://localhost:3000/api/payments/vnpay/return",
}

/**
 * Generate VNPay secure hash using SHA512
 * @param params - Object containing VNPay parameters
 * @returns Secure hash string
 */
export const generateSecureHash = (params: Record<string, any>): string => {
    // Sort parameters alphabetically
    const sortedParams = Object.keys(params)
        .sort()
        .reduce((result: Record<string, any>, key) => {
            if (params[key] !== null && params[key] !== undefined && params[key] !== "") {
                result[key] = params[key]
            }
            return result
        }, {})

    // Create query string
    const queryString = Object.keys(sortedParams)
        .map((key) => `${key}=${sortedParams[key]}`)
        .join("&")

    // Generate hash
    const hash = crypto
        .createHmac("sha512", VNPAY_CONFIG.VNP_HASH_SECRET)
        .update(queryString)
        .digest("hex")

    return hash
}

/**
 * Verify VNPay secure hash
 * @param params - Object containing VNPay parameters
 * @param secureHash - Hash to verify
 * @returns boolean indicating if hash is valid
 */
export const verifySecureHash = (params: Record<string, any>, secureHash: string): boolean => {
    const expectedHash = generateSecureHash(params)
    return expectedHash === secureHash
}
