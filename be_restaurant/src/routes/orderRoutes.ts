import { Router } from "express";
import * as orderController from "../controllers/orderController";
import { authenticate, authorize } from "../middlewares/auth";
import { body, query, param } from "express-validator";
import { validate } from "../middlewares/validator";

const router = Router();

router.use(authenticate);

// Get my orders (user-specific, requires auth only)
router.get(
  "/my-orders",
  [
    query("date").optional().isISO8601().withMessage("Invalid date format"),
    query("status")
      .optional()
      .isIn(["pending", "dining", "paid", "waiting_payment", "cancelled"]),
    validate,
  ],
  orderController.getMyOrders
);

// Get all orders with filters (admin/employee only)
router.get(
  "/",
  authorize("admin", "employee"),
  [
    query("date").optional().isISO8601().withMessage("Invalid date format"),
    query("status")
      .optional()
      .isIn([
        "pending",
        "dining",
        "paid",
        "waiting_payment",
        "paid",
        "cancelled",
      ]),
    query("user_id").optional().isUUID(),
    query("table_id").optional().isUUID(),
    validate,
  ],
  orderController.getAllOrders
);

// Get order by ID
router.get(
  "/:id",
  [param("id").isUUID().withMessage("Invalid order ID"), validate],
  orderController.getOrderById
);

// Get order by table
router.get(
  "/table/:tableId",
  [
    query("status")
      .optional()
      .isIn([
        "pending",
        "preparing",
        "ready",
        "delivered",
        "paid",
        "cancelled",
      ]),
    validate,
  ],
  orderController.getOrderByTable
);

// Create new order
router.post(
  "/",
  [body("table_id").isUUID().withMessage("Invalid table ID"), validate],
  orderController.createOrder
);

// Update order
router.put(
  "/:id",
  [
    param("id").isUUID().withMessage("Invalid order ID"),
    body("table_id").optional().isUUID().withMessage("Invalid table ID"),
    validate,
  ],
  orderController.updateOrder
);

// Update order status
router.patch(
  "/:id/status",
  authorize("admin", "employee"),
  [
    param("id").isUUID().withMessage("Invalid order ID"),
    body("status")
      .isIn(["pending", "paid", "dining", "waiting_payment", "cancelled"])
      .withMessage("Invalid status"),
    validate,
  ],
  orderController.updateOrderStatus
);

// Add item to order
router.post(
  "/:id/items",
  [
    param("id").isUUID().withMessage("Invalid order ID"),
    body("dish_id").isUUID().withMessage("Invalid dish ID"),
    body("quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be at least 1"),
    validate,
  ],
  orderController.addItemToOrder
);

// Update item quantity
router.patch(
  "/items/:itemId/quantity",
  [
    param("itemId").isUUID().withMessage("Invalid item ID"),
    body("quantity")
      .isInt({ min: 0 })
      .withMessage("Quantity must be non-negative"),
    validate,
  ],
  orderController.updateItemQuantity
);

// Update item status
router.patch(
  "/items/:itemId/status",
  authorize("admin", "employee"),
  [
    param("itemId").isUUID().withMessage("Invalid item ID"),
    body("status")
      .isIn(["pending", "completed", "preparing", "ready"])
      .withMessage("Invalid item status"),
    validate,
  ],
  orderController.updateItemStatus
);

// Delete item
router.delete("/items/:itemId", orderController.deleteItem);

// Apply voucher
router.post(
  "/:id/voucher",
  [
    param("id").isUUID().withMessage("Invalid order ID"),
    body("code").notEmpty().withMessage("Voucher code is required"),
    validate,
  ],
  orderController.applyVoucher
);

// Remove voucher
router.delete("/:id/voucher", orderController.removeVoucher);

// Merge orders
router.post(
  "/merge",
  authorize("admin", "employee"),
  [
    body("source_order_id").isUUID().withMessage("Invalid source order ID"),
    body("target_order_id").isUUID().withMessage("Invalid target order ID"),
    validate,
  ],
  orderController.mergeOrders
);

// Request support
router.post(
  "/:id/support",
  [param("id").isUUID().withMessage("Invalid order ID"), validate],
  orderController.requestSupport
);

// Request payment
router.post(
  "/:id/payment/request",
  [param("id").isUUID().withMessage("Invalid order ID"), validate],
  orderController.requestPayment
);

// Request cash payment (notify admin)
router.post(
  "/:id/payment/cash",
  [param("id").isUUID().withMessage("Invalid order ID"), validate],
  orderController.requestCashPayment
);

// Get revenue statistics
router.get(
  "/stats/revenue",
  authorize("admin", "employee"),
  orderController.getRevenueStats
);

// Get monthly statistics (12 months)
router.get(
  "/stats/monthly",
  authorize("admin", "employee"),
  orderController.getMonthlyStats
);

// Get hourly statistics (24 hours, every 2 hours)
router.get(
  "/stats/hourly",
  authorize("admin", "employee"),
  orderController.getHourlyStats
);

// Get customer statistics (7 days)
router.get(
  "/stats/customers",
  authorize("admin", "employee"),
  orderController.getCustomerStats
);

// Get today statistics
router.get(
  "/stats/today",
  authorize("admin", "employee"),
  orderController.getTodayStats
);

export default router;
