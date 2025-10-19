import { Router } from "express";
import * as orderController from "../controllers/orderController";
import { authenticate, authorize } from "../middlewares/auth";
import { body, query } from "express-validator";
import { validate } from "../middlewares/validator";

const router = Router();

router.use(authenticate);

// Get all orders with filters
router.get(
  "/",
  authorize("admin", "employee"),
  [
    query("date").optional().isISO8601().withMessage("Invalid date format"),
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
    query("user_id").optional().isUUID(),
    query("table_id").optional().isUUID(),
    validate,
  ],
  orderController.getAllOrders
);

// Get order by ID
router.get("/:id", orderController.getOrderById);

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
  [
    body("table_id").isUUID().withMessage("Invalid table ID"),
    validate,
  ],
  orderController.createOrder
);

// Update order
router.put(
  "/:id",
  [
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
    body("status")
      .isIn(["pending", "preparing", "ready", "delivered", "paid", "cancelled"])
      .withMessage("Invalid status"),
    validate,
  ],
  orderController.updateOrderStatus
);

// Add item to order
router.post(
  "/:id/items",
  [
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
    body("status")
      .isIn(["pending","completed"])
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
  [body("code").notEmpty().withMessage("Voucher code is required"), validate],
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
router.post("/:id/support", orderController.requestSupport);

// Request payment
router.post(
  "/:id/payment/request",
  orderController.requestPayment
);

// Get revenue statistics
router.get(
  "/stats/revenue",
  authorize("admin", "employee"),
  [
    query("start_date").isISO8601().withMessage("Invalid start date"),
    query("end_date").isISO8601().withMessage("Invalid end date"),
    validate,
  ],
  orderController.getRevenueStats
);

export default router;
