import { Router } from "express"
import { createVoucherUsage } from "../controllers/voucherUsage_app_userController"
import { authenticate } from "../middlewares/auth"

const router = Router()

router.use(authenticate) // Yêu cầu xác thực cho tất cả các route bên dưới

router.post("/", createVoucherUsage)

export default router