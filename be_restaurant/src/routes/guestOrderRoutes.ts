import { Router } from "express";
import * as guestOrderController from "../controllers/guestOrderController";
import { authenticateOptional } from "../middlewares/auth";
import { body, query, param } from "express-validator";
import { validate } from "../middlewares/validator";

const router = Router();

// All guest order routes use authenticateOptional (no auth required)
// They identify guest sessions by table_id

// Add item to order (creates order if not exists)
router.post(
  "/add-item",
  authenticateOptional,
  [
    body("table_id").isUUID().withMessage("Invalid table ID"),
    body("dish_id").isUUID().withMessage("Invalid dish ID"),
    body("quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be at least 1"),
    validate,
  ],
  guestOrderController.addItem
);

// Update item quantity
router.put(
  "/update-item-quantity",
  authenticateOptional,
  [
    body("table_id").isUUID().withMessage("Invalid table ID"),
    body("item_id").isUUID().withMessage("Invalid item ID"),
    body("quantity")
      .isInt({ min: 0 })
      .withMessage("Quantity must be non-negative"),
    validate,
  ],
  guestOrderController.updateItemQuantity
);

// Update item status (for admin to update cooking status)
router.put(
  "/update-item-status",
  authenticateOptional,
  [
    body("table_id").isUUID().withMessage("Invalid table ID"),
    body("item_id").isUUID().withMessage("Invalid item ID"),
    body("status")
      .isIn(["pending", "preparing", "ready", "completed", "cancelled"])
      .withMessage("Invalid status"),
    validate,
  ],
  guestOrderController.updateItemStatus
);

// Remove item
router.delete(
  "/remove-item",
  authenticateOptional,
  [
    query("table_id").isUUID().withMessage("Invalid table ID"),
    query("item_id").isUUID().withMessage("Invalid item ID"),
    validate,
  ],
  guestOrderController.removeItem
);

// Apply voucher
router.post(
  "/apply-voucher",
  authenticateOptional,
  [
    body("table_id").isUUID().withMessage("Invalid table ID"),
    body("voucher_code")
      .isString()
      .notEmpty()
      .withMessage("Voucher code is required"),
    validate,
  ],
  guestOrderController.applyVoucher
);

// Remove voucher
router.delete(
  "/remove-voucher",
  authenticateOptional,
  [query("table_id").isUUID().withMessage("Invalid table ID"), validate],
  guestOrderController.removeVoucher
);

// Request support
router.post(
  "/request-support",
  authenticateOptional,
  [body("table_id").isUUID().withMessage("Invalid table ID"), validate],
  guestOrderController.requestSupport
);

// Request payment
router.post(
  "/request-payment",
  authenticateOptional,
  [
    body("table_id").isUUID().withMessage("Invalid table ID"),
    body("method")
      .optional()
      .isIn(["vnpay", "cash"])
      .withMessage("Invalid payment method"),
    body("points_used")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Points used must be non-negative"),
    validate,
  ],
  guestOrderController.requestPayment
);

// Request payment retry (for failed payments)
router.post(
  "/request-payment-retry",
  authenticateOptional,
  [
    body("table_id").isUUID().withMessage("Invalid table ID"),
    body("method")
      .isIn(["vnpay", "cash"])
      .withMessage("Invalid payment method"),
    validate,
  ],
  guestOrderController.requestPaymentRetry
);

// Request cash payment
router.post(
  "/request-cash-payment",
  authenticateOptional,
  [
    body("table_id").isUUID().withMessage("Invalid table ID"),
    body("note").optional().isString(),
    body("points_used")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Points used must be non-negative"),
    validate,
  ],
  guestOrderController.requestCashPayment
);

// Get current order for table
router.get(
  "/current",
  authenticateOptional,
  [query("table_id").isUUID().withMessage("Invalid table ID"), validate],
  guestOrderController.getCurrentOrder
);

export default router;
