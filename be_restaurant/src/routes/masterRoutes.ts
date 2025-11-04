import { Router } from "express";
import * as restaurantAreaController from "../controllers/restaurantAreaController";
// import { authenticate, authorize } from "../middlewares/auth"; // nếu cần middleware

const router = Router();

router.get("/", restaurantAreaController.getRestaurantArea);
router.post("/", restaurantAreaController.createRestaurantArea);
router.put("/:id", restaurantAreaController.updateRestaurantArea);

export default router;
