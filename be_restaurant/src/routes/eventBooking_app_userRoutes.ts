import { Router } from "express"
import {
  getUserEventBookings,
  createEventBooking,
  cancelEventBooking,
} from "../controllers/event_app_userController"
import { authenticate } from "../middlewares/auth"

const router = Router()

router.use(authenticate) // Tất cả các route này đều yêu cầu đăng nhập

router.get("/", getUserEventBookings)
router.post("/", createEventBooking)
router.put("/:bookingId/cancel", cancelEventBooking)

export default router