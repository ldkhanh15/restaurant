import { Router } from "express";
import { DishController } from "./dish.controller";

const router = Router();

// Base CRUD routes
router.get("/", DishController.list);
router.get("/:id", DishController.get);
router.post("/", DishController.create);
router.put("/:id", DishController.update);
router.delete("/:id", DishController.delete);

// Special dish operations
router.put("/:id/availability", DishController.toggleAvailability);
router.put("/:id/price", DishController.updatePrice);
router.put("/:id/featured", DishController.toggleFeatured);

// Search and filter routes
router.get("/search/name", DishController.searchByName);
router.get("/category/:categoryId", DishController.getByCategory);
router.get("/featured/list", DishController.getFeatured);

export default router;
