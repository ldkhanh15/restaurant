import crypto from "crypto"

export const VNPAY_CONFIG = {
    VNP_VERSION: "2.1.0",
    VNP_COMMAND: "pay",
    VNP_CURR_CODE: "VND",
    VNP_LOCALE: "vn",
    VNP_TMN_CODE: process.env.VNP_TMN_CODE || "",
    VNP_HASH_SECRET: process.env.VNP_HASH_SECRET || "",
    VNP_URL: process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    // Prefer an explicit VNP_RETURN_URL. If not set, build the return URL from CLIENT_URL
    // (useful when frontend/backend are run on different hosts during development).
    VNP_RETURN_URL: process.env.VNP_RETURN_URL || `${process.env.CLIENT_URL || 'http://localhost:3000'}/api/payments/vnpay/return`,
}

// Validate essential VNPAY config at startup to catch misconfiguration early
if (!VNPAY_CONFIG.VNP_TMN_CODE) {
    console.warn('[VNPAY] Warning: VNP_TMN_CODE is not set. VNPay requests will be invalid.');
}
if (!VNPAY_CONFIG.VNP_HASH_SECRET) {
    console.warn('[VNPAY] Warning: VNP_HASH_SECRET is not set. VNPay secure hash generation will fail.');
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
            // Exclude the secure hash itself from the string to sign
            if (key === 'vnp_SecureHash' || key === 'vnp_SecureHashType') return result
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
