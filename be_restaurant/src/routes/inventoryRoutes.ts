import { Router } from "express"
import * as inventoryController from "../controllers/inventoryController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

//router.use(authenticate)

router.get("/", inventoryController.getAllInventoryImport)
router.get("/:id", inventoryController.getInventoryById)
router.post("/",inventoryController.createInventory)
router.put("/:id",  inventoryController.updateInventory)
router.delete("/:id", inventoryController.deleteInventory)
router.post("/ingredient",inventoryController.addIngredientToInventoryImport)
router.put("/ingredient/:id",inventoryController.updateInventoryImportIngredients)

// router.get("/", authorize("admin", "employee"), ingredientController.getAllInventorys)
// router.get("/:id", authorize("admin", "employee"), ingredientController.getInventoryById)
// router.post("/", authorize("admin"), ingredientController.createInventory)
// router.put("/:id", authorize("admin"), ingredientController.updateInventory)
// router.delete("/:id", authorize("admin"), ingredientController.deleteInventory)

export default router
