import type { Request, Response, NextFunction } from "express"
import ingredientService from "../services/ingredientService"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"

export const getAllIngredients = async (req: Request, res: Response, next: NextFunction) => {
  try {

    if (req.query.all === 'true') {
      const result = await ingredientService.findAll({ order: [['created_at', 'ASC']] });
      const data =
      result?.rows && Array.isArray(result.rows)
        ? result.rows.map((dish: any) => dish.toJSON())
        : Array.isArray(result)
        ? result.map((dish: any) => dish.toJSON())
        : []

      const count = result?.count ?? data.length

      return res.status(200).json({
        status: "success",
        count,
        data,
      })
    }

    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'ASC' } = getPaginationParams(req.query)
    const offset = (page - 1) * limit

    const { rows, count } = await ingredientService.findAll({
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    })

    const result = buildPaginationResult(rows, count, page, limit)
    res.json({ status: "success", data: result })
  } catch (error) {
    next(error)
  }
}

export const getIngredientById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ingredient = await ingredientService.findById((req.params.id))
    res.json({ status: "success", data: ingredient })
  } catch (error) {
    next(error)
  }
}

export const createIngredient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ingredient = await ingredientService.create(req.body)
    res.status(201).json({ status: "success", data: ingredient })
  } catch (error) {
    next(error)
  }
}

export const updateIngredient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ingredient = await ingredientService.update(req.params.id, req.body)
    res.json({ status: "success", data: ingredient })
  } catch (error) {
    next(error)
  }
}

export const deleteIngredient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ingredientService.softDelete(req.params.id)
    res.json({ status: "success", message: "Ingredient deleted successfully" })
  } catch (error) {
    next(error)
  }
}
