/*
  Simulate a VNPay browser redirect to our backend return endpoint by
  constructing parameters, computing secure hash using our project's
  `generateSecureHash`, and then requesting the local return endpoint.

  Usage: node tmp/simulate_vnpay_return.js
*/

const dotenv = require('dotenv')
dotenv.config({ path: process.env.DOTENV_PATH || '.env' })

const axios = require('axios')
const crypto = require('crypto')

function pad(n){return String(n).padStart(2,'0')}
const d = new Date()
const createDate = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`

// Load env for VNP configs
try { require('dotenv').config({ path: process.env.DOTENV_PATH || '.env' }) } catch(e) {}

const VNPAY_CONFIG = {
  VNP_VERSION: '2.1.0',
  VNP_COMMAND: 'pay',
  VNP_CURR_CODE: 'VND',
  VNP_LOCALE: 'vn',
  VNP_TMN_CODE: process.env.VNP_TMN_CODE || '',
  VNP_HASH_SECRET: process.env.VNP_HASH_SECRET || '',
  VNP_URL: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  VNP_RETURN_URL: process.env.VNP_RETURN_URL || `http://localhost:8000/api/payments/vnpay/return`,
}

function encodeValue(v) {
  return encodeURIComponent(String(v)).replace(/%20/g, '+')
}

function generateSecureHash(params) {
  // Build encoded-key map and sort by encoded key to match project logic
  const encodedKeys = []
  const mapEncToKey = {}
  for (const key of Object.keys(params)) {
    if (key === 'vnp_SecureHash' || key === 'vnp_SecureHashType') continue
    const v = params[key]
    if (v === null || v === undefined || v === '') continue
    const encKey = encodeURIComponent(key)
    encodedKeys.push(encKey)
    mapEncToKey[encKey] = key
  }
  encodedKeys.sort()
  const pairs = []
  for (const encKey of encodedKeys) {
    const key = mapEncToKey[encKey]
    pairs.push(`${key}=${encodeValue(params[key])}`)
  }
  const signData = pairs.join('&')
  // console.debug('[sim] SignData:', signData)
  return crypto.createHmac('sha512', VNPAY_CONFIG.VNP_HASH_SECRET).update(signData).digest('hex')
}

(async ()=>{
  try {
    const params = {
      vnp_Version: VNPAY_CONFIG.VNP_VERSION,
      vnp_Command: VNPAY_CONFIG.VNP_COMMAND,
      vnp_TmnCode: VNPAY_CONFIG.VNP_TMN_CODE,
      vnp_Amount: String(Math.round(10000 * 100)), // 10,000 VND for test
      vnp_CreateDate: createDate,
      vnp_CurrCode: VNPAY_CONFIG.VNP_CURR_CODE,
      vnp_Locale: VNPAY_CONFIG.VNP_LOCALE,
      vnp_OrderInfo: `Test payment simulate`,
      vnp_ReturnUrl: VNPAY_CONFIG.VNP_RETURN_URL,
      vnp_SecureHashType: 'SHA512',
      vnp_TxnRef: `SIM_${Date.now()}`,
    }

    const secure = generateSecureHash(params)
    params.vnp_SecureHash = secure

    const port = process.env.PORT || 8000
    const base = `http://localhost:${port}`
    const target = `${base}/api/payments/vnpay/return`

    console.log('[sim] Calling', target)
    const resp = await axios.get(target, { params, maxRedirects: 0, validateStatus: null })
    console.log('[sim] status:', resp.status)
    if (resp.status >= 300 && resp.status < 400) {
      console.log('[sim] redirect location:', resp.headers.location)
      console.log('[sim] full headers:', resp.headers)
      console.log('[sim] body snippet:', (resp.data || '').toString().slice(0, 800))
    } else {
      console.log('[sim] body:', JSON.stringify(resp.data, null, 2))
    }
  } catch (err) {
    // Print detailed error info to help debugging server responses
    try {
      console.error('[sim] error stack:', err.stack || String(err))
    } catch (e) { console.error('[sim] error (no stack)') }
    if (err && err.response) {
      try {
        console.error('[sim] response status:', err.response.status)
        console.error('[sim] response headers:', JSON.stringify(err.response.headers || {}, null, 2))
        console.error('[sim] response body:', JSON.stringify(err.response.data || err.response.body || null, null, 2))
      } catch (e) { console.error('[sim] failed to print err.response details', e) }
    }
    process.exit(2)
  }
})()
