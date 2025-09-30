import { Router } from "express";
import { BlogPostController } from "./blog.controller";

const router = Router();

router.get("/", BlogPostController.list);
router.get("/:id", BlogPostController.get);
router.post("/", BlogPostController.create);
router.put("/:id", BlogPostController.update);
router.post("/:id/publish", BlogPostController.publish);
router.delete("/:id", BlogPostController.remove);

export default router;
