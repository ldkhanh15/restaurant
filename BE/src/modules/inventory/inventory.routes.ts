import { Router } from "express";
import { InventoryController } from "./inventory.controller";

const router = Router();

router.get("/imports", InventoryController.listImports);
router.get("/imports/:id", InventoryController.getImport);
router.post("/imports", InventoryController.createImport);
router.put("/imports/:id", InventoryController.updateImport);
router.delete("/imports/:id", InventoryController.removeImport);

export default router;
