import type { Request, Response, NextFunction } from "express"
import voucherAppUserService from "../services/voucher_app_userService"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"
import { AppError } from "../middlewares/errorHandler"

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>

const asyncHandler = (fn: AsyncRequestHandler) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

export const getAllVouchers = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, sortBy = "created_at", sortOrder = "DESC" } = getPaginationParams(req.query)
  const offset = (page - 1) * limit
 
  const { rows, count } = await voucherAppUserService.findAll({
    limit,
    offset,
    order: [[sortBy, sortOrder]],
  })
 
  const result = buildPaginationResult(rows, count, page, limit)
  res.json({ status: "success", data: result })
})
 
export const getActiveVouchers = asyncHandler(async (req: Request, res: Response) => {
  const vouchers = await voucherAppUserService.findActiveVouchers()
  res.json({ status: "success", data: vouchers })
})
 
export const getVoucherById = asyncHandler(async (req: Request, res: Response) => {
  const voucher = await voucherAppUserService.findById(req.params.id)
  res.json({ status: "success", data: voucher })
})
 
export const createVoucher = asyncHandler(async (req: Request, res: Response) => {
  const voucher = await voucherAppUserService.create(req.body)
  res.status(201).json({ status: "success", data: voucher })
})
 
export const updateVoucher = asyncHandler(async (req: Request, res: Response) => {
  const voucher = await voucherAppUserService.update(req.params.id, req.body)
  res.json({ status: "success", data: voucher })
})
 
export const deleteVoucher = asyncHandler(async (req: Request, res: Response) => {
  await voucherAppUserService.delete(req.params.id)
  res.json({ status: "success", message: "Voucher deleted successfully" })
})
 
/**
 * Lấy danh sách voucher của người dùng (active, used, expired)
 */
export const getUserVouchers = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    throw new AppError("User not found, please login", 401)
  }
 
  const vouchers = await voucherAppUserService.findUserVouchers(String(userId))
  res.json({ status: "success", data: vouchers })
})
