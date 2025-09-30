import { Router } from "express";
import { TableController } from "./table.controller";

const router = Router();

// Table CRUD routes
router.get("/", TableController.list);
router.get("/:id", TableController.get);
router.post("/", TableController.create);
router.put("/:id", TableController.update);
router.delete("/:id", TableController.delete);

// Table status and grouping
router.put("/:id/status", TableController.updateStatus);
router.put("/:id/group", TableController.assignToGroup);
router.get("/available/find", TableController.findAvailable);

// Table group management
router.get("/groups/list", TableController.getTableGroups);
router.post("/groups", TableController.createTableGroup);
router.put("/groups/:id", TableController.updateTableGroup);
router.delete("/groups/:id", TableController.deleteTableGroup);

export default router;
