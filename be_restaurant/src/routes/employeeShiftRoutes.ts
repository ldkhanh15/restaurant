import { Router } from "express"
import * as employeeShiftController from "../controllers/employeeShiftController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

// router.use(authenticate)

router.get("/",  employeeShiftController.getAllShifts)
router.get("/:id", employeeShiftController.getShiftById)
router.post("/", employeeShiftController.createShift)
router.put("/:id", employeeShiftController.updateShift)
router.delete("/:id", employeeShiftController.deleteShift)

export default router
