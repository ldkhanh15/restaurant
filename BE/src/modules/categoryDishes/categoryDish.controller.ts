import { Request, Response } from "express";
import { CategoryDishService } from "./categoryDish.service";

export const CategoryDishController = {
    async list(_req: Request, res: Response) {
        try {
            const data = await CategoryDishService.list();
            res.json({ data });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    async get(req: Request, res: Response) {
        try {
            const data = await CategoryDishService.get(req.params.id);
            if (!data) return res.status(404).json({ message: "Category not found" });
            res.json({ data });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const data = await CategoryDishService.create(req.body);
            res.status(201).json({ data });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    async update(req: Request, res: Response) {
        try {
            const data = await CategoryDishService.update(req.params.id, req.body);
            if (!data) return res.status(404).json({ message: "Category not found" });
            res.json({ data });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    async remove(req: Request, res: Response) {
        try {
            const ok = await CategoryDishService.remove(req.params.id);
            if (!ok) return res.status(404).json({ message: "Category not found" });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },
}; 