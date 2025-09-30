import type { Request, Response, NextFunction } from "express"
import employeeShiftService from "../services/employeeShiftService"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"

export const getAllShifts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(req.query)
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
    const shift = await employeeShiftService.findById(Number(req.params.id))
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
    const shift = await employeeShiftService.update(Number(req.params.id), req.body)
    res.json({ status: "success", data: shift })
  } catch (error) {
    next(error)
  }
}

export const deleteShift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await employeeShiftService.delete(Number(req.params.id))
    res.json({ status: "success", message: "Shift deleted successfully" })
  } catch (error) {
    next(error)
  }
}
