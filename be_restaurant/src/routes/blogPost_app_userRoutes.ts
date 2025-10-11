import { Router } from "express"
import * as blogPostController from "../controllers/blogPostController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

router.get("/", blogPostController.getAllBlogPosts)
router.get("/published", blogPostController.getPublishedBlogPosts)
router.get("/:id", blogPostController.getBlogPostById)

router.use(authenticate)

router.post("/", authorize("admin"), blogPostController.createBlogPost)
router.put("/:id", authorize("admin"), blogPostController.updateBlogPost)
router.delete("/:id", authorize("admin"), blogPostController.deleteBlogPost)

export default router
