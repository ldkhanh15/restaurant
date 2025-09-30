import type { Request, Response, NextFunction } from "express"
import employeeService from "../services/employeeService"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"

export const getAllEmployees = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(req.query)
    const offset = (page - 1) * limit

    const { rows, count } = await employeeService.findAllWithUser({
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

export const getEmployeeById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await employeeService.findByIdWithUser(Number(req.params.id))
    res.json({ status: "success", data: employee })
  } catch (error) {
    next(error)
  }
}

export const createEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await employeeService.create(req.body)
    res.status(201).json({ status: "success", data: employee })
  } catch (error) {
    next(error)
  }
}

export const updateEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await employeeService.update(Number(req.params.id), req.body)
    res.json({ status: "success", data: employee })
  } catch (error) {
    next(error)
  }
}

export const deleteEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await employeeService.delete(Number(req.params.id))
    res.json({ status: "success", message: "Employee deleted successfully" })
  } catch (error) {
    next(error)
  }
}
