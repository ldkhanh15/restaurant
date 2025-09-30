import { Router } from "express";
import { EventBookingController } from "./eventBooking.controller";

// created_by_cursor: true
const router = Router();

router.get("/", EventBookingController.list);
router.get("/:id", EventBookingController.get);
router.post("/", EventBookingController.create);
router.put("/:id", EventBookingController.update);
router.delete("/:id", EventBookingController.remove);

export default router; 