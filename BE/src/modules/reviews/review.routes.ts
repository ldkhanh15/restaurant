import { Router } from "express";
import { ReviewController } from "./review.controller";

const router = Router();

router.get("/", ReviewController.list);
router.get("/:id", ReviewController.get);
router.post("/", ReviewController.create);
router.put("/:id", ReviewController.update);
router.delete("/:id", ReviewController.remove);

export default router; 