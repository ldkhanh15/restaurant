import { Router } from "express";
import { VoucherController } from "./voucher.controller";

// created_by_cursor: true
const router = Router();

router.get("/", VoucherController.list);
router.get("/:id", VoucherController.get);
router.post("/", VoucherController.create);
router.put("/:id", VoucherController.update);
router.delete("/:id", VoucherController.remove);

export default router; 