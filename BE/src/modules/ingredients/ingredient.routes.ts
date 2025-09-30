import { Router } from "express";
import { IngredientController } from "./ingredient.controller";

const router = Router();

router.get("/", IngredientController.list);
router.get("/:id", IngredientController.get);
router.post("/", IngredientController.create);
router.put("/:id", IngredientController.update);
router.delete("/:id", IngredientController.remove);

export default router; 