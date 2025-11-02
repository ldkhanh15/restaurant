# ngrok + VNPay setup (dev) — Quick guide

This document explains how to expose your local backend to the internet using ngrok so the VNPay sandbox can redirect back to your server, and how to configure the Flutter app to use that URL for testing the VNPay flow.

Warning: do not use production credentials in ngrok/dev exposures. Keep ngrok session private while testing.

## 1) Install ngrok

- Download and install from https://ngrok.com/download
- Follow ngrok's install instructions for your OS and login with your ngrok account (optional but recommended for stable URLs).

## 2) Start ngrok for your backend port

Open a terminal on the machine that runs your backend (where the `be_restaurant` server runs). Replace `3000` with your backend port if different.

```bash
ngrok http 3000
```

Keep this terminal open while testing. ngrok will output a forwarding URL like:

```
Forwarding                    https://abcd-1234.ngrok.io -> http://localhost:3000
```

Copy the HTTPS forwarding URL (for example `https://abcd-1234.ngrok.io`).

## 3) Configure backend VNPay return URL

Your backend expects a VNPay return URL. Update the backend config (env) so `VNP_RETURN_URL` points to the ngrok URL + `/api/payments/vnpay/return`.

If using `.env` or environment variables, for example:

```env
VNP_RETURN_URL=https://abcd-1234.ngrok.io/api/payments/vnpay/return
```

- In this repository `be_restaurant/src/config/vnpay.config.ts` uses `process.env.VNP_RETURN_URL`.
- Restart your backend server after updating the env.

Note: There are two return routes in the backend: `/api/payments/vnpay/return` (admin) and `/api/app_user/payment/vnpay/return` (app user). Ensure the VNPay return URL configured in VNPay dashboard matches the endpoint your backend expects; both endpoints are present — typically the public `payments/vnpay/return` is used.

## 4) Configure the Flutter app to use ngrok

Open `lib/src/data/datasources/api_config.dart` and set `ApiConfig.baseUrl` to the ngrok base URL (no trailing slash is fine):

```dart
class ApiConfig {
  static String baseUrl = 'https://abcd-1234.ngrok.io';
  static String authToken = '';
  static String currentUserId = '';
}
```

Save the file and rebuild the app.

## 5) Test the VNPay flow in the app

- Run the app on the simulator/emulator or a physical device.
- Ensure the device/emulator has network access.
- Create or open an order and go to the payment screen.
- Select VNPay and tap pay.
- The app will call `/api/app_user/payment/vnpay/create` and open the returned VNPay `redirect_url` in the in-app WebView.
- Complete the VNPay sandbox flow: choose bank, fill info, enter OTP.
- VNPay will redirect to the `vnp_ReturnUrl` — because you set it to ngrok, the redirect will be reachable from the device and the app should intercept it and call the backend verify endpoint.
- After backend validation, the app will refresh the order and navigate to success.

## 6) If backend still uses `localhost` in the return URL

- If the return URL contains `localhost`, the WebView inside the device cannot resolve it (ERR_NAME_NOT_RESOLVED). In that case either:
  - Update backend config so VNPay return URL uses the ngrok host (preferred). Or
  - Use the app's dev fallback: set `ApiConfig.baseUrl` to the ngrok URL. The app will normalize a `localhost` return by replacing the host with `ApiConfig.baseUrl` and call the backend verify endpoint.

## 7) Troubleshooting

- ERR_NAME_NOT_RESOLVED — means the device cannot resolve/route the host (usually `localhost`); fix by using ngrok or LAN IP.
- Signature verification errors — ensure the correct VNPAY hash secret and TMN code are set in backend env and VNPay sandbox config.
- WebView loads but backend verify returns unexpected response — check backend logs for query parameters and verify logic in `be_restaurant`.

## 8) Quick checklist

- [ ] Start backend locally
- [ ] Start `ngrok http 3000` and copy HTTPS forwarding URL
- [ ] Set `VNP_RETURN_URL` in backend env to `https://<ngrok>/api/payments/vnpay/return`
- [ ] Restart backend
- [ ] Set `ApiConfig.baseUrl` in app to `https://<ngrok>` and rebuild app
- [ ] Run app and test VNPay

---

If you want, I can also add a small script to the repo that starts ngrok (if you have ngrok cli installed) and prints a reminder to update envs locally. I can create that next if you want.
