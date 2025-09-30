import { Router } from "express"
import * as employeeController from "../controllers/employeeController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

router.use(authenticate)

router.get("/", authorize("admin"), employeeController.getAllEmployees)
router.get("/:id", authorize("admin"), employeeController.getEmployeeById)
router.post("/", authorize("admin"), employeeController.createEmployee)
router.put("/:id", authorize("admin"), employeeController.updateEmployee)
router.delete("/:id", authorize("admin"), employeeController.deleteEmployee)

export default router
