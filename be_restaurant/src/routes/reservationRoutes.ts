import { Router } from "express";
import * as reservationController from "../controllers/reservationController";
import { authenticate, authorize } from "../middlewares/auth";
import { body, query } from "express-validator";
import { validate } from "../middlewares/validator";

const router = Router();

router.use(authenticate);

// Get all reservations with filters
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
  [query("id").isUUID().withMessage("Invalid reservation ID"), validate],
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
router.put(
  "/:id",
  [
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
    body("status")
      .isIn(["pending", "confirmed", "cancelled", "no_show"])
      .withMessage("Invalid status"),
    validate,
  ],
  reservationController.updateReservationStatus
);

// Check-in reservation
router.post(
  "/:id/checkin",
  // authorize("admin", "employee"),
  reservationController.checkInReservation
);

// Delete reservation
router.delete("/:id", reservationController.deleteReservation);


export default router;
