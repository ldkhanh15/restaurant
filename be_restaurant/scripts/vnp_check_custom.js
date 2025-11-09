const dotenv = require('dotenv')
dotenv.config({ path: '.env' })
const { generateSecureHash } = require('../src/config/vnpay.config')
const { URL } = require('url')

const urlStr = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=35000000&vnp_Command=pay&vnp_CreateDate=20251104231901&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang+84d4f2c2-0c70-444e-99e0-07d12ba480c4&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A8000%2Fapi%2Fpayments%2Fvnpay%2Freturn&vnp_TmnCode=YECPQOOV&vnp_TxnRef=ORD_84d4f2c2-0c70-444e-99e0-07d12ba480c4&vnp_Version=2.1.0&vnp_SecureHash=7dbace771e8cabf9e8a6ff77d3ad97a99f1648f9873fee9a5f1d9d2f3ced58f7031f947629430212f5996faff83af83e9370f5dfdbbaeeb42e095af6e63165a3'

const u = new URL(urlStr)
const params = {}
u.searchParams.forEach((v,k) => { params[k] = v })
const provided = params.vnp_SecureHash
if (!provided) {
  console.error('No vnp_SecureHash found in URL')
  process.exit(2)
}

console.log('Parsed params:')
console.log(params)

delete params.vnp_SecureHash

try {
  const expected = generateSecureHash(params)
  console.log('\nprovided vnp_SecureHash: ', provided)
  console.log('expected computed:    ', expected)
  console.log('match: ', expected === provided)
} catch (err) {
  console.error('Error computing expected hash:', err)
  process.exit(3)
}
