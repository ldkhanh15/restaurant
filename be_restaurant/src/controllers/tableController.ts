import type { Request, Response, NextFunction } from "express"
import tableService from "../services/tableService"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"
import Order from "../models/Order"
import sequelize from "../config/database"
import tableGroupService from "../services/tableGroupService"
import { check } from "express-validator"

export const getAllTables = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, sortBy = "created_at", sortOrder = "DESC" } = getPaginationParams(req.query)
    const offset = (page - 1) * limit

    const { rows, count } = await tableService.findAll({
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

export const getTableById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const table = await tableService.findById(req.params.id)
    res.json({ status: "success", data: table })
  } catch (error) {
    next(error)
  }
}

export const getTablesByStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, sortBy = "created_at", sortOrder = "DESC" } = getPaginationParams(req.query)
    const offset = (page - 1) * limit
    const { rows, count } = await tableService.findTablesByStatus(req.params.status, {
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

export const createTable = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const table = await tableService.create(req.body)
    res.status(201).json({ status: "success", data: table })
  } catch (error) {
    next(error)
  }
}

export const updateTable = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const table = await tableService.update(req.params.id, req.body)
    res.json({ status: "success", data: table })
  } catch (error) {
    next(error)
  }
}

export const deleteTable = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await tableService.delete(req.params.id)
    res.json({ status: "success", message: "Table deleted successfully" })
  } catch (error) {
    next(error)
  }
}

// QR check-in create order for table directly
export const checkinTableCreateOrder = async (req: Request, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction()
  try {
    const tableId = req.params.id
    const userId = req.user?.id
    const order = await Order.create(
      {
        table_id: tableId,
        user_id: userId,
        status: "dining",
        total_amount: 0,
        voucher_discount_amount: 0,
        event_fee: 0,
        deposit_amount: 0,
        final_amount: 0,
      },
      { transaction },
    )
    await transaction.commit()
    res.status(201).json({ status: "success", data: order })
  } catch (error) {
    await transaction.rollback()
    next(error)
  }
}

export const doGroupTables = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if(!req.body.table_ids || req.body.table_ids.length < 2) {
      return res.status(400).json({ status: "error", message: "At least two tables are required to form a group" })
    }
    if(await tableGroupService.checkExistedTablesInGroup(req.body.table_ids as [], req.body.id)) {
      return res.status(400).json({ status: "error", message: "One or more tables are already in a group" })
    }
    const tableGroup = await tableGroupService.create(req.body)
    res.status(201).json({ status: "success", data: tableGroup })
  } catch (error) {
    next(error)
  } 
}

export const doUpdateTableGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if(!req.body.table_ids || req.body.table_ids.length < 2) {
      return res.status(400).json({ status: "error", message: "At least two tables are required to form a group" })
    }
    if(await tableGroupService.checkExistedTablesInGroup(req.body.table_ids as [], req.params.id)) {
      return res.status(400).json({ status: "error", message: "One or more tables are already in another group" })
    }
    const tableGroup = await tableGroupService.update(req.params.id, req.body)
    res.json({ status: "success", data: tableGroup })
  } catch (error) {
    next(error)
  }
}

export const ungroupTables = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await tableGroupService.delete(req.params.id)
    res.json({ status: "success", message: "Table group deleted successfully" })
  } catch (error) {
    next(error)
  }
}