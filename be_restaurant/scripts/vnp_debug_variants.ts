import dotenv from 'dotenv'
import qs from 'qs'

dotenv.config({ path: '.env' })
const { VNPAY_CONFIG, generateSecureHash } = require('../src/config/vnpay.config')

const pad = (n: number) => String(n).padStart(2, '0')
const nowStr = () => {
  const d = new Date()
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

function buildUrl(params: Record<string, any>) {
  const paramsForSign = { ...params }
  delete paramsForSign.vnp_SecureHash
  const encoded: Record<string, any> = {}
  const encodedKeys: string[] = []
  const mapEncodedToOriginal: Record<string, string> = {}
  for (const key of Object.keys(paramsForSign)) {
    const v = paramsForSign[key]
    if (v === null || v === undefined || v === '') continue
    const encKey = encodeURIComponent(key)
    encodedKeys.push(encKey)
    mapEncodedToOriginal[encKey] = key
  }
  encodedKeys.sort()
  for (const encKey of encodedKeys) {
    const original = mapEncodedToOriginal[encKey]
    encoded[encKey] = encodeURIComponent(String(paramsForSign[original])).replace(/%20/g, '+')
  }
  const expected = generateSecureHash(paramsForSign)
  const query = qs.stringify(encoded, { encode: false })
  const url = `${VNPAY_CONFIG.VNP_URL}?${query}&vnp_SecureHash=${expected}`
  return url
}

const base = {
  vnp_Version: VNPAY_CONFIG.VNP_VERSION || '2.1.0',
  vnp_Command: VNPAY_CONFIG.VNP_COMMAND || 'pay',
  vnp_TmnCode: VNPAY_CONFIG.VNP_TMN_CODE,
  vnp_Amount: 45000 * 100,
  vnp_CreateDate: nowStr(),
  vnp_CurrCode: VNPAY_CONFIG.VNP_CURR_CODE || 'VND',
  vnp_Locale: VNPAY_CONFIG.VNP_LOCALE || 'vn',
  vnp_TxnRef: `VAR_${Date.now()}`,
}

const variants: Array<{name:string, params: Record<string, any>}> = []

// 1 minimal required-ish
variants.push({ name: 'minimal', params: { ...base, vnp_ReturnUrl: VNPAY_CONFIG.VNP_RETURN_URL } })
// 2 include OrderInfo
variants.push({ name: 'with_orderinfo', params: { ...base, vnp_ReturnUrl: VNPAY_CONFIG.VNP_RETURN_URL, vnp_OrderInfo: 'Payment for order 123' } })
// 3 include SecureHashType explicitly
variants.push({ name: 'with_sha_type', params: { ...base, vnp_ReturnUrl: VNPAY_CONFIG.VNP_RETURN_URL, vnp_OrderInfo: 'Payment A', vnp_SecureHashType: 'HMACSHA512' } })
// 4 long OrderInfo with special chars
variants.push({ name: 'long_special_orderinfo', params: { ...base, vnp_ReturnUrl: VNPAY_CONFIG.VNP_RETURN_URL, vnp_OrderInfo: 'Đặt hàng #123: phở bò tái (x2) + nước chấm % & * ~' } })
// 5 remove vnp_CurrCode (invalid) to see different error
const bad = { ...base }
delete bad.vnp_CurrCode
variants.push({ name: 'missing_currency', params: { ...bad, vnp_ReturnUrl: VNPAY_CONFIG.VNP_RETURN_URL, vnp_OrderInfo: 'Payment missing currency' } })

for (const v of variants) {
  const url = buildUrl(v.params)
  console.log('--- VARIANT:', v.name)
  console.log(url)
}
