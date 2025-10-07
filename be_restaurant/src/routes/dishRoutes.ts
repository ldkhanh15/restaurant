import { Router } from "express"
import { getAllDishes, getDishById, createDish, 
    updateDish, deleteDish, getDishesByCategoryId,
    upsertIngredientToDish
} from "../controllers/dishController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

router.get("/", getAllDishes)
router.get("/:id", getDishById)
router.get("/category/:id", getDishesByCategoryId)
router.post("/", createDish)
router.post("/ingredients/", upsertIngredientToDish)
router.put("/:id", updateDish)
router.delete("/:id", deleteDish)


// router.post("/", authenticate, authorize("admin", "employee"), createDish)
// router.put("/:id", authenticate, authorize("admin", "employee"), updateDish)
// router.delete("/:id", authenticate, authorize("admin"), deleteDish)

export default router
