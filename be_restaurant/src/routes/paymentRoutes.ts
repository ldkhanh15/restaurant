import { Router } from "express";
import { body, query } from "express-validator";
import { validate } from "../middlewares/validator";
import { authenticate, authorize } from "../middlewares/auth";
import * as paymentController from "../controllers/paymentController";

const router = Router();


// VNPay return URL (redirect from VNPay)
router.get("/vnpay/return", paymentController.vnpayCallback);

// VNPay IPN (Instant Payment Notification)
router.post("/vnpay/ipn", paymentController.vnpayIpn);

router.get(
  "/",
  authenticate,
  authorize("admin"),
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("method")
      .optional()
      .isIn(["cash", "vnpay"])
      .withMessage("Method must be cash or vnpay"),
    query("status")
      .optional()
      .isIn(["pending", "completed", "failed"])
      .withMessage("Status must be pending, completed, or failed"),
    query("user_id")
      .optional()
      .isUUID()
      .withMessage("user_id must be a valid UUID"),
    query("start_date")
      .optional()
      .isISO8601()
      .withMessage("start_date must be a valid date"),
    query("end_date")
      .optional()
      .isISO8601()
      .withMessage("end_date must be a valid date"),
    validate,
  ],
  paymentController.getAllPayments
);

// Get Payment by ID
router.get(
  "/:id",
  authenticate,
  authorize("admin"),
  paymentController.getPaymentById
);

// ===== Statistics Routes =====
// Revenue Statistics
router.get(
  "/stats/revenue",
  authenticate,
  authorize("admin"),
  [
    query("start_date")
      .optional()
      .isISO8601()
      .withMessage("start_date must be a valid date"),
    query("end_date")
      .optional()
      .isISO8601()
      .withMessage("end_date must be a valid date"),
    validate,
  ],
  paymentController.getRevenueStats
);

// Order Statistics
router.get(
  "/stats/orders",
  authenticate,
  authorize("admin"),
  [
    query("start_date")
      .optional()
      .isISO8601()
      .withMessage("start_date must be a valid date"),
    query("end_date")
      .optional()
      .isISO8601()
      .withMessage("end_date must be a valid date"),
    validate,
  ],
  paymentController.getOrderStats
);

// Reservation Statistics
router.get(
  "/stats/reservations",
  authenticate,
  authorize("admin"),
  [
    query("start_date")
      .optional()
      .isISO8601()
      .withMessage("start_date must be a valid date"),
    query("end_date")
      .optional()
      .isISO8601()
      .withMessage("end_date must be a valid date"),
    validate,
  ],
  paymentController.getReservationStats
);

// Payment Statistics
router.get(
  "/stats/payments",
  authenticate,
  authorize("admin"),
  [
    query("start_date")
      .optional()
      .isISO8601()
      .withMessage("start_date must be a valid date"),
    query("end_date")
      .optional()
      .isISO8601()
      .withMessage("end_date must be a valid date"),
    validate,
  ],
  paymentController.getPaymentStats
);

// Table Revenue Statistics
router.get(
  "/stats/tables",
  authenticate,
  authorize("admin"),
  [
    query("start_date")
      .optional()
      .isISO8601()
      .withMessage("start_date must be a valid date"),
    query("end_date")
      .optional()
      .isISO8601()
      .withMessage("end_date must be a valid date"),
    validate,
  ],
  paymentController.getTableRevenueStats
);

// Customer Spending Statistics
router.get(
  "/stats/customers",
  authenticate,
  authorize("admin"),
  [
    query("start_date")
      .optional()
      .isISO8601()
      .withMessage("start_date must be a valid date"),
    query("end_date")
      .optional()
      .isISO8601()
      .withMessage("end_date must be a valid date"),
    validate,
  ],
  paymentController.getCustomerSpendingStats
);

// Daily Revenue Statistics
router.get(
  "/stats/daily",
  authenticate,
  authorize("admin"),
  [
    query("start_date")
      .isISO8601()
      .withMessage("start_date is required and must be a valid date"),
    query("end_date")
      .isISO8601()
      .withMessage("end_date is required and must be a valid date"),
    validate,
  ],
  paymentController.getDailyRevenueStats
);

// Monthly Revenue Statistics
router.get(
  "/stats/monthly",
  authenticate,
  authorize("admin"),
  [
    query("start_date")
      .isISO8601()
      .withMessage("start_date is required and must be a valid date"),
    query("end_date")
      .isISO8601()
      .withMessage("end_date is required and must be a valid date"),
    validate,
  ],
  paymentController.getMonthlyRevenueStats
);

// Dish Statistics
router.get(
  "/stats/dishes",
  authenticate,
  authorize("admin"),
  [
    query("start_date")
      .optional()
      .isISO8601()
      .withMessage("start_date must be a valid date"),
    query("end_date")
      .optional()
      .isISO8601()
      .withMessage("end_date must be a valid date"),
    validate,
  ],
  paymentController.getDishStats
);

// Dashboard Overview
router.get(
  "/stats/dashboard",
  authenticate,
  authorize("admin"),
  [
    query("start_date")
      .optional()
      .isISO8601()
      .withMessage("start_date must be a valid date"),
    query("end_date")
      .optional()
      .isISO8601()
      .withMessage("end_date must be a valid date"),
    validate,
  ],
  paymentController.getDashboardOverview
);

export default router;
