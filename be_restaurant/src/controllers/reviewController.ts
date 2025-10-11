import type { Request, Response, NextFunction } from "express"
import reviewService from "../services/reviewService"
import Order from "../models/Order"
import OrderItem from "../models/OrderItem"
import { AppError } from "../middlewares/errorHandler"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"

export const getAllReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, sortBy = "created_at", sortOrder = "DESC" } = getPaginationParams(req.query)
    const offset = (page - 1) * limit
    const { rows, count } = await reviewService.findAllWithUser({
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

export const getReviewById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const review = await reviewService.findById(req.params.id)
    res.json({ status: "success", data: review })
  } catch (error) {
    next(error)
  }
}

export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body as any
    // Validate relationships: must reference order or order_item for type dish, or order/table for type table
    if (payload.type === "dish") {
      if (!payload.order_item_id && !payload.dish_id) {
        throw new AppError("Dish review must reference order_item_id or dish_id", 400)
      }
    }
    if (payload.type === "table") {
      if (!payload.table_id && !payload.order_id) {
        throw new AppError("Table review must reference table_id or order_id", 400)
      }
    }

    // If customer, ensure the order belongs to them
    if (req.user?.role === "customer" && payload.order_id) {
      const order = await Order.findByPk(payload.order_id)
      if (!order || (order.user_id && order.user_id !== String(req.user.id))) {
        throw new AppError("Insufficient permissions for this order", 403)
      }
    }

    if (req.user?.role === "customer" && payload.order_item_id) {
      const item = await OrderItem.findByPk(payload.order_item_id)
      if (!item) throw new AppError("Order item not found", 404)
      const order = await Order.findByPk(item.order_id!)
      if (!order || (order.user_id && order.user_id !== String(req.user.id))) {
        throw new AppError("Insufficient permissions for this order item", 403)
      }
    }

    payload.user_id = req.user?.id
    const review = await reviewService.create(payload)
    res.status(201).json({ status: "success", data: review })
  } catch (error) {
    next(error)
  }
}

export const updateReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const review = await reviewService.update(req.params.id, req.body)
    res.json({ status: "success", data: review })
  } catch (error) {
    next(error)
  }
}

export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await reviewService.delete(req.params.id)
    res.json({ status: "success", message: "Review deleted successfully" })
  } catch (error) {
    next(error)
  }
}