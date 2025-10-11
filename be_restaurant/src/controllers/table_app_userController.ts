import type { Request, Response, NextFunction } from "express"
import tableService, { TABLE_ALLOWED_STATUSES } from "../services/table_app_userService"
import { AppError } from "../middlewares/errorHandler"

// Returns raw array of tables for mobile app
export const getTables_app_user = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tables = await tableService.findAll({})
    res.json(tables.rows)
  } catch (error) {
    next(error)
  }
}

// Returns only available tables
export const getAvailableTables_app_user = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tables = await tableService.findAvailableTables()
    res.json(tables)
  } catch (error) {
    next(error)
  }
}

export const updateTableStatus_app_user = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!TABLE_ALLOWED_STATUSES.includes(status)) {
      throw new AppError("Invalid table status", 400)
    }

    const updatedTable = await tableService.updateStatus(id, status)
    res.json(updatedTable)
  } catch (error) {
    next(error)
  }
}
