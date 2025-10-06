import type { Request, Response, NextFunction } from "express"
import tableService from "../services/tableService"

// Returns raw array of tables for mobile app
export const getTables_app_user = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tables = await tableService.findAll({})
    res.json(tables)
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
