import { Router } from "express";
import { OrderItemLogController } from "./orderItemLog.controller";

// created_by_cursor: true
const router = Router();

router.get("/", OrderItemLogController.list);
router.get("/:id", OrderItemLogController.get);
router.post("/", OrderItemLogController.create);
router.put("/:id", OrderItemLogController.update);
router.delete("/:id", OrderItemLogController.remove);

export default router; 