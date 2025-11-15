import type { Request, Response, NextFunction } from "express"
import inventoryService from "../services/inventoryService"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"
import logger from "../config/logger"
import inventoryImportService from "../services/inventoryImportService"
import Ingredient from "../models/Ingredient"
import { Employee, InventoryImportIngredient, Supplier, User } from "../models"
import { json, Op, Sequelize, where } from "sequelize"


export const getAllInventoryImport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, sortBy = 'timestamp', sortOrder = 'ASC' } = getPaginationParams(req.query)
    const offset = (page - 1) * limit

    const where: any = {}

    // Handle date range filter
    if (req.query.start_date || req.query.end_date) {
      where.timestamp = {}
      if (req.query.start_date) {
        const startDate = new Date(req.query.start_date as string)
        startDate.setHours(0, 0, 0, 0)
        where.timestamp[Op.gte] = startDate
      }
      if (req.query.end_date) {
        const endDate = new Date(req.query.end_date as string)
        endDate.setHours(23, 59, 59, 999)
        where.timestamp[Op.lte] = endDate
      }
    }

    const { rows, count } = await inventoryService.findAllWithDetails({
      where,
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

export const getInventoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inventory = await inventoryService.findById(req.params.id, {
      include: [
        { 
          model: Supplier, 
          as: "supplier",
          where: { deleted_at: null },
          required: true
        },
        { model: Employee, as: "employee",
          where: { deleted_at: null },
          required: true,
          include:[
            {
              model : User, as : "user",
              attributes: ["full_name"]
            }
          ]
        },
        {
          model: InventoryImportIngredient,
          as: "ingredients",
          include: [
            { 
              model: Ingredient, 
              as: "ingredient", 
              attributes: ["id", "name", "unit"] 
            }
          ],
          attributes: ["id", "quantity", "total_price"]
        }
      ]
    })

    if (!inventory) {
      return res.status(404).json({ status: "error", message: "Inventory import not found" })
    }

    res.json({ status: "success", data: inventory })
  } catch (error) {
    next(error)
  }
}

export const createInventory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await inventoryService.create(req.body)
    res.status(201).json({ status: "success", data: category })
  } catch (error) {
    next(error)
  }
}

export const updateInventory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await inventoryService.update(req.params.id, req.body)
    res.json({ status: "success", data: category })
  } catch (error) {
    next(error)
  }
}

export const deleteInventory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inventory_imports_id = req.params.id;
    if (!inventory_imports_id) {
      return res.status(400).json({ status: "error", message: "Invalid input data" })
    }
    const result = await inventoryImportService.removeInventoryImport(
      inventory_imports_id
    )
    if (result) {
      res.json({ status: "success", data: result })
    }
    else {
      res.status(400).json({ status: "error", message: "Failed to remove ingredients" })
    }
  } catch (error) {
    next(error)
  }
}

export const addIngredientToInventoryImport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { inventory_imports_id, ingredients } = req.body
    if (!inventory_imports_id || !Array.isArray(ingredients)) {
      return res.status(400).json({ status: "error", message: "Invalid input data" })
    }
    const result = await inventoryImportService.addIngredientToInventoryImport(
      inventory_imports_id,
      ingredients
    )
    if (result) {
      res.json({ status: "success", data: result })
    } else {
      res.status(400).json({ status: "error", message: "Failed to add/update ingredients" })
    }
  } catch (error) {
    next(error)
  }   
}

export const removeIngredientFromInventoryImport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inventory_imports_id = req.params.id;
    if (!inventory_imports_id) {
      return res.status(400).json({ status: "error", message: "Invalid input data" })
    }
    const result = await inventoryImportService.removeInventoryImport(
      inventory_imports_id
    )
    if (result) {
      res.json({ status: "success", data: result })
    }
    else {
      res.status(400).json({ status: "error", message: "Failed to remove ingredients" })
    }
  } catch (error) {
    next(error)
  } 
}

export const updateInventoryImportIngredients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inventory_imports_id = req.params.id;
    const newIngredients = req.body.ingredients;
    if (!inventory_imports_id || !Array.isArray(newIngredients)) {
      return res.status(400).json({ status: "error", message: "Invalid input data" })
    }
    const result = await inventoryImportService.updateInventoryImportIngredients(
      inventory_imports_id,
      newIngredients
    )
    if (result) {
      res.json({ status: "success", data: result })
    } else {
      res.status(400).json({ status: "error", message: "Failed to update ingredients" })
    } 
  } catch (error) {
    logger.error("Error in updateInventoryImportIngredients controller:", error)
    next(error)
  }
}
