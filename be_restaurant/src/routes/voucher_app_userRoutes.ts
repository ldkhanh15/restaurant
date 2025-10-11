import { Router } from "express"
import * as voucherAppUserController from "../controllers/voucher_app_userController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

// Public route: Get all active vouchers for anyone
router.get("/active", voucherAppUserController.getActiveVouchers)

router.use(authenticate)

// Private route: Get vouchers specific to the logged-in user
router.get("/my-vouchers", voucherAppUserController.getUserVouchers)

// Admin/Employee routes
router.get("/", authorize("admin", "employee"), voucherAppUserController.getAllVouchers)
router.get("/:id", authorize("admin", "employee"), voucherAppUserController.getVoucherById)
router.post("/", authorize("admin"), voucherAppUserController.createVoucher)
router.put("/:id", authorize("admin"), voucherAppUserController.updateVoucher)
router.delete("/:id", authorize("admin"), voucherAppUserController.deleteVoucher)

export default router
