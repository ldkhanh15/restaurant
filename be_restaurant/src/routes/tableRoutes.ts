import { Router } from "express"
import * as tableController from "../controllers/tableController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

router.get("/status/:status", tableController.getTablesByStatus)
router.get("/", tableController.getAllTables)
router.get("/:id", tableController.getTableById)
router.post("/", tableController.createTable)
router.put("/:id", tableController.updateTable)
router.delete("/:id", tableController.deleteTable)


// router.use(authenticate)

// router.get("/", authorize("admin", "employee"), tableController.getAllTables)
// router.get("/:id", authorize("admin", "employee"), tableController.getTableById)
// router.post("/", authorize("admin"), tableController.createTable)
// router.put("/:id", authorize("admin", "employee"), tableController.updateTable)
// router.delete("/:id", authorize("admin"), tableController.deleteTable)

export default router
