#!/usr/bin/env bash
# Simple helper to run ngrok and show the https forwarding URL
PORT=${1:-3000}
if ! command -v ngrok >/dev/null 2>&1; then
  echo "ngrok not found. Install from https://ngrok.com/download"
  exit 1
fi

echo "Starting ngrok for http://localhost:${PORT}"
ngrok http ${PORT} &
NGROK_PID=$!
sleep 1
# Try to get the forwarding URL via the local ngrok API
for i in {1..10}; do
  sleep 1
  FORWARDING=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null | jq -r '.tunnels[] | select(.proto=="https") | .public_url' 2>/dev/null)
  if [ -n "$FORWARDING" ] && [ "$FORWARDING" != "null" ]; then
    echo "ngrok forwarding URL: $FORWARDING"
    echo "Set your backend VNP_RETURN_URL to ${FORWARDING}/api/payments/vnpay/return and ApiConfig.baseUrl to ${FORWARDING}" 
    exit 0
  fi
done

echo "Could not retrieve ngrok forwarding URL. Is ngrok running?"
exit 1
