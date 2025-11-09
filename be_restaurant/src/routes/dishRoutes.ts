import { Router } from "express";
import {
  getAllDishes,
  getDishById,
  createDish,
  updateDish,
  deleteDish,
  getDishesByCategoryId,
  upsertIngredientToDish,
} from "../controllers/dishController";
import { authenticate,  authenticateForRecommend, authorize } from "../middlewares/auth";
import upload from "../middlewares/upload";

const router = Router();

router.get("/", authenticateForRecommend, getAllDishes);
router.get("/:id", getDishById);
router.get("/category/:id", getDishesByCategoryId);
router.post("/", upload.single("media_file"), createDish);
router.post("/ingredients/", upsertIngredientToDish);
router.put("/:id", upload.single("media_file"), updateDish);
router.delete("/:id", deleteDish);


// router.post("/", createDish)
// router.put("/:id", authenticate, authorize("admin", "employee"), updateDish)
// router.delete("/:id", authenticate, authorize("admin"), deleteDish)

export default router;
