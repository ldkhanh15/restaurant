import { Request, Response } from "express";
import { DishIngredientService } from "./dishIngredient.service";

// created_by_cursor: true
export const DishIngredientController = {
    async list(_req: Request, res: Response) {
        try {
            const data = await DishIngredientService.list();
            res.json({ data });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const data = await DishIngredientService.create(req.body);
            res.status(201).json({ data });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    async remove(req: Request, res: Response) {
        try {
            const ok = await DishIngredientService.remove(req.params.dish_id, req.params.ingredient_id);
            if (!ok) return res.status(404).json({ message: "Dish ingredient not found" });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },
}; 