import { Request, Response } from "express";
import { ReviewService } from "./review.service";

export const ReviewController = {
    async list(_req: Request, res: Response) {
        try {
            const data = await ReviewService.list();
            res.json({ data });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    async get(req: Request, res: Response) {
        try {
            const data = await ReviewService.get(req.params.id);
            if (!data) return res.status(404).json({ message: "Review not found" });
            res.json({ data });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const data = await ReviewService.create(req.body);
            res.status(201).json({ data });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    async update(req: Request, res: Response) {
        try {
            const data = await ReviewService.update(req.params.id, req.body);
            if (!data) return res.status(404).json({ message: "Review not found" });
            res.json({ data });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    async remove(req: Request, res: Response) {
        try {
            const ok = await ReviewService.remove(req.params.id);
            if (!ok) return res.status(404).json({ message: "Review not found" });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },
}; 