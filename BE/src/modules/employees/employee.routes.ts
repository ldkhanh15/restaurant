import { Router } from "express";
import { EmployeeController } from "./employee.controller";

const router = Router();

router.get("/", EmployeeController.list);
router.get("/:id", EmployeeController.get);
router.post("/", EmployeeController.create);
router.put("/:id", EmployeeController.update);
router.delete("/:id", EmployeeController.remove);
router.post("/:id/check-in", EmployeeController.checkIn);
router.post("/:id/check-out", EmployeeController.checkOut);

export default router;
