import { Router } from "express";
import { NotificationController } from "./notification.controller";

const router = Router();

router.get("/user/:userId", NotificationController.list);
router.get("/:id", NotificationController.get);
router.put("/:id/read", NotificationController.markAsRead);
router.put("/user/:userId/read-all", NotificationController.markAllAsRead);
router.delete("/:id", NotificationController.delete);
router.delete("/user/:userId/read", NotificationController.deleteAllRead);

export default router;
