import { Router } from "express"
import * as categoryDishController from "../controllers/categoryDishController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

router.get("/", categoryDishController.getAllCategories)
router.get("/:id", categoryDishController.getCategoryById)
router.post("/", categoryDishController.createCategory)
router.put("/:id", categoryDishController.updateCategory)
router.delete("/:id", categoryDishController.deleteCategory)

// router.use(authenticate)
// router.post("/", authorize("admin"), categoryDishController.createCategory)
// router.put("/:id", authorize("admin"), categoryDishController.updateCategory)
// router.delete("/:id", authorize("admin"), categoryDishController.deleteCategory)

export default router
