import { Router } from "express";
import { VoucherUsageController } from "./voucherUsage.controller";

// created_by_cursor: true
const router = Router();

router.get("/", VoucherUsageController.list);
router.get("/:id", VoucherUsageController.get);
router.post("/", VoucherUsageController.create);
router.put("/:id", VoucherUsageController.update);
router.delete("/:id", VoucherUsageController.remove);

export default router; 