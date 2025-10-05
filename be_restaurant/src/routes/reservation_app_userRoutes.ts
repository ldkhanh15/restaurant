import { Router } from "express"
import { getReservations_app_user, createReservation_app_user } from "../controllers/reservation_app_userController"

const router = Router()

router.get("/", getReservations_app_user)
router.post("/", createReservation_app_user)

export default router
