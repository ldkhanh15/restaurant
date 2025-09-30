import { Request, Response } from "express";
import { EventBookingService } from "./eventBooking.service";

// created_by_cursor: true
export const EventBookingController = {
    async list(_req: Request, res: Response) {
        try {
            const data = await EventBookingService.list();
            res.json({ data });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    async get(req: Request, res: Response) {
        try {
            const data = await EventBookingService.get(req.params.id);
            if (!data) return res.status(404).json({ message: "Event booking not found" });
            res.json({ data });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const data = await EventBookingService.create(req.body);
            res.status(201).json({ data });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    async update(req: Request, res: Response) {
        try {
            const data = await EventBookingService.update(req.params.id, req.body);
            if (!data) return res.status(404).json({ message: "Event booking not found" });
            res.json({ data });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    async remove(req: Request, res: Response) {
        try {
            const ok = await EventBookingService.remove(req.params.id);
            if (!ok) return res.status(404).json({ message: "Event booking not found" });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },
}; 