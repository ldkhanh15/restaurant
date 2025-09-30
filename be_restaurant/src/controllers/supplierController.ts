import type { Request, Response, NextFunction } from "express"
import supplierService from "../services/supplierService"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"

export const getAllSuppliers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(req.query)
    const offset = (page - 1) * limit

    const { rows, count } = await supplierService.findAll({
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

export const getSupplierById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplier = await supplierService.findById(Number(req.params.id))
    res.json({ status: "success", data: supplier })
  } catch (error) {
    next(error)
  }
}

export const createSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplier = await supplierService.create(req.body)
    res.status(201).json({ status: "success", data: supplier })
  } catch (error) {
    next(error)
  }
}

export const updateSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplier = await supplierService.update(Number(req.params.id), req.body)
    res.json({ status: "success", data: supplier })
  } catch (error) {
    next(error)
  }
}

export const deleteSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await supplierService.delete(Number(req.params.id))
    res.json({ status: "success", message: "Supplier deleted successfully" })
  } catch (error) {
    next(error)
  }
}
