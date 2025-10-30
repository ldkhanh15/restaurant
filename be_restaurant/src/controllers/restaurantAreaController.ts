import type { Request, Response, NextFunction } from "express";
import restaurantAreaService from "../services/restaurantAreaService";

export const getRestaurantArea = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const area = await restaurantAreaService.findOne();
    res.json({ status: "success", data: area });
  } catch (error) {
    next(error);
  }
};

export const createRestaurantArea = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const area = await restaurantAreaService.create(req.body);
    res.status(201).json({ status: "success", data: area });
  } catch (error) {
    next(error);
  }
};

export const updateRestaurantArea = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const area = await restaurantAreaService.update(req.params.id, req.body);
    res.json({ status: "success", data: area });
  } catch (error) {
    next(error);
  }
};
