import { Router } from "express"
import * as blogPostController from "../controllers/blogPostController"
import { authenticate, authorize } from "../middlewares/auth"
import { body, query } from "express-validator"
import { validate } from "../middlewares/validator"

const router = Router()

router.get(
    "/",
    [
        query("page").optional().isInt({ min: 1 }).withMessage("page must be >= 1"),
        query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
        query("status").optional().isIn(["draft", "published", "deleted"]).withMessage("status must be one of: draft, published, deleted"),
        validate,
    ],
    blogPostController.getAllBlogPosts,
)
router.get("/published", blogPostController.getPublishedBlogPosts)
router.get(
    "/:id",
    [
        validate,
    ],
    blogPostController.getBlogPostById,
)

router.use(authenticate)

router.post(
    "/",
    authorize("admin"),
    [
        body("title").isLength({ min: 10, max: 200 }).withMessage("title length 10-200"),
        body("title").matches(/^[^<>]*$/).withMessage("title contains forbidden chars"),
        body("content").isLength({ min: 50 }).withMessage("content min 50"),
        body("thumbnail_url").optional().isURL().withMessage("invalid thumbnail_url"),
        body("tags").optional().isArray().withMessage("invalid tags"),
        body("category").optional().isString().withMessage("invalid category"),
        body("status").optional().isIn(["draft", "published", "deleted"]).withMessage("invalid status"),
        body("meta_description").optional().isLength({ max: 300 }).withMessage("invalid meta_description"),
        body("keywords").optional().isArray().withMessage("invalid keywords"),

        validate,
    ],
    blogPostController.createBlogPost,
)
router.put(
    "/:id",
    authorize("admin"),
    [
        body("title").optional().isLength({ min: 10, max: 200 }).withMessage("title length 10-200"),
        body("title").optional().matches(/^[^<>]*$/).withMessage("title contains forbidden chars"),
        body("content").optional().isLength({ min: 50 }).withMessage("content min 50"),
        body("thumbnail_url").optional({checkFalsy: true}).isURL().withMessage("invalid thumbnail_url"),
        body("tags").optional().isArray().withMessage("invalid tags"),
        body("category").optional().isString().withMessage("invalid category"),
        body("status").optional().isIn(["draft", "published", "deleted"]).withMessage("invalid status"),
        body("meta_description").optional().isLength({ max: 300 }).withMessage("invalid meta_description"),
        body("keywords").optional().isArray().withMessage("invalid keywords"),
        validate,
    ],
    blogPostController.updateBlogPost,
)
router.delete(
    "/:id",
    authorize("admin"),
    blogPostController.deleteBlogPost,
)

export default router
