import type { Request, Response, NextFunction } from "express"
import supplierService from "../services/supplierService"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"

export const getAllSuppliers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.query.all === 'true') {
      const result = await supplierService.findAll({ order: [['created_at', 'ASC']] });
      const data =
      result?.rows && Array.isArray(result.rows)
        ? result.rows.map((supplier: any) => supplier.toJSON())
        : Array.isArray(result)
        ? result.map((supplier: any) => supplier.toJSON())
        : []

      const count = result?.count ?? data.length

      return res.status(200).json({
        status: "success",
        count,
        data,
      })
    }

    const { page = 1, limit = 10, sortBy = "created_at", sortOrder = "DESC" } = getPaginationParams(req.query)
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
    const supplier = await supplierService.findById(req.params.id)
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
    const supplier = await supplierService.update(req.params.id, req.body)
    res.json({ status: "success", data: supplier })
  } catch (error) {
    next(error)
  }
}

export const deleteSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await supplierService.softDelete(req.params.id)
    res.json({ status: "success", message: "Supplier deleted successfully" })
  } catch (error) {
    next(error)
  }
}
