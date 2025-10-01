import type { Request, Response, NextFunction } from "express"
import employeeShiftService from "../services/employeeShiftService"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"

export const getAllShifts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, sortBy = "created_at", sortOrder = "DESC" } = getPaginationParams(req.query)
    const offset = (page - 1) * limit

    const { rows, count } = await employeeShiftService.findAllWithEmployee({
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

export const getShiftById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shift = await employeeShiftService.findById(req.params.id)
    res.json({ status: "success", data: shift })
  } catch (error) {
    next(error)
  }
}

export const createShift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shift = await employeeShiftService.create(req.body)
    res.status(201).json({ status: "success", data: shift })
  } catch (error) {
    next(error)
  }
}

export const updateShift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shift = await employeeShiftService.update(req.params.id, req.body)
    res.json({ status: "success", data: shift })
  } catch (error) {
    next(error)
  }
}

export const deleteShift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await employeeShiftService.delete(req.params.id)
    res.json({ status: "success", message: "Shift deleted successfully" })
  } catch (error) {
    next(error)
  }
}
