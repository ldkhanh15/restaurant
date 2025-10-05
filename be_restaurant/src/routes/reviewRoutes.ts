import { Router } from "express"
import * as reviewController from "../controllers/reviewController"
import { body } from "express-validator"
import { validate } from "../middlewares/validator"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

router.get("/", reviewController.getAllReviews)
router.get("/:id", reviewController.getReviewById)

router.use(authenticate)

router.post(
  "/",
  authorize("customer"),
  [
    body("type").isIn(["dish", "table"]).withMessage("type must be 'dish' or 'table'"),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("rating must be 1-5"),
    body("order_id").optional().isUUID().withMessage("order_id must be UUID"),
    body("order_item_id").optional().isUUID().withMessage("order_item_id must be UUID"),
    body("dish_id").optional().isUUID().withMessage("dish_id must be UUID"),
    body("table_id").optional().isUUID().withMessage("table_id must be UUID"),
    validate,
  ],
  reviewController.createReview,
)
router.put("/:id", authorize("customer"), reviewController.updateReview)
router.delete("/:id", authorize("admin", "customer"), reviewController.deleteReview)

export default router