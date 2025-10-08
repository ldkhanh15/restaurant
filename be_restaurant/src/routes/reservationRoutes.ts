import { Router } from "express"
import * as reservationController from "../controllers/reservationController"
import { authenticate, authorize } from "../middlewares/auth"
import { body } from "express-validator"
import { validate } from "../middlewares/validator"

const router = Router()

router.use(authenticate)

router.get("/", authorize("admin", "employee"), reservationController.getAllReservations)
router.get("/:id", reservationController.getReservationById)
router.post("/", reservationController.createReservation)
router.put("/:id", reservationController.updateReservation)
router.delete("/:id", reservationController.deleteReservation)

//confirm reservation
router.patch(
    "/:id/confirm",
    authorize("admin", "employee"),
    reservationController.confirmReservation,
)

// Set event for reservation
router.patch(
    "/:id/event",
    authorize("admin", "employee"),
    [body("event_id").optional().isUUID(), body("event_fee").optional().isFloat({ min: 0 }), validate],
    reservationController.setReservationEvent,
)

// Create order from reservation (+optional items)
router.post(
    "/:id/create-order",
    authorize("admin", "employee"),
    [body("items").optional().isArray(), validate],
    reservationController.createOrderFromReservation,
)

// Add item to reservation's order
router.post(
    "/:id/items",
    authorize("admin", "employee"),
    [body("dish_id").isUUID(), body("quantity").isInt({ min: 1 }), validate],
    reservationController.addItemToReservationOrder,
)

// Check-in reservation -> set order dining
router.post(
    "/:id/checkin",
    authorize("admin", "employee"),
    reservationController.checkinReservation,
)

export default router
