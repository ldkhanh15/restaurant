import { Router } from "express"
import { body, query } from "express-validator"
import { validate } from "../middlewares/validator"
import { authenticate } from "../middlewares/auth"
import * as paymentController from "../controllers/payment_app_userController"

const router = Router()

// Create VNPay payment URL
router.post(
  "/vnpay/create",
  authenticate,
  [
    body("order_id").isUUID().withMessage("order_id is required"),
    body("bankCode").optional().isString().withMessage("bankCode must be string"),
    validate,
  ],
  paymentController.createVnpayPayment,
)

// VNPay return URL (redirect from VNPay)
router.get(
  "/vnpay/return",
  paymentController.vnpayCallback,
)

// VNPay IPN (Instant Payment Notification)
router.post(
  "/vnpay/ipn",
  paymentController.vnpayIpn,
)

// VNPay deposit for Order
router.post(
  "/vnpay/deposit/order",
  authenticate,
  [
    body("order_id").isUUID().withMessage("order_id is required"),
    body("amount").isFloat({ gt: 0 }).withMessage("amount must be > 0"),
    body("bankCode").optional().isString(),
    validate,
  ],
  paymentController.createDepositForOrder,
)

// VNPay deposit for Reservation
router.post(
  "/vnpay/deposit/reservation",
  authenticate,
  [
    body("reservation_id").isUUID().withMessage("reservation_id is required"),
    body("amount").isFloat({ gt: 0 }).withMessage("amount must be > 0"),
    body("bankCode").optional().isString(),
    validate,
  ],
  paymentController.createDepositForReservation,
)

export default router


