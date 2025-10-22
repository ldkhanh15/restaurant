import type { Request, Response, NextFunction } from "express"
import dishService from "../services/dish_app_userService"

// Returns raw array of menu items (no wrapper) to be consumed by mobile app
export const getMenuItems_app_user = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dishes = await dishService.findAllWithCategory({})
    // send raw array
    res.json(dishes)
  } catch (error) {
    next(error)
  }
}
