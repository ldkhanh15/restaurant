import type { Request, Response, NextFunction } from "express"
import complaintService from "../services/complaintService"
import Order from "../models/Order"
import OrderItem from "../models/OrderItem"
import { AppError } from "../middlewares/errorHandler"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"

export const getAllComplaints = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, sortBy = "created_at", sortOrder = "DESC" } = getPaginationParams(req.query)
    const offset = (page - 1) * limit

    const { rows, count } = await complaintService.findAllWithUser({
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

export const getComplaintById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const complaint = await complaintService.findById(req.params.id)
    res.json({ status: "success", data: complaint })
  } catch (error) {
    next(error)
  }
}

export const createComplaint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body as any
    // Customer must be owner of order/order item if provided
    if (req.user?.role === "customer") {
      if (payload.order_id) {
        const order = await Order.findByPk(payload.order_id)
        if (!order || (order.user_id && order.user_id !== String(req.user.id))) {
          throw new AppError("Insufficient permissions for this order", 403)
        }
      }
      if (payload.order_item_id) {
        const item = await OrderItem.findByPk(payload.order_item_id)
        if (!item) throw new AppError("Order item not found", 404)
        const order = await Order.findByPk(item.order_id!)
        if (!order || (order.user_id && order.user_id !== String(req.user.id))) {
          throw new AppError("Insufficient permissions for this order item", 403)
        }
      }
    }
    payload.user_id = req.user?.id
    const complaint = await complaintService.create(payload)
    res.status(201).json({ status: "success", data: complaint })
  } catch (error) {
    next(error)
  }
}

export const updateComplaint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const complaint = await complaintService.update(req.params.id, req.body)
    res.json({ status: "success", data: complaint })
  } catch (error) {
    next(error)
  }
}

export const deleteComplaint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await complaintService.delete(req.params.id)
    res.json({ status: "success", message: "Complaint deleted successfully" })
  } catch (error) {
    next(error)
  }
}
