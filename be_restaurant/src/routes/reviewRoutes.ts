import { Router } from "express"
import * as reviewController from "../controllers/reviewController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

router.get("/", reviewController.getAllReviews)
router.get("/:id", reviewController.getReviewById)

router.use(authenticate)

router.post("/", authorize("customer"), reviewController.createReview)
router.put("/:id", authorize("customer"), reviewController.updateReview)
router.delete("/:id", authorize("admin", "customer"), reviewController.deleteReview)

export default router