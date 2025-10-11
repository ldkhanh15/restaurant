import { Router } from "express"
import * as ingredientController from "../controllers/ingredientController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

//router.use(authenticate)

router.get("/", ingredientController.getAllIngredients)
router.get("/:id", ingredientController.getIngredientById)
router.post("/", ingredientController.createIngredient)
router.put("/:id",  ingredientController.updateIngredient)
router.delete("/:id", ingredientController.deleteIngredient)



// router.get("/", authorize("admin", "employee"), ingredientController.getAllIngredients)
// router.get("/:id", authorize("admin", "employee"), ingredientController.getIngredientById)
// router.post("/", authorize("admin"), ingredientController.createIngredient)
// router.put("/:id", authorize("admin"), ingredientController.updateIngredient)
// router.delete("/:id", authorize("admin"), ingredientController.deleteIngredient)

export default router
