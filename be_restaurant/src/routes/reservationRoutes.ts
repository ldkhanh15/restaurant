import { Router } from "express";
import * as reservationController from "../controllers/reservationController";
import * as paymentController from "../controllers/paymentController";
import { authenticate, authorize } from "../middlewares/auth";
import { body, param, query } from "express-validator";
import { validate } from "../middlewares/validator";

const router = Router();

router.use(authenticate);

// Get my reservations (user-specific, requires auth only)
router.get(
  "/my-reservations",
  [
    query("date").optional().isISO8601().withMessage("Invalid date format"),
    query("status")
      .optional()
      .isIn(["pending", "confirmed", "cancelled", "no_show"]),
    validate,
  ],
  reservationController.getMyReservations
);

// Get all reservations with filters (admin/employee only)
router.get(
  "/",
  authorize("admin", "employee"),
  [
    query("date").optional().isISO8601().withMessage("Invalid date format"),
    query("status")
      .optional()
      .isIn(["pending", "confirmed", "cancelled", "no_show"]),
    query("table_id").optional().isUUID(),
    query("user_id").optional().isUUID(),
    query("event_id").optional().isUUID(),
    validate,
  ],
  reservationController.getAllReservations
);

// Get reservation by ID
router.get(
  "/:id",
  [param("id").isUUID().withMessage("Invalid reservation ID"), validate],
  reservationController.getReservationById
);

// Create new reservation
router.post(
  "/",
  [
    body("table_id").isUUID().withMessage("Invalid table ID"),
    body("reservation_time")
      .isISO8601()
      .withMessage("Invalid reservation time"),
    body("duration_minutes")
      .optional()
      .isInt({ min: 30, max: 480 })
      .withMessage("Duration must be between 30 and 480 minutes"),
    body("num_people")
      .isInt({ min: 1, max: 50 })
      .withMessage("Number of people must be between 1 and 50"),
    body("preferences").optional().isObject(),
    body("event_id").optional().isUUID().withMessage("Invalid event ID"),
    body("pre_order_items").optional().isArray(),
    body("pre_order_items.*.dish_id")
      .optional()
      .isUUID()
      .withMessage("Invalid dish ID"),
    body("pre_order_items.*.quantity")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Quantity must be at least 1"),
    validate,
  ],
  reservationController.createReservation
);

// Update reservation
router.patch(
  "/:id",
  [
    param("id").isUUID().withMessage("Invalid reservation ID"),
    body("table_id").optional().isUUID().withMessage("Invalid table ID"),
    body("reservation_time")
      .optional()
      .isISO8601()
      .withMessage("Invalid reservation time"),
    body("duration_minutes")
      .optional()
      .isInt({ min: 30, max: 480 })
      .withMessage("Duration must be between 30 and 480 minutes"),
    body("num_people")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Number of people must be between 1 and 50"),
    body("preferences").optional().isObject(),
    body("event_id").optional().isUUID().withMessage("Invalid event ID"),
    body("pre_order_items").optional().isArray(),
    body("pre_order_items.*.dish_id")
      .optional()
      .isUUID()
      .withMessage("Invalid dish ID"),
    body("pre_order_items.*.quantity")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Quantity must be at least 1"),
    validate,
  ],
  reservationController.updateReservation
);

// Update reservation status
router.patch(
  "/:id/status",
  authorize("admin", "employee"),
  [
    param("id").isUUID().withMessage("Invalid reservation ID"),
    body("status")
      .isIn(["pending", "confirmed", "completed", "cancelled", "no_show"])
      .withMessage("Invalid status"),
    validate,
  ],
  reservationController.updateReservationStatus
);

// Check-in reservation
router.post(
  "/:id/checkin",
  [param("id").isUUID().withMessage("Invalid reservation ID"), validate],
  // authorize("admin", "employee"),
  reservationController.checkInReservation
);

// Cancel reservation (admin/employee or owner)
router.post(
  "/:id/cancel",
  [
    param("id").isUUID().withMessage("Invalid reservation ID"),
    body("reason").optional().isString(),
    validate,
  ],
  reservationController.cancelReservation
);

// Request deposit payment retry (for failed payments)
router.post(
  "/:id/deposit/retry",
  [
    param("id").isUUID().withMessage("Invalid reservation ID"),
    body("bankCode").optional().isString(),
    validate,
  ],
  paymentController.requestReservationDepositRetry
);

// Delete reservation
router.delete(
  "/:id",
  [param("id").isUUID().withMessage("Invalid reservation ID"), validate],
  reservationController.deleteReservation
);

// Reservation dish management
router.post(
  "/:id/dishes",
  [
    param("id").isUUID().withMessage("Invalid reservation ID"),
    body("dish_id").isUUID().withMessage("Invalid dish ID"),
    body("quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be at least 1"),
    validate,
  ],
  reservationController.addDishToReservation
);

router.patch(
  "/:id/dishes/:dishId",
  [
    param("id").isUUID().withMessage("Invalid reservation ID"),
    param("dishId").isUUID().withMessage("Invalid dish ID"),
    body("quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be at least 1"),
    validate,
  ],
  reservationController.updateDishQuantity
);

router.delete(
  "/:id/dishes/:dishId",
  [
    param("id").isUUID().withMessage("Invalid reservation ID"),
    param("dishId").isUUID().withMessage("Invalid dish ID"),
    validate,
  ],
  reservationController.removeDishFromReservation
);

export default router;
