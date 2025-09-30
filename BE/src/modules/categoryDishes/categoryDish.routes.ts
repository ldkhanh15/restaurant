import { Router } from "express";
import { CategoryDishController } from "./categoryDish.controller";

const router = Router();

router.get("/", CategoryDishController.list);
router.get("/:id", CategoryDishController.get);
router.post("/", CategoryDishController.create);
router.put("/:id", CategoryDishController.update);
router.delete("/:id", CategoryDishController.remove);

export default router; 