import { Router } from "express"
import { getAllOrders, getOrderById, createOrder, updateOrder, deleteOrder, getOrdersByUser, getOrdersByStatus, getOrderDetails, updateOrderStatus, applyVoucherToOrder, addItemToOrder, updateOrderItemQuantity, deleteOrderItem, changeOrderTable, requestSupport, cancelOrderItem, updateOrderItemStatus, getOrderSummary, splitOrder, removeVoucherFromOrder, applyManualDiscount, requestPayment, updatePaymentMethod, completePayment, getInvoice, createOrderReview, createOrderComplaint, cancelOrder, getPrintPreview, setOrderEvent, mergeOrders } from "../controllers/orderController"
import { body } from "express-validator"
import { validate } from "../middlewares/validator"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

router.get("/", authenticate, authorize("admin", "employee"), getAllOrders)
router.get("/user/:userId", authenticate, getOrdersByUser)
router.get("/status/:status", authenticate, getOrdersByStatus)
router.get("/:id/details", authenticate, getOrderDetails)
router.get("/:id", authenticate, getOrderById)
router.post(
  "/",
  authenticate,
  [
    body("items").isArray({ min: 1 }).withMessage("Items are required"),
    body("items.*.dish_id").isUUID().withMessage("dish_id must be UUID"),
    body("items.*.price").isFloat({ gt: 0 }).withMessage("price must be > 0"),
    body("voucher_code").optional().isString(),
    body("table_id").optional().isUUID(),
    body("user_id").optional().isUUID(),
    body("staff_id").optional().isUUID(),
    body("status").optional().isIn(["pending", "dining"]).withMessage("invalid initial status"),
    validate,
  ],
  createOrder,
)
router.post(
  "/:id/apply-voucher",
  authenticate,
  [body("code").notEmpty().withMessage("Voucher code is required"), validate],
  applyVoucherToOrder,
)
router.put("/:id/status", authenticate, updateOrderStatus)
router.put("/:id", authenticate, updateOrder)
router.delete("/:id", authenticate, authorize("admin"), deleteOrder)

// Add new item into existing order
router.post(
  "/:id/items",
  authenticate,
  authorize("customer", "employee", "admin"),
  [
    body("dish_id").isUUID().withMessage("dish_id must be UUID"),
    body("quantity").isInt({ min: 1 }).withMessage("quantity must be >= 1"),
    validate,
  ],
  addItemToOrder,
)

// Update quantity of an order item
router.patch(
  "/:orderId/items/:itemId",
  authenticate,
  authorize("customer", "employee", "admin"),
  [body("quantity").isInt({ min: 0 }).withMessage("quantity must be >= 0"), validate],
  updateOrderItemQuantity,
)

// Delete an order item
router.delete(
  "/:orderId/items/:itemId",
  authenticate,
  authorize("customer", "employee", "admin"),
  deleteOrderItem,
)

// Change table
router.put(
  "/:id/change-table",
  authenticate,
  authorize("employee", "admin"),
  [body("new_table_id").isUUID().withMessage("new_table_id must be UUID"), validate],
  changeOrderTable,
)

// Request support (emit WS)
router.post(
  "/:id/request-support",
  authenticate,
  authorize("customer", "employee", "admin"),
  requestSupport,
)

// Cancel an item not prepared yet
router.delete(
  "/:orderId/items/:itemId/cancel",
  authenticate,
  authorize("customer", "employee", "admin"),
  cancelOrderItem,
)

// Update item status
router.patch(
  "/:orderId/items/:itemId/status",
  authenticate,
  authorize("employee", "admin"),
  [body("status").isIn(["pending", "completed"]).withMessage("invalid item status"), validate],
  updateOrderItemStatus,
)

// Summary
router.get(
  "/:id/summary",
  authenticate,
  authorize("customer", "employee", "admin"),
  getOrderSummary,
)

// Split bill
router.post(
  "/:id/split",
  authenticate,
  authorize("employee", "admin"),
  [body("item_ids").isArray({ min: 1 }).withMessage("item_ids is required"), validate],
  splitOrder,
)

// Remove voucher
router.delete(
  "/:id/remove-voucher",
  authenticate,
  authorize("customer", "employee", "admin"),
  removeVoucherFromOrder,
)

// Manual discount
router.patch(
  "/:id/discount",
  authenticate,
  authorize("employee", "admin"),
  [body("amount").isFloat({ min: 0 }).withMessage("amount must be >= 0"), validate],
  applyManualDiscount,
)

// Set event for order
router.patch(
  "/:id/event",
  authenticate,
  authorize("employee", "admin"),
  [body("event_id").optional().isUUID(), body("event_fee").optional().isFloat({ min: 0 }), validate],
  setOrderEvent,
)

// Request payment
router.post(
  "/:id/request-payment",
  authenticate,
  authorize("customer", "employee", "admin"),
  requestPayment,
)

// Payment method
router.patch(
  "/:id/payment-method",
  authenticate,
  authorize("customer", "employee", "admin"),
  [body("payment_method").isIn(["cash", "vnpay", "momo", "zalopay", "card", "qr"]).withMessage("invalid payment method"), validate],
  updatePaymentMethod,
)

// Complete payment
router.patch(
  "/:id/complete-payment",
  authenticate,
  authorize("employee", "admin"),
  completePayment,
)

// Invoice
router.get(
  "/:id/invoice",
  authenticate,
  authorize("customer", "employee", "admin"),
  getInvoice,
)

// Post-payment review & complaint
router.post(
  "/:id/review",
  authenticate,
  authorize("customer"),
  [body("type").isIn(["dish", "table"]).withMessage("invalid type"), body("rating").isInt({ min: 1, max: 5 }), validate],
  createOrderReview,
)

router.post(
  "/:id/complaint",
  authenticate,
  authorize("customer", "employee", "admin"),
  [body("description").notEmpty(), validate],
  createOrderComplaint,
)

// Update order status
router.patch(
  "/:id/status",
  authenticate,
  authorize("employee", "admin"),
  [body("status").isIn(["pending", "dining", "waiting_payment", "preparing", "ready", "delivered", "paid", "cancelled"]).withMessage("invalid status"), validate],
  updateOrderStatus,
)

// Cancel order with reason
router.delete(
  "/:id/cancel",
  authenticate,
  authorize("employee", "admin"),
  cancelOrder,
)

// Print preview
router.get(
  "/:id/print-preview",
  authenticate,
  authorize("employee", "admin"),
  getPrintPreview,
)

// Merge two active orders by table
router.post(
  "/merge",
  authenticate,
  authorize("employee", "admin"),
  [
    body("source_table_id").isUUID().withMessage("source_table_id required"),
    body("target_table_id").isUUID().withMessage("target_table_id required"),
    validate,
  ],
  mergeOrders,
)



export default router
