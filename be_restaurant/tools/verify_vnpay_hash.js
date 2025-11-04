#!/usr/bin/env node
// Usage: VNP_HASH_SECRET=yoursecret node tools/verify_vnpay_hash.js "<full_vnpay_url>"

const crypto = require('crypto');
const { URL } = require('url');

function generateSecureHash(params, secret) {
  // Sort keys alphabetically
  const sortedKeys = Object.keys(params).filter(k => params[k] !== null && params[k] !== undefined && params[k] !== '' && k !== 'vnp_SecureHash' && k !== 'vnp_SecureHashType').sort();
  const queryString = sortedKeys.map(k => `${k}=${params[k]}`).join('&');
  const hmac = crypto.createHmac('sha512', secret).update(queryString).digest('hex');
  return hmac;
}

async function main() {
  const urlArg = process.argv[2];
  if (!urlArg) {
    console.error('Usage: VNP_HASH_SECRET=yoursecret node tools/verify_vnpay_hash.js "<full_vnpay_url>"');
    process.exit(2);
  }
  const secret = process.env.VNP_HASH_SECRET;
  if (!secret) {
    console.error('Missing VNP_HASH_SECRET env. Set it before running.');
    process.exit(2);
  }
  let parsed;
  try {
    parsed = new URL(urlArg);
  } catch (e) {
    console.error('Invalid URL provided');
    process.exit(2);
  }
  const params = {};
  parsed.searchParams.forEach((v, k) => { params[k] = v; });
  const providedHash = params['vnp_SecureHash'];
  if (!providedHash) {
    console.error('No vnp_SecureHash found in URL');
    process.exit(2);
  }
  const expected = generateSecureHash(params, secret);
  console.log('Provided vnp_SecureHash:', providedHash);
  console.log('Expected vnp_SecureHash:', expected);
  console.log('Match:', expected === providedHash);
  // Show some important params
  console.log('\nKey params:');
  ['vnp_TmnCode','vnp_Amount','vnp_ReturnUrl','vnp_TxnRef','vnp_OrderInfo','vnp_Version','vnp_Command','vnp_CurrCode','vnp_IpAddr'].forEach(k => {
    if (params[k]) console.log(`${k}: ${params[k]}`);
  });
}

main();
