import { Router } from "express"
import * as blogPostController from "../controllers/blogPostController"
import { authenticate, authorize } from "../middlewares/auth"
import { body, query } from "express-validator"
import { validate } from "../middlewares/validator"

const router = Router()

router.get(
    "/",
    [
        query("page").optional().isInt({ min: 1 }),
        query("limit").optional().isInt({ min: 1, max: 100 }),
        query("status").optional().isIn(["draft", "published", "deleted"]),
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
        body("slug").optional().isSlug().withMessage("invalid slug"),
        body("thumbnail_url").optional().isURL(),
        body("cover_image_url").optional().isURL(),
        body("tags").optional().isArray(),
        body("category").optional().isString(),
        body("status").optional().isIn(["draft", "published", "deleted"]),
        body("meta_title").optional().isLength({ max: 200 }),
        body("meta_description").optional().isLength({ max: 300 }),
        body("keywords").optional().isArray(),
        validate,
    ],
    blogPostController.createBlogPost,
)
router.put(
    "/:id",
    authorize("admin"),
    [
        body("title").optional().isLength({ min: 10, max: 200 }),
        body("title").optional().matches(/^[^<>]*$/),
        body("content").optional().isLength({ min: 50 }),
        body("slug").optional().isSlug(),
        body("thumbnail_url").optional().isURL(),
        body("cover_image_url").optional().isURL(),
        body("tags").optional().isArray(),
        body("category").optional().isString(),
        body("status").optional().isIn(["draft", "published", "deleted"]),
        body("meta_title").optional().isLength({ max: 200 }),
        body("meta_description").optional().isLength({ max: 300 }),
        body("keywords").optional().isArray(),
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
