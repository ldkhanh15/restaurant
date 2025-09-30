import { Router } from "express";
import { PayrollController } from "./payroll.controller";

const router = Router();

router.get("/", PayrollController.list);
router.get("/:id", PayrollController.get);
router.get("/employee/:employeeId", PayrollController.getByEmployee);
router.post("/calculate", PayrollController.calculate);
router.post("/", PayrollController.create);
router.put("/:id", PayrollController.update);
router.delete("/:id", PayrollController.remove);

export default router;
