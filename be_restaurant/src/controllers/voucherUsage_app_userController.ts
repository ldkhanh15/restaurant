import type { Request, Response, NextFunction } from "express"
import voucherUsageService from "../services/voucherUsage_app_userService"
import { AppError } from "../middlewares/errorHandler"

export const createVoucherUsage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { voucher_id, order_id, user_id } = req.body

    if (!voucher_id || !order_id || !user_id) {
      throw new AppError("voucher_id, order_id, and user_id are required", 400)
    }

    const usage = await voucherUsageService.create({ voucher_id, order_id, user_id })
    res.status(201).json({ status: "success", data: usage })
  } catch (error) {
    next(error)
  }
}