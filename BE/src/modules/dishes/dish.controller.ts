import { Request, Response } from "express";
import { DishService } from "./dish.service";

export const DishController = {
  async list(req: Request, res: Response) {
    try {
      const data = await DishService.list(req.query);
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async get(req: Request, res: Response) {
    try {
      const data = await DishService.get(req.params.id);
      if (!data) return res.status(404).json({ message: "Dish not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const data = await DishService.create(req.body);
      res.status(201).json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const data = await DishService.update(req.params.id, req.body);
      if (!data) return res.status(404).json({ message: "Dish not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const success = await DishService.delete(req.params.id);
      if (!success) return res.status(404).json({ message: "Dish not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async toggleAvailability(req: Request, res: Response) {
    try {
      const { isAvailable } = req.body;
      const data = await DishService.toggleAvailability(
        req.params.id,
        isAvailable
      );
      if (!data) return res.status(404).json({ message: "Dish not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async updatePrice(req: Request, res: Response) {
    try {
      const { price } = req.body;
      if (typeof price !== "number" || price < 0) {
        return res.status(400).json({ message: "Invalid price value" });
      }

      const data = await DishService.updatePrice(req.params.id, price);
      if (!data) return res.status(404).json({ message: "Dish not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async searchByName(req: Request, res: Response) {
    try {
      const { query } = req.query;
      if (!query || typeof query !== "string") {
        return res.status(400).json({ message: "Search query is required" });
      }

      const data = await DishService.searchByName(query);
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async getByCategory(req: Request, res: Response) {
    try {
      const data = await DishService.getByCategory(req.params.categoryId);
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async getFeatured(req: Request, res: Response) {
    try {
      const data = await DishService.getFeatured();
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async toggleFeatured(req: Request, res: Response) {
    try {
      const data = await DishService.toggleFeatured(req.params.id);
      if (!data) return res.status(404).json({ message: "Dish not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },
};
