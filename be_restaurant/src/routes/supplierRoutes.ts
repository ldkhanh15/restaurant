import { Router } from "express"
import * as supplierController from "../controllers/supplierController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

router.get("/", supplierController.getAllSuppliers)
router.get("/:id", supplierController.getSupplierById)
router.post("/", supplierController.createSupplier)
router.put("/:id", supplierController.updateSupplier)
router.delete("/:id", supplierController.deleteSupplier)

// router.use(authenticate)

// router.get("/", authorize("admin", "employee"), supplierController.getAllSuppliers)
// router.get("/:id", authorize("admin", "employee"), supplierController.getSupplierById)
// router.post("/", authorize("admin"), supplierController.createSupplier)
// router.put("/:id", authorize("admin"), supplierController.updateSupplier)
// router.delete("/:id", authorize("admin"), supplierController.deleteSupplier)

export default router
