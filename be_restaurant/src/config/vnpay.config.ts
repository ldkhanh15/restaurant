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
    // VNPay requires deterministic ordering and a specific encoding for the
    // string used to compute HMAC SHA512. Many VNPay samples encode the
    // parameter keys (encodeURIComponent) and sort by the encoded keys.
    // We follow that approach here to ensure compatibility.
    // Treat literal '+' as space (incoming query strings often use '+' for spaces)
    const encodeValue = (v: any) => encodeURIComponent(String(v).replace(/\+/g, ' ')).replace(/%20/g, '+')

    // Build a map of encodedKey -> originalKey and sort by encoded key
    // VNPay requires sorting by encoded key names and using the encoded key
    // names in the signing string. Produce signData with the encoded key
    // names to match how query parameters are built elsewhere in the code.
    const encodedKeys: string[] = []
    const mapEncodedToOriginal: Record<string, string> = {}
    for (const key of Object.keys(params)) {
        if (key === 'vnp_SecureHash' || key === 'vnp_SecureHashType' || key === 'vnp_debug' || key === 'debug') continue
        const v = params[key]
        if (v === null || v === undefined || v === '') continue
        const encKey = encodeURIComponent(key)
        encodedKeys.push(encKey)
        mapEncodedToOriginal[encKey] = key
    }
    encodedKeys.sort()

    const signPairs: string[] = []
    // Use the encoded key names in the sign string to ensure deterministic
    // ordering and exact byte representation expected by VNPay.
    for (const encKey of encodedKeys) {
        const originalKey = mapEncodedToOriginal[encKey]
        signPairs.push(`${encKey}=${encodeValue(params[originalKey])}`)
    }
    const signData = signPairs.join('&')
    if (process.env.NODE_ENV !== 'production') {
        try {
            console.debug('[VNPAY] SignData:', signData)
        } catch (_) {}
    }

    return crypto.createHmac('sha512', VNPAY_CONFIG.VNP_HASH_SECRET).update(signData).digest('hex')
}

/**
 * Build the VNPay signing string (signData) without hashing. Useful for
 * returning debug information when VNPay returns checksum errors.
 */
export const buildSignData = (params: Record<string, any>): string => {
    // Treat literal '+' as space before encoding to match VNPay form-encoding
    const encodeValue = (v: any) => encodeURIComponent(String(v).replace(/\+/g, ' ')).replace(/%20/g, '+')
    const encodedKeys: string[] = []
    const mapEncodedToOriginal: Record<string, string> = {}
    for (const key of Object.keys(params)) {
        if (key === 'vnp_SecureHash' || key === 'vnp_SecureHashType' || key === 'vnp_debug' || key === 'debug') continue
        const v = params[key]
        if (v === null || v === undefined || v === '') continue
        const encKey = encodeURIComponent(key)
        encodedKeys.push(encKey)
        mapEncodedToOriginal[encKey] = key
    }
    encodedKeys.sort()
    const signPairs: string[] = []
    for (const encKey of encodedKeys) {
        const originalKey = mapEncodedToOriginal[encKey]
        signPairs.push(`${encKey}=${encodeValue(params[originalKey])}`)
    }
    return signPairs.join('&')
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
