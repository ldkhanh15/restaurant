import { Router } from "express"
import * as attendanceLogController from "../controllers/attendanceLogController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

// router.use(authenticate)

router.get("/", attendanceLogController.getAllAttendanceLogs)
router.get("/:id", attendanceLogController.getAttendanceLogById)
router.post("/", attendanceLogController.createAttendanceLog)
router.put("/:id", attendanceLogController.updateAttendanceLog)
router.delete("/:id", attendanceLogController.deleteAttendanceLog)

export default router
