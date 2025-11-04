import { Router } from "express";
import { body } from "express-validator";
import { validate } from "../middlewares/validator";
import { authenticate } from "../middlewares/auth";
import * as loyaltyController from "../controllers/loyalty_app_userController";

const router = Router();

// Get current user's loyalty info
router.get("/me", authenticate, loyaltyController.getMyLoyalty);

// Award points for an order (authenticated)
router.post(
  "/award-order",
  authenticate,
  [body("order_id").isUUID().withMessage("order_id is required") , validate],
  loyaltyController.awardPointsForOrder,
);

export default router;
