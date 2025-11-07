const dotenv = require('dotenv')
dotenv.config({ path: '.env' })
const { generateSecureHash } = require('../src/config/vnpay.config')
const { URL } = require('url')

const urlStr = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=4500000&vnp_Command=pay&vnp_CreateDate=20251104222830&vnp_CurrCode=VND&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang+dfa64137-98bf-45c8-bce1-90ba52925629&vnp_OrderType=other&vnp_ReturnUrl=https%3A%2F%2F9aa19d1026dc.ngrok-free.app%2Fapi%2Fpayments%2Fvnpay%2Freturn&vnp_SecureHashType=HMACSHA512&vnp_TmnCode=GW05HNWN&vnp_TxnRef=ORDER_dfa6413798bf45c8&vnp_Version=2.1.0&vnp_SecureHash=11ae97166f23b3209a6877f37fc998f76386de3013aa11261a8875a0c236cb81015bd0f8cc08507c0f2ee7a77e42decf6fb870d4b82c19043d351054c8874fb0'

const u = new URL(urlStr)
const params = {}
u.searchParams.forEach((v,k) => { params[k] = v })
const provided = params.vnp_SecureHash
if (!provided) {
  console.error('No vnp_SecureHash found in URL')
  process.exit(2)
}

delete params.vnp_SecureHash

console.log('Params used for verify:')
console.log(params)

try {
  const expected = generateSecureHash(params)
  console.log('\nprovided vnp_SecureHash: ', provided)
  console.log('expected computed:    ', expected)
  console.log('match: ', expected === provided)
} catch (err) {
  console.error('Error computing expected hash:', err)
  process.exit(3)
}
