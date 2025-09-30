import { Router } from "express"
import * as payrollController from "../controllers/payrollController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

router.use(authenticate)

router.get("/", authorize("admin"), payrollController.getAllPayrolls)
router.get("/:id", authorize("admin"), payrollController.getPayrollById)
router.post("/", authorize("admin"), payrollController.createPayroll)
router.put("/:id", authorize("admin"), payrollController.updatePayroll)
router.delete("/:id", authorize("admin"), payrollController.deletePayroll)

export default router
