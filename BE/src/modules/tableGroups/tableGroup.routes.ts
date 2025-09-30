import { Router } from "express";
import { TableGroupController } from "./tableGroup.controller";

// created_by_cursor: true
const router = Router();

router.get("/", TableGroupController.list);
router.get("/:id", TableGroupController.get);
router.post("/", TableGroupController.create);
router.put("/:id", TableGroupController.update);
router.delete("/:id", TableGroupController.remove);

export default router; 