import { Router } from "express";
import { ReservationController } from "./reservation.controller";
import { authenticate } from "../../middleware/auth";

const router = Router();

// Public routes
router.get("/", ReservationController.list);
router.get("/:id", ReservationController.get);

// Protected routes
router.post("/", authenticate, ReservationController.create);
router.put("/:id", authenticate, ReservationController.update);
router.delete("/:id", authenticate, ReservationController.cancel);
router.post("/:id/confirm", authenticate, ReservationController.confirm);
router.get(
  "/user/reservations",
  authenticate,
  ReservationController.getUserReservations
);

export default router;
