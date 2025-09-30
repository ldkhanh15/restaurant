import { Router } from "express"
import * as voucherController from "../controllers/voucherController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

router.get("/active", voucherController.getActiveVouchers)

router.use(authenticate)

router.get("/", authorize("admin", "employee"), voucherController.getAllVouchers)
router.get("/:id", authorize("admin", "employee"), voucherController.getVoucherById)
router.post("/", authorize("admin"), voucherController.createVoucher)
router.put("/:id", authorize("admin"), voucherController.updateVoucher)
router.delete("/:id", authorize("admin"), voucherController.deleteVoucher)

export default router
