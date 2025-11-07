import dotenv from 'dotenv'
import qs from 'qs'

dotenv.config({ path: '.env' })
// require config after dotenv so env vars are loaded
const { VNPAY_CONFIG, generateSecureHash } = require('../src/config/vnpay.config')

const build = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const createDate = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`

  const params: Record<string, any> = {
    vnp_Version: VNPAY_CONFIG.VNP_VERSION || '2.1.0',
    vnp_Command: VNPAY_CONFIG.VNP_COMMAND || 'pay',
    vnp_TmnCode: VNPAY_CONFIG.VNP_TMN_CODE,
    vnp_Amount: 30000 * 100,
    vnp_CreateDate: createDate,
    vnp_CurrCode: VNPAY_CONFIG.VNP_CURR_CODE || 'VND',
    vnp_Locale: VNPAY_CONFIG.VNP_LOCALE || 'vn',
    vnp_OrderInfo: 'Pay order',
    vnp_OrderType: 'other',
    vnp_ReturnUrl: VNPAY_CONFIG.VNP_RETURN_URL,
    vnp_TxnRef: `TEST_${Date.now()}`,
  }

  params.vnp_SecureHashType = 'HMACSHA512'

  const paramsForSign = { ...params }
  delete paramsForSign.vnp_SecureHash

  // encode and sort by encoded keys
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
  const signData = Object.keys(encoded).map(k => `${k}=${encoded[k]}`).join('&')
  const expected = generateSecureHash(paramsForSign)
  const query = qs.stringify(encoded, { encode: false })
  const url = `${VNPAY_CONFIG.VNP_URL}?${query}&vnp_SecureHash=${expected}`

  console.log('signData:', signData)
  console.log('expected:', expected)
  console.log('url:', url)
}

build()
