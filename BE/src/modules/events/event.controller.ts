import { Request, Response } from "express";
import { EventService } from "./event.service";

export const EventController = {
  async list(_req: Request, res: Response) {
    try {
      const data = await EventService.list();
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async get(req: Request, res: Response) {
    try {
      const data = await EventService.get(req.params.id);
      if (!data) return res.status(404).json({ message: "Event not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const data = await EventService.create(req.body);
      res.status(201).json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const data = await EventService.update(req.params.id, req.body);
      if (!data) return res.status(404).json({ message: "Event not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const ok = await EventService.remove(req.params.id);
      if (!ok) return res.status(404).json({ message: "Event not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async book(req: Request, res: Response) {
    try {
      const data = await EventService.book(req.params.id, req.body);
      if (!data) return res.status(404).json({ message: "Event not found" });
      res.status(201).json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async updateBooking(req: Request, res: Response) {
    try {
      const data = await EventService.updateBooking(
        req.params.bookingId,
        req.body
      );
      if (!data) return res.status(404).json({ message: "Booking not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async cancelBooking(req: Request, res: Response) {
    try {
      const ok = await EventService.cancelBooking(req.params.bookingId);
      if (!ok) return res.status(404).json({ message: "Booking not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },
};
