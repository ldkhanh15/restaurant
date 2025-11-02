import { Router } from "express"
import * as tableController from "../controllers/tableController"
import { authenticate, authorize } from "../middlewares/auth"
import upload from "../middlewares/upload"

const router = Router()

router.get("/table-group", tableController.getTableGroup)
router.get("/table-group/:id", tableController.getTableGroupById)
router.post("/table-group", tableController.doGroupTables)
router.put("/table-group/:id", tableController.doUpdateTableGroup)
router.delete("/table-group/:id", tableController.ungroupTables)

router.get("/search", tableController.searchTables)
router.get("/status/:status", tableController.getTablesByStatus)
router.get("/", tableController.getAllTables)
router.get("/:id", tableController.getTableById)
router.post("/", upload.array("panorama_files"), tableController.createTable)
router.put("/:id", upload.array("panorama_files"), tableController.updateTable)
router.delete("/:id", tableController.deleteTable)



// router.use(authenticate)

// router.get("/", authorize("admin", "employee"), tableController.getAllTables)
// router.get("/:id", authorize("admin", "employee"), tableController.getTableById)
// router.post("/", authorize("admin"), tableController.createTable)
// router.put("/:id", authorize("admin", "employee"), tableController.updateTable)
// router.delete("/:id", authorize("admin"), tableController.deleteTable)

// QR check-in to create dining order directly for table
router.post(
    "/:id/checkin",
    authorize("customer", "employee", "admin"),
    tableController.checkinTableCreateOrder,
)

export default router
