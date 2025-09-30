import { Router } from "express"
import * as attendanceLogController from "../controllers/attendanceLogController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

router.use(authenticate)

router.get("/", authorize("admin", "employee"), attendanceLogController.getAllAttendanceLogs)
router.get("/:id", authorize("admin", "employee"), attendanceLogController.getAttendanceLogById)
router.post("/", authorize("admin", "employee"), attendanceLogController.createAttendanceLog)
router.put("/:id", authorize("admin"), attendanceLogController.updateAttendanceLog)
router.delete("/:id", authorize("admin"), attendanceLogController.deleteAttendanceLog)

export default router
