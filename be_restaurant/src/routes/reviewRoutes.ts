import { Router } from "express";
import * as reviewController from "../controllers/reviewController";
import { body } from "express-validator";
import { validate } from "../middlewares/validator";
import { authenticate, authorize } from "../middlewares/auth";

const router = Router();

router.get("/", reviewController.getAllReviews);

router.get("/:id", reviewController.getReviewById);

router.get("/dish/:dishId", reviewController.getReviewByDishId);

router.use(authenticate);

router.post(
  "/",
  authorize("customer"),
  [
    body("type")
      .isIn(["dish", "table"])
      .withMessage("type must be 'dish' or 'table'"),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("rating must be 1-5"),
    body("order_id").optional().isUUID().withMessage("order_id must be UUID"),
    body("order_item_id")
      .optional()
      .isString()
      .withMessage("order_item_id must be a string"),
    body("dish_id").optional().isString().withMessage("dish_id must be a string"),
    body("table_id").optional({ nullable: true }).isString().withMessage("table_id must be a string"),
    validate,
  ],
  reviewController.createReview
);
router.put("/:id", authorize("customer"), reviewController.updateReview);
router.delete(
  "/:id",
  authorize("admin", "customer"),
  reviewController.deleteReview
);

export default router;
