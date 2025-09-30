import { Router } from "express";
import { DishIngredientController } from "./dishIngredient.controller";

// created_by_cursor: true
const router = Router();

router.get("/", DishIngredientController.list);
router.post("/", DishIngredientController.create);
router.delete("/:dish_id/:ingredient_id", DishIngredientController.remove);

export default router; 