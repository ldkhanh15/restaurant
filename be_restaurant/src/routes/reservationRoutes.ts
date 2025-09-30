import { Router } from "express"
import * as reservationController from "../controllers/reservationController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

router.use(authenticate)

router.get("/", authorize("admin", "employee"), reservationController.getAllReservations)
router.get("/:id", reservationController.getReservationById)
router.post("/", reservationController.createReservation)
router.put("/:id", reservationController.updateReservation)
router.delete("/:id", reservationController.deleteReservation)

export default router
