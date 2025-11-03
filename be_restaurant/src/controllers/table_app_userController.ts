import type { Request, Response, NextFunction } from "express"
import tableService, { TABLE_ALLOWED_STATUSES } from "../services/table_app_userService"
import { AppError } from "../middlewares/errorHandler"

// Returns raw array of tables for mobile app
export const getTables_app_user = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tables = await tableService.findAll({})
    // Map Sequelize instances to plain objects and ensure expected keys are present
    const payload = tables.rows.map((t: any) => ({
      id: t.id,
      table_number: t.table_number,
      capacity: t.capacity,
      deposit: t.deposit,
      cancel_minutes: t.cancel_minutes,
      location: t.location,
      status: t.status,
      panorama_urls: t.panorama_urls,
      amenities: t.amenities,
      description: t.description,
      created_at: t.created_at,
      updated_at: t.updated_at,
    }))

    res.json(payload)
  } catch (error) {
    next(error)
  }
}

// Returns only available tables
export const getAvailableTables_app_user = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tables = await tableService.findAvailableTables()
    const payload = (tables || []).map((t: any) => ({
      id: t.id,
      table_number: t.table_number,
      capacity: t.capacity,
      deposit: t.deposit,
      cancel_minutes: t.cancel_minutes,
      location: t.location,
      status: t.status,
      panorama_urls: t.panorama_urls,
      amenities: t.amenities,
      description: t.description,
      created_at: t.created_at,
      updated_at: t.updated_at,
    }))
    res.json(payload)
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
