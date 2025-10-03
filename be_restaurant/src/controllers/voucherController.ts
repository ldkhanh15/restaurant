import type { Request, Response, NextFunction } from "express"
import voucherService from "../services/voucherService"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"

export const getAllVouchers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, sortBy = "created_at", sortOrder = "DESC" } = getPaginationParams(req.query)
    const offset = (page - 1) * limit

    const { rows, count } = await voucherService.findAll({
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

export const getActiveVouchers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vouchers = await voucherService.findActiveVouchers()
    res.json({ status: "success", data: vouchers })
  } catch (error) {
    next(error)
  }
}

export const getVoucherById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const voucher = await voucherService.findById(req.params.id)
    res.json({ status: "success", data: voucher })
  } catch (error) {
    next(error)
  }
}

export const createVoucher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const voucher = await voucherService.create(req.body)
    res.status(201).json({ status: "success", data: voucher })
  } catch (error) {
    next(error)
  }
}

export const updateVoucher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const voucher = await voucherService.update(req.params.id, req.body)
    res.json({ status: "success", data: voucher })
  } catch (error) {
    next(error)
  }
}

export const deleteVoucher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await voucherService.delete(req.params.id)
    res.json({ status: "success", message: "Voucher deleted successfully" })
  } catch (error) {
    next(error)
  }
}
