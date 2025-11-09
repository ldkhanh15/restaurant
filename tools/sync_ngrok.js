const http = require('http')
const fs = require('fs')
const path = require('path')

const NGROK_API = 'http://127.0.0.1:4040/api/tunnels'

function fetchNgrokTunnels() {
  return new Promise((resolve, reject) => {
    http.get(NGROK_API, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          resolve(parsed.tunnels || [])
        } catch (err) {
          reject(err)
        }
      })
    }).on('error', reject)
  })
}

function normalize(url) {
  if (!url) return url
  return url.endsWith('/') ? url.slice(0, -1) : url
}

function updateFile(filePath, replacer) {
  const abs = path.resolve(filePath)
  if (!fs.existsSync(abs)) {
    console.error('File not found:', abs)
    return false
  }
  const content = fs.readFileSync(abs, 'utf8')
  const newContent = replacer(content)
  if (newContent === content) return false
  fs.writeFileSync(abs, newContent, 'utf8')
  return true
}

async function main() {
  try {
    const tunnels = await fetchNgrokTunnels()
    const httpsTunnel = tunnels.find(t => t.proto === 'https' && t.public_url && t.public_url.startsWith('https://'))
    if (!httpsTunnel) {
      console.error('No https ngrok tunnel found. Is ngrok running? Web UI: http://127.0.0.1:4040')
      process.exit(2)
    }
    const publicUrl = normalize(httpsTunnel.public_url)
    console.log('Found ngrok public URL:', publicUrl)

    // Update backend .env
    const backendEnv = path.join(__dirname, '..', 'be_restaurant', '.env')
    const backendUpdated = updateFile(backendEnv, (content) => {
      return content
        .replace(/VNP_RETURN_URL=.*\n/, `VNP_RETURN_URL=${publicUrl}/api/payments/vnpay/return\n`)
        .replace(/VNP_RETURN_URL_ORDER=.*\n/, `VNP_RETURN_URL_ORDER=${publicUrl}/api/payments/vnpay/return\n`)
        .replace(/VNP_RETURN_URL_RESERVATION=.*\n/, `VNP_RETURN_URL_RESERVATION=${publicUrl}/api/payments/vnpay/return\n`)
        .replace(/VNP_DEV_RETURN_OVERRIDE=.*\n/, `VNP_DEV_RETURN_OVERRIDE=${publicUrl}/api/payments/vnpay/return\n`)
        .replace(/CLIENT_URL=.*\n/, `CLIENT_URL=${publicUrl}\n`)
    })
    if (backendUpdated) console.log('Updated backend .env with new ngrok URL')
    else console.log('Backend .env unchanged (no matching lines)')

    // Update client api_config.dart
    const clientFile = path.join(__dirname, '..', 'user-app', 'restaurant_reservation_app', 'lib', 'src', 'data', 'datasources', 'api_config.dart')
    const clientUpdated = updateFile(clientFile, (content) => {
      return content.replace(/static String baseUrl = '[^']*';/, `static String baseUrl = '${publicUrl}';`)
    })
    if (clientUpdated) console.log('Updated client ApiConfig.baseUrl')
    else console.log('Client api_config.dart unchanged (no matching line)')

    console.log('\nDone. Please restart backend and hot-restart the Flutter app.')
  } catch (err) {
    console.error('Error syncing ngrok:', err)
    process.exit(3)
  }
}

main()
