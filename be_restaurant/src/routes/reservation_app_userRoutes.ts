import { Router } from "express"
import {
  getReservations_app_user,
  createReservation_app_user,
  getReservationById_app_user,
  getReservationsByTableAndDate_app_user,
  updateReservation_app_user,
  cancelReservation_app_user,
  confirmReservation_app_user,
} from "../controllers/reservation_app_userController"
import { authenticate } from "../middlewares/auth"

const router = Router()

router.use(authenticate)

router.get("/", getReservations_app_user)
router.get('/by-table-and-date', getReservationsByTableAndDate_app_user)
router.post("/", createReservation_app_user)
router.get("/:id", getReservationById_app_user)
router.put("/:id", updateReservation_app_user)
router.put("/:id/cancel", cancelReservation_app_user)
router.put("/:id/confirm", confirmReservation_app_user)

export default router
