import type { Request, Response, NextFunction } from "express"
import payrollService from "../services/payrollService"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"

export const getAllPayrolls = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(req.query)
    const offset = (page - 1) * limit

    const { rows, count } = await payrollService.findAllWithEmployee({
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

export const getPayrollById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payroll = await payrollService.findById(Number(req.params.id))
    res.json({ status: "success", data: payroll })
  } catch (error) {
    next(error)
  }
}

export const createPayroll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payroll = await payrollService.create(req.body)
    res.status(201).json({ status: "success", data: payroll })
  } catch (error) {
    next(error)
  }
}

export const updatePayroll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payroll = await payrollService.update(Number(req.params.id), req.body)
    res.json({ status: "success", data: payroll })
  } catch (error) {
    next(error)
  }
}

export const deletePayroll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await payrollService.delete(Number(req.params.id))
    res.json({ status: "success", message: "Payroll deleted successfully" })
  } catch (error) {
    next(error)
  }
}
