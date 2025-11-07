const dotenv = require('dotenv')
dotenv.config({ path: process.env.DOTENV_PATH || '.env' })
const crypto = require('crypto')
const axios = require('axios')

const id = '69eac384-c54f-4779-881d-f075f0be8299'
const short = id.replace(/-/g, '').slice(0, 16)
const txn = `ORDER_${short}`

function pad(n){return String(n).padStart(2,'0')}
const d = new Date()
const createDate = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`

const params = {
  vnp_Version: '2.1.0',
  vnp_Command: 'pay',
  vnp_TmnCode: process.env.VNP_TMN_CODE || '',
  vnp_Amount: Math.round(10000*100),
  vnp_CreateDate: createDate,
  vnp_CurrCode: 'VND',
  vnp_Locale: 'vn',
  vnp_OrderInfo: 'Test order payment',
  vnp_ReturnUrl: process.env.VNP_RETURN_URL || 'http://localhost:8000/api/payments/vnpay/return',
  vnp_SecureHashType: 'SHA512',
  vnp_TxnRef: txn,
}

function encodeValue(v) { return encodeURIComponent(String(v)).replace(/%20/g, '+') }
const encKeys = []
const map = {}
for (const k of Object.keys(params)) {
  const ek = encodeURIComponent(k)
  encKeys.push(ek)
  map[ek] = k
}
encKeys.sort()
const pairs = encKeys.map(ek => `${map[ek]}=${encodeValue(params[map[ek]])}`)
const signData = pairs.join('&')
const secret = process.env.VNP_HASH_SECRET || ''
const hash = crypto.createHmac('sha512', secret).update(signData).digest('hex')
params.vnp_SecureHash = hash

const qs = Object.keys(params).map(k => `${encodeURIComponent(k)}=${encodeValue(params[k])}`).join('&') + '&vnp_debug=1'
const url = 'http://localhost:8000/api/payments/vnpay/return?' + qs

console.log('Calling', url)
axios.get(url, { maxRedirects: 0, validateStatus: null }).then(r => {
  console.log('status', r.status)
  console.log('headers', r.headers)
  console.log('body', r.data)
}).catch(e => {
  console.error('error', e && e.response ? { status: e.response.status, data: e.response.data } : e.message)
})
