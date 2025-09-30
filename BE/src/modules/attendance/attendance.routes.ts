import { Router } from "express";
import { AttendanceController } from "./attendance.controller";

const router = Router();

router.get("/", AttendanceController.list);
router.get("/:id", AttendanceController.get);
router.post("/", AttendanceController.create);
router.put("/:id", AttendanceController.update);
router.delete("/:id", AttendanceController.remove);

export default router; 