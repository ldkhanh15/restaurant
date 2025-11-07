import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import logger from "./config/logger";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

// Import routes
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import dishRoutes from "./routes/dishRoutes";
import orderRoutes from "./routes/orderRoutes";
import employeeRoutes from "./routes/employeeRoutes";
import categoryDishRoutes from "./routes/categoryDishRoutes";
import ingredientRoutes from "./routes/ingredientRoutes";
import supplierRoutes from "./routes/supplierRoutes";
import tableRoutes from "./routes/tableRoutes";
import reservationRoutes from "./routes/reservationRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import eventRoutes from "./routes/eventRoutes";
import voucherRoutes from "./routes/voucherRoutes";
import employeeShiftRoutes from "./routes/employeeShiftRoutes";
import attendanceLogRoutes from "./routes/attendanceLogRoutes";
import payrollRoutes from "./routes/payrollRoutes";
import complaintRoutes from "./routes/complaintRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import blogPostRoutes from "./routes/blogPostRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import chatRoutes from "./routes/chatRoutes";
import userBehaviorRoutes from "./routes/userBehaviorRoutes";

// Import app_user routes
import menuAppUserRoutes from "./routes/menu_app_userRoutes";
import tableAppUserRoutes from "./routes/table_app_userRoutes";
import reservationAppUserRoutes from "./routes/reservation_app_userRoutes";
import authAppUserRoutes from "./routes/auth_app_userRoutes";
import orderAppUserRoutes from "./routes/order_app_userRoutes";
import reviewAppUserRoutes from "./routes/review_app_userRoutes";
import notificationAppUserRoutes from "./routes/notification_app_userRoutes";
import userAppUserRoutes from "./routes/user_app_userRoutes";
import eventAppUserRoutes from "./routes/event_app_userRoutes";
import eventBookingAppUserRoutes from "./routes/eventBooking_app_userRoutes";
import voucherAppUserRoutes from "./routes/voucher_app_userRoutes";
import voucherUsageAppUserRoutes from "./routes/voucherUsage_app_userRoutes";
import blogPostAppUserRoutes from "./routes/blogPost_app_userRoutes";
import chatMessageAppUserRoutes from "./routes/chatMessage_app_userRoutes";
import chatSessionAppUserRoutes from "./routes/chatSession_app_userRoutes";
import loyaltyAppUserRoutes from "./routes/loyalty_app_userRoutes";
import paymentAppUserRoutes from "./routes/payment_app_userRoutes";
import * as paymentAppUserController from "./controllers/payment_app_userController";

// Import models to initialize associations
import "./models/index";
import inventoryRoutes from "./routes/inventoryRoutes";
import masterRoutes from "./routes/masterRoutes";

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
console.log("CORS_ORIGIN:", process.env.CORS_ORIGIN);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust the proxy to get the real client IP from X-Forwarded-For headers (needed for ngrok)
app.set('trust proxy', true);
const swaggerDocument = YAML.load("./swagger.yaml");

// Mount tại endpoint /api-docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  // Dev helper: show if an authorization token was sent and where it came from
  if (process.env.NODE_ENV !== 'production') {
    try {
      const authHeader = String(req.headers.authorization || '')
      const hasAuth = !!authHeader
      const masked = hasAuth ? (authHeader.length > 12 ? `${authHeader.slice(0,12)}...` : authHeader) : ''
      const queryToken = (req.query && (req.query.access_token || req.query.token)) ? true : false
      // cookie-parser not guaranteed to be installed; check for cookies on the raw headers
      const cookieHeader = String(req.headers.cookie || '')
      const hasCookie = !!cookieHeader
      if (hasAuth || queryToken || hasCookie) {
        logger.info(`[dev-auth-debug] authHeader=${hasAuth} masked=${masked} queryToken=${queryToken} cookieHeader=${hasCookie}`)
      }
    } catch (e) { /* ignore debug logging failures */ }
  }
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Dev-only top-level payment success page for local testing.
// This mirrors the app user payment success endpoint and helps when the frontend
// is not running. It is intentionally available only in non-production.
app.get('/payment/success', paymentAppUserController.devSuccessPage);

// Dev-only payment failed page: return a simple JSON/HTML so redirects to
// /payment/failed from VNPay don't 404 when frontend isn't running. Only
// enabled in development to avoid interfering with production frontends.
if (process.env.NODE_ENV !== 'production') {
  app.get('/payment/failed', (req, res) => {
    const reason = String(req.query.reason || req.query.error || 'unknown')
    // Return JSON for API clients and a simple HTML for browsers
    const accept = String(req.headers.accept || '')
    if (accept.includes('text/html')) {
      return res.send(`<html><body><h1>Payment failed</h1><p>Reason: ${reason}</p></body></html>`)
    }
    return res.json({ status: 'error', message: `Payment failed`, reason })
  })
}

// Compatibility route: some sandbox/test setups redirect to /ReturnUrl (root path)
// instead of the full API path. Add a dev-only forward so these redirects still
// invoke our vnpay callback handler for debugging.
if (process.env.NODE_ENV !== 'production') {
  app.get('/ReturnUrl', (req, res, next) => {
    try {
      // Forward to the existing controller handler which expects the same query params
      return paymentAppUserController.vnpayCallback(req as any, res as any, next as any)
    } catch (err) {
      next(err)
    }
  })

  // Dev-only: expose a debug helper to compute VNPay signData and expected hash.
  // Accept any query params and return the signData and expected HMAC computed by
  // the server's `generateSecureHash`. This is intentionally limited to non-production.
  app.get('/__vnpay_debug', (req, res) => {
    try {
      const { VNPAY_CONFIG } = require('./config/vnpay.config')
      // Recreate the same signData logic used by generateSecureHash so we can return it
      const params: any = req.query || {}
      // Use canonical buildSignData to match generateSecureHash behavior
      let signData = ''
      try {
        signData = require('./config/vnpay.config').buildSignData(params)
      } catch (e) {
        // Fallback to best-effort construction if buildSignData isn't available
        const encodeValue = (v: any) => encodeURIComponent(String(v)).replace(/%20/g, '+')
        const encodedKeys: string[] = []
        const mapEncodedToOriginal: Record<string, string> = {}
        for (const key of Object.keys(params)) {
          if (key === 'vnp_SecureHash' || key === 'vnp_SecureHashType' || key === 'vnp_debug' || key === 'debug') continue
          const v = params[key]
          if (v === null || v === undefined || v === '') continue
          const encKey = encodeURIComponent(key)
          encodedKeys.push(encKey)
          mapEncodedToOriginal[encKey] = key
        }
        encodedKeys.sort()
        const signPairs: string[] = []
        for (const encKey of encodedKeys) {
          const originalKey = mapEncodedToOriginal[encKey]
          signPairs.push(`${encKey}=${encodeValue(params[originalKey])}`)
        }
        signData = signPairs.join('&')
      }
      const crypto = require('crypto')
      const secret = (process.env.VNP_HASH_SECRET || '')
      const expected = crypto.createHmac('sha512', secret).update(signData).digest('hex')
      // Also compute what the payment service thinks about this return
      try {
        const paymentService = require('./services/payment_app_userService').default
        const vr = paymentService.verifyVnpayReturn(Object.assign({}, params))
        return res.json({ status: 'ok', signData, expected, verifyResult: vr })
      } catch (e) {
        return res.json({ status: 'ok', signData, expected, verifyResult: 'error computing verifyVnpayReturn: ' + String(e) })
      }
    } catch (err) {
      return res.status(500).json({ status: 'error', error: String(err) })
    }
  })

  // Dev-only: accept a full redirect URL or raw query string and return a
  // comparison between the provided vnp_SecureHash and the server's expected
  // hash along with the canonical signData. Useful when testing locally.
  app.post('/__vnpay_compare', express.json(), (req, res) => {
    try {
      if (process.env.NODE_ENV === 'production') return res.status(404).send('Not Found')
      const payload = req.body || {}
      let params: Record<string, any> = {}
      if (payload.url) {
        try {
          const u = new URL(payload.url)
          for (const [k, v] of u.searchParams.entries()) params[k] = v
        } catch (e) {
          return res.status(400).json({ status: 'error', message: 'Invalid url' })
        }
      } else if (payload.query) {
        const sp = new URLSearchParams(payload.query)
        for (const [k, v] of sp.entries()) params[k] = v
      } else {
        return res.status(400).json({ status: 'error', message: 'Provide url or query in JSON body' })
      }

      const provided = String(params.vnp_SecureHash || '')
      const paramsForVerify = { ...params }
      delete paramsForVerify.vnp_SecureHash
      delete paramsForVerify.vnp_SecureHashType
      const { generateSecureHash, buildSignData } = require('./config/vnpay.config')
      const signData = buildSignData(paramsForVerify)
      const expected = generateSecureHash(paramsForVerify)
      return res.json({ status: 'ok', provided, expected, signData, params })
    } catch (err) {
      return res.status(500).json({ status: 'error', error: String(err) })
    }
  })
}

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dishes", dishRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/categories", categoryDishRoutes);
app.use("/api/ingredients", ingredientRoutes);
app.use("/api/inventories", inventoryRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/vouchers", voucherRoutes);
app.use("/api/shifts", employeeShiftRoutes);
app.use("/api/attendance", attendanceLogRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/blog", blogPostRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/recommendations", userBehaviorRoutes);
app.use("/api/master/restaurant", masterRoutes);


// App user lightweight endpoints (mobile app)
app.use("/api/app_user/auth", authAppUserRoutes)
app.use("/api/app_user/menu", menuAppUserRoutes)
app.use("/api/app_user/tables", tableAppUserRoutes)
app.use("/api/app_user/reservations", reservationAppUserRoutes)
app.use("/api/app_user/orders", orderAppUserRoutes)
app.use("/api/app_user/reviews", reviewAppUserRoutes)
app.use("/api/app_user/notifications", notificationAppUserRoutes)
app.use("/api/app_user/user", userAppUserRoutes)
app.use("/api/app_user/events", eventAppUserRoutes)
app.use("/api/app_user/vouchers", voucherAppUserRoutes)
app.use("/api/app_user/payment", paymentAppUserRoutes)
app.use("/api/app_user/blog", blogPostAppUserRoutes)
// Chat endpoints for mobile/web app users
app.use("/api/app_user/chat-messages", chatMessageAppUserRoutes)
app.use("/api/app_user/chat-sessions", chatSessionAppUserRoutes)
app.use("/api/app_user/loyalty", loyaltyAppUserRoutes)

// Event bookings and voucher usages (endpoints used by mobile app)
app.use("/api/app_user/event-bookings", eventBookingAppUserRoutes)
app.use("/api/voucher-usages", voucherUsageAppUserRoutes)


// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;