import { Router } from "express"
import * as employeeShiftController from "../controllers/employeeShiftController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

router.use(authenticate)

router.get("/", authorize("admin", "employee"), employeeShiftController.getAllShifts)
router.get("/:id", authorize("admin", "employee"), employeeShiftController.getShiftById)
router.post("/", authorize("admin"), employeeShiftController.createShift)
router.put("/:id", authorize("admin"), employeeShiftController.updateShift)
router.delete("/:id", authorize("admin"), employeeShiftController.deleteShift)

export default router
