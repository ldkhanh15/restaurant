import { Request, Response } from "express";
import { ReservationService } from "./reservation.service";

export const ReservationController = {
  async list(req: Request, res: Response) {
    try {
      const data = await ReservationService.list(req.query);
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async get(req: Request, res: Response) {
    try {
      const data = await ReservationService.get(req.params.id);
      if (!data)
        return res.status(404).json({ message: "Reservation not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const data = await ReservationService.create({
        ...req.body,
        user_id: req.user?.id, // Assuming user is attached to request through auth middleware
      });
      res.status(201).json({ data });
    } catch (error) {
      if (error.message === "Table is already reserved for this time period") {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const data = await ReservationService.update(req.params.id, req.body);
      if (!data)
        return res.status(404).json({ message: "Reservation not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async cancel(req: Request, res: Response) {
    try {
      const data = await ReservationService.cancel(req.params.id);
      if (!data)
        return res.status(404).json({ message: "Reservation not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async confirm(req: Request, res: Response) {
    try {
      const data = await ReservationService.confirm(req.params.id);
      if (!data)
        return res.status(404).json({ message: "Reservation not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async getUserReservations(req: Request, res: Response) {
    try {
      const userId = req.user?.id; // Assuming user is attached to request through auth middleware
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const data = await ReservationService.getUserReservations(userId);
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },
};
