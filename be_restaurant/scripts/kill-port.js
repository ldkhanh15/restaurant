#!/usr/bin/env node
const child_process = require('child_process')
const os = require('os')

// Determine port: prefer process.env, fall back to reading .env file if present
let port = process.env.PORT
if (!port) {
  try {
    const fs = require('fs')
    const envContent = fs.readFileSync(require('path').resolve(process.cwd(), '.env'), 'utf8')
    const m = envContent.match(/^\s*PORT\s*=\s*(\d+)\s*$/m)
    if (m) port = m[1]
  } catch (e) {
    // ignore if .env not present
  }
}
port = port || '8000'

function run(cmd) {
  try {
    return child_process.execSync(cmd, { stdio: 'pipe' }).toString().trim()
  } catch (e) {
    return ''
  }
}

// macOS: use lsof to find processes listening on the port
if (os.platform() === 'darwin' || os.platform() === 'linux') {
  try {
    const out = run(`lsof -iTCP:${port} -sTCP:LISTEN -n -P`) || ''
    if (!out) {
      process.exit(0)
    }
    const lines = out.split('\n').slice(1)
    const pids = new Set()
    lines.forEach(line => {
      const cols = line.trim().split(/\s+/)
      if (cols[1]) pids.add(cols[1])
    })
    pids.forEach(pid => {
      try {
        process.kill(Number(pid), 'SIGKILL')
        console.log(`Killed PID ${pid} listening on port ${port}`)
      } catch (err) {
        console.warn(`Failed to kill PID ${pid}:`, err.message)
      }
    })
  } catch (err) {
    // ignore
  }
}

process.exit(0)
