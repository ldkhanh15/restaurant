import { Router } from "express"
import { getAllDishes, getDishById, createDish, updateDish, deleteDish } from "../controllers/dishController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

router.get("/", getAllDishes)
router.get("/:id", getDishById)
router.post("/", authenticate, authorize("admin", "employee"), createDish)
router.put("/:id", authenticate, authorize("admin", "employee"), updateDish)
router.delete("/:id", authenticate, authorize("admin"), deleteDish)

export default router
