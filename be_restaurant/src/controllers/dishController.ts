import type { Request, Response, NextFunction } from "express"
import Dish from "../models/Dish"
import CategoryDish from "../models/CategoryDish"
import { AppError } from "../middlewares/errorHandler"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"
import dishService from "../services/dishService"
import dishIngredientService from "../services/dishIngredientService"

export const getAllDishes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'ASC' } = getPaginationParams(req.query)

    const offset = (page - 1) * limit

    const { count, rows } = await Dish.findAndCountAll({
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      include: [{ model: CategoryDish, as: "category" }],
    })

    const result = buildPaginationResult(rows, count, page, limit)
    res.json({ status: "success", data: result })
  } catch (error) {
    next(error)
  }
}

export const getDishesByCategoryId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'ASC' } = getPaginationParams(req.query)

    const offset = (page - 1) * limit

    const { rows, count } = await dishService.findDishesByCategoryId(req.params.id, {
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });

    const result = buildPaginationResult(rows, count, page, limit)
    res.json({ status: "success", data: result })
  } catch (error) {
    next(error)
  }
}

export const getIngredientsByDishId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'ASC' } = getPaginationParams(req.query)

    const offset = (page - 1) * limit

    const { rows, count } = await dishIngredientService.findAllWithDetails(req.params.id, {
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });

    const result = buildPaginationResult(rows, count, page, limit)
    res.json({ status: "success", data: result })
  } catch (error) {
    next(error)
  }
}

export const getDishById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dish = await Dish.findByPk(req.params.id, {
      include: [{ model: CategoryDish, as: "category" }],
    })

    if (!dish) {
      throw new AppError("Dish not found", 404)
    }

    res.json({ status: "success", data: dish })
  } catch (error) {
    next(error)
  }
}

export const createDish = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dish = await Dish.create(req.body)
    res.status(201).json({ status: "success", data: dish })
  } catch (error) {
    next(error)
  }
}

export const upsertIngredientToDish = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dishId, ingredients } = req.body;

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      throw new AppError("ingredients must be a non-empty array", 400);
    }

    ingredients.forEach((ing: any) => {
      if (!ing.ingredient_id) {
        throw new AppError("Each ingredient must have ingredient_id", 400);
      }
      if (!ing.quantity || ing.quantity <= 0) {
        throw new AppError("Each ingredient must have quantity > 0", 400);
      }
    });

    await dishIngredientService.addOrUpdateIngredientToDish(dishId, ingredients);

    res.status(201).json({ status: "success", message: "Ingredients added/updated successfully" });
  } catch (error) {
    next(error);
  }
};


export const updateDish = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dish = await Dish.findByPk(req.params.id)

    if (!dish) {
      throw new AppError("Dish not found", 404)
    }

    await dish.update(req.body)
    res.json({ status: "success", data: dish })
  } catch (error) {
    next(error)
  }
}

export const deleteDish = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dish = await Dish.findByPk(req.params.id)

    if (!dish) {
      throw new AppError("Dish not found", 404)
    }

    await dish.destroy()
    res.json({ status: "success", message: "Dish deleted successfully" })
  } catch (error) {
    next(error)
  }
}
