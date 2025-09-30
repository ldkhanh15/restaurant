import { Router } from "express";
import { OrderItemController } from "./orderItem.controller";

const router = Router();

router.get("/", OrderItemController.list);
router.get("/:id", OrderItemController.get);
router.post("/", OrderItemController.create);
router.put("/:id", OrderItemController.update);
router.delete("/:id", OrderItemController.remove);

export default router; 