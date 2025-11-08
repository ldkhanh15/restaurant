// e2e_vnpay_sim.js - generate VNPay redirect URL via app_user service then simulate VNPay final redirect (vnp_ResponseCode=00)

require('dotenv').config({ path: process.env.DOTENV_PATH || '.env' })
const { URL } = require('url')
const axios = require('axios')

;(async () => {
  try {
    const svc = require('../src/services/payment_app_userService').default
    const { generateSecureHash, buildSignData } = require('../src/config/vnpay.config')

    // Use a likely-existing order id (from logs). Adjust if needed.
    const orderId = 'e1fe0b16-de64-43c9-b2b3-d92f483b8ca7'
    const order = {
      id: orderId,
      total_amount: 90000,
      final_amount: 90000,
      payment_status: 'pending'
    }

    // Generate VNPay redirect URL using the service (this uses env VNP_* configs)
    const redirect = svc.generateVnpayRedirectUrl(order)
    console.log('\n[SIM] Generated VNPay redirect URL:')
    console.log(redirect)

    // Parse params from redirect URL
    const u = new URL(redirect)
    const params = Object.fromEntries(u.searchParams.entries())

    // Prepare callback params: copy existing params, set response code to success and add transaction no
    const cb = { ...params }
    cb.vnp_ResponseCode = '00'
    cb.vnp_TransactionNo = 'TXN' + Date.now()
    // Remove client-side secure hash so we can compute correct one for modified params
    delete cb.vnp_SecureHash
    delete cb.vnp_SecureHashType // ensure signing picks default

    // Compute expected secure hash using project's helper
    const expected = generateSecureHash(cb)
    cb.vnp_SecureHash = expected
    cb.vnp_SecureHashType = 'HMACSHA512'

    // Determine the return URL to call (use vnp_ReturnUrl param if present)
    const returnUrl = params.vnp_ReturnUrl || process.env.VNP_DEV_RETURN_OVERRIDE || process.env.VNP_RETURN_URL
    if (!returnUrl) throw new Error('No return URL available to call')

    const callbackUrl = new URL(returnUrl)
    Object.keys(cb).forEach(k => callbackUrl.searchParams.set(k, String(cb[k])))

    console.log('\n[SIM] Calling VNPay return URL (simulated)')
    console.log(callbackUrl.toString())

    // Perform GET to the return URL (follow redirects disabled so we can observe redirect location)
    const res = await axios.get(callbackUrl.toString(), { maxRedirects: 0, validateStatus: null })
    console.log('\n[SIM] Response status:', res.status)
    console.log('[SIM] Response headers:', res.headers)
    if (res.status >= 300 && res.status < 400) {
      console.log('[SIM] Redirect location:', res.headers.location)
    }
    console.log('[SIM] Body (truncated):', typeof res.data === 'string' ? res.data.slice(0, 400) : JSON.stringify(res.data).slice(0, 400))

  } catch (err) {
    console.error('[SIM] Error:', err && err.message || err)
    if (err && err.response) {
      console.error('[SIM] Response status:', err.response.status)
      console.error('[SIM] Response headers:', err.response.headers)
      console.error('[SIM] Response body:', err.response.data)
    }
    process.exit(2)
  }
})()
