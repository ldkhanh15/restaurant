import { Router } from "express";
import { EmployeeShiftController } from "./employeeShift.controller";

const router = Router();

router.get("/", EmployeeShiftController.list);
router.get("/:id", EmployeeShiftController.get);
router.post("/", EmployeeShiftController.create);
router.put("/:id", EmployeeShiftController.update);
router.delete("/:id", EmployeeShiftController.remove);

export default router; 