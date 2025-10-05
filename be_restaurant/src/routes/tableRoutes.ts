import { Router } from "express"
import * as tableController from "../controllers/tableController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

router.get("/available", tableController.getAvailableTables)

router.use(authenticate)

router.get("/", authorize("admin", "employee"), tableController.getAllTables)
router.get("/:id", authorize("admin", "employee"), tableController.getTableById)
router.post("/", authorize("admin"), tableController.createTable)
router.put("/:id", authorize("admin", "employee"), tableController.updateTable)
router.delete("/:id", authorize("admin"), tableController.deleteTable)

// QR check-in to create dining order directly for table
router.post(
    "/:id/checkin",
    authorize("customer", "employee", "admin"),
    tableController.checkinTableCreateOrder,
)

export default router
