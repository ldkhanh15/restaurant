import { Router } from "express";
import { EventController } from "./event.controller";

const router = Router();

router.get("/", EventController.list);
router.get("/:id", EventController.get);
router.post("/", EventController.create);
router.put("/:id", EventController.update);
router.delete("/:id", EventController.remove);

// Event booking routes
router.post("/:id/book", EventController.book);
router.put("/bookings/:bookingId", EventController.updateBooking);
router.post("/bookings/:bookingId/cancel", EventController.cancelBooking);

export default router;
