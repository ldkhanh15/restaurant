#!/usr/bin/env node
// Simple helper to generate VNPay-style signed parameters for testing
// Usage: node mock_vnpay_notify.js --txnRef=ORD_123 --amount=100000 --returnUrl="https://.../api/payments/vnpay/return" --ipnUrl="https://.../api/payments/vnpay/ipn"

const crypto = require('crypto')
const qs = require('qs')
const dotenv = require('dotenv')
const argv = require('minimist')(process.argv.slice(2))

dotenv.config({ path: require('path').resolve(__dirname, '..', '.env') })

const VNP_URL = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
const VNP_HASH_SECRET = process.env.VNP_HASH_SECRET || ''
const VNP_TMN_CODE = process.env.VNP_TMN_CODE || ''

function encodeValue(v) {
  return encodeURIComponent(String(v)).replace(/%20/g, '+')
}

function generateSecureHash(params) {
  const filtered = {}
  Object.keys(params).sort().forEach(k => {
    if (k === 'vnp_SecureHash' || k === 'vnp_SecureHashType') return
    const v = params[k]
    if (v !== null && v !== undefined && v !== '') filtered[k] = v
  })
  const signData = Object.keys(filtered).map(k => `${k}=${encodeValue(filtered[k])}`).join('&')
  return crypto.createHmac('sha512', VNP_HASH_SECRET).update(signData).digest('hex')
}

const txnRef = argv.txnRef || `TEST_${Date.now()}`
const amount = Number(argv.amount || 10000) // VND
const returnUrl = argv.returnUrl || (process.env.VNP_RETURN_URL)
const ipnUrl = argv.ipnUrl || (process.env.VNP_RETURN_URL && process.env.VNP_RETURN_URL.replace('/return', '/ipn'))

const now = new Date()
const pad = n => String(n).padStart(2, '0')
const createDate = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`

const params = {
  vnp_Version: '2.1.0',
  vnp_Command: 'pay',
  vnp_TmnCode: VNP_TMN_CODE,
  vnp_Amount: Math.round(amount * 100),
  vnp_CreateDate: createDate,
  vnp_CurrCode: 'VND',
  vnp_Locale: 'vn',
  vnp_OrderInfo: `Test payment ${txnRef}`,
  vnp_ReturnUrl: returnUrl,
  vnp_SecureHashType: 'SHA512',
  vnp_TxnRef: txnRef,
}

const secureHash = generateSecureHash(params)
params.vnp_SecureHash = secureHash

const queryString = Object.keys(params).sort().map(k => `${k}=${encodeValue(params[k])}`).join('&')

console.log('\n=== VNPay Redirect URL (simulate browser redirect) ===')
console.log(`${VNP_URL}?${queryString}\n`)

console.log('=== Example curl to open redirect URL (browser) ===')
console.log(`curl -i "${VNP_URL}?${queryString}"`)

console.log('\n=== Example curl to POST IPN to your server ===')
if (ipnUrl) {
  const body = queryString
  console.log(`curl -i -X POST '${ipnUrl}' -H 'Content-Type: application/x-www-form-urlencoded' -d '${body}'`)
} else {
  console.log('# ipnUrl not provided and could not be inferred. Provide --ipnUrl argument to generate an IPN curl command')
}

console.log('\nNote: ensure your server (ngrok) is running and VNPay dashboard IPN/return URLs match the return URL used above.')
