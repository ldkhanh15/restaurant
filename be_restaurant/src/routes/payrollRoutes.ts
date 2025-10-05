import { Router } from "express"
import * as payrollController from "../controllers/payrollController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

// router.use(authenticate)

router.get("/", payrollController.getAllPayrolls)
router.get("/:id", payrollController.getPayrollById)
router.post("/", payrollController.createPayroll)
router.put("/:id", payrollController.updatePayroll)
router.delete("/:id", authorize("admin"), payrollController.deletePayroll)

export default router
