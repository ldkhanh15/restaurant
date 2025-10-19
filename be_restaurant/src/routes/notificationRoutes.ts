import { Router } from "express";
import * as notificationController from "../controllers/notificationController";
import { authenticate, authorize } from "../middlewares/auth";
import { body, query } from "express-validator";
import { validate } from "../middlewares/validator";

const router = Router();

router.use(authenticate);

// Get all notifications with filters
router.get(
  "/",
  [
    query("user_id").optional().isUUID(),
    query("type")
      .optional()
      .isIn([
        "low_stock",
        "reservation_confirm",
        "promotion",
        "order_created",
        "order_updated",
        "order_status_changed",
        "reservation_created",
        "reservation_updated",
        "chat_message",
        "support_request",
        "payment_completed",
        "other",
      ]),
    query("is_read").optional().isBoolean(),
    validate,
  ],
  notificationController.getAllNotifications
);

// Get notification by ID
router.get("/:id", notificationController.getNotificationById);

// Get unread notifications for current user
router.get("/unread/count", notificationController.getUnreadCount);

// Get unread notifications for current user
router.get("/unread/list", notificationController.getUnreadNotifications);

// Get notification statistics
router.get(
  "/stats",
  authorize("admin", "employee"),
  notificationController.getNotificationStats
);

// Get recent notifications
router.get(
  "/recent",
  authorize("admin", "employee"),
  [query("limit").optional().isInt({ min: 1, max: 100 }), validate],
  notificationController.getRecentNotifications
);

// Get notifications by type
router.get(
  "/type/:type",
  authorize("admin", "employee"),
  [query("limit").optional().isInt({ min: 1, max: 100 }), validate],
  notificationController.getNotificationsByType
);

// Create new notification
router.post(
  "/",
  authorize("admin", "employee"),
  [
    body("type")
      .isIn([
        "low_stock",
        "reservation_confirm",
        "promotion",
        "order_created",
        "order_updated",
        "order_status_changed",
        "reservation_created",
        "reservation_updated",
        "chat_message",
        "support_request",
        "payment_completed",
        "other",
      ])
      .withMessage("Invalid notification type"),
    body("title").optional().isLength({ max: 200 }),
    body("content")
      .isLength({ min: 1, max: 1000 })
      .withMessage("Content must be 1-1000 characters"),
    body("user_id").optional().isUUID(),
    body("data").optional().isObject(),
    validate,
  ],
  notificationController.createNotification
);

// Update notification
router.put(
  "/:id",
  [
    body("title").optional().isLength({ max: 200 }),
    body("content").optional().isLength({ min: 1, max: 1000 }),
    body("data").optional().isObject(),
    body("is_read").optional().isBoolean(),
    validate,
  ],
  notificationController.updateNotification
);

// Delete notification
router.delete("/:id", notificationController.deleteNotification);

// Mark notification as read
router.patch("/:id/read", notificationController.markNotificationAsRead);

// Mark all notifications as read for current user
router.patch("/read-all", notificationController.markAllNotificationsAsRead);

// Delete old notifications
router.delete(
  "/cleanup",
  authorize("admin", "employee"),
  [body("days_old").optional().isInt({ min: 1 }), validate],
  notificationController.deleteOldNotifications
);

export default router;
