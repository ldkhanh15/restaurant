import type { Request, Response, NextFunction } from "express"
import sequelize from "../config/database"
import Order from "../models/Order"
import OrderItem from "../models/OrderItem"
import { AppError } from "../middlewares/errorHandler"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"
import orderService, { ORDER_ALLOWED_STATUSES } from "../services/orderService"

export const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, sortBy = "created_at", sortOrder = "DESC" } = getPaginationParams(req.query)
    const offset = (page - 1) * limit
    const search = (req.query.search as string) || undefined

    const where = orderService.buildSearchWhere(search)

    const { count, rows } = await Order.findAndCountAll({
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      where: where as any,
      include: [{ model: OrderItem, as: "items" }],
    })

    const result = buildPaginationResult(rows, count, page, limit)
    res.json({ status: "success", data: result })
  } catch (error) {
    next(error)
  }
}

export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: "items" }],
    })

    if (!order) {
      throw new AppError("Order not found", 404)
    }

    if (req.user?.role === "customer" && order.user_id && order.user_id !== String(req.user.id)) {
      throw new AppError("Insufficient permissions", 403)
    }

    res.json({ status: "success", data: order })
  } catch (error) {
    next(error)
  }
}

export const getOrdersByUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, sortBy = "created_at", sortOrder = "DESC" } = getPaginationParams(req.query)
    const offset = (page - 1) * limit
    const userId = req.params.userId

    if (req.user?.role === "customer" && userId !== String(req.user.id)) {
      throw new AppError("Insufficient permissions", 403)
    }

    const { count, rows } = await orderService.getOrdersByUser(userId, {
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

export const getOrdersByStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, sortBy = "created_at", sortOrder = "DESC" } = getPaginationParams(req.query)
    const offset = (page - 1) * limit
    const status = req.params.status as typeof ORDER_ALLOWED_STATUSES[number]

    if (!ORDER_ALLOWED_STATUSES.includes(status)) {
      throw new AppError("Invalid order status", 400)
    }

    if (req.user?.role === "customer") {
      const { count, rows } = await orderService.searchOrders(undefined, {
        limit,
        offset,
        order: [[sortBy, sortOrder]],
        where: { status, user_id: String(req.user.id) },
      })
      const result = buildPaginationResult(rows, count, page, limit)
      return res.json({ status: "success", data: result })
    }

    const { count, rows } = await orderService.getOrdersByStatus(status, {
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

export const getOrderDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: "items" }],
    })

    if (!order) {
      throw new AppError("Order not found", 404)
    }

    if (req.user?.role === "customer" && order.user_id && order.user_id !== String(req.user.id)) {
      throw new AppError("Insufficient permissions", 403)
    }

    res.json({ status: "success", data: order })
  } catch (error) {
    next(error)
  }
}

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction()

  try {
    const { items, ...orderData } = req.body

    let total_amount = 0
    for (const item of items) {
      total_amount += item.price * item.quantity
    }

    const order = await Order.create(
      {
        ...orderData,
        total_amount,
      },
      { transaction },
    )

    const orderItems = items.map((item: any) => ({
      ...item,
      order_id: order.id,
    }))

    await OrderItem.bulkCreate(orderItems, { transaction })

    await transaction.commit()

    const createdOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: "items" }],
    })

    res.status(201).json({ status: "success", data: createdOrder })
  } catch (error) {
    await transaction.rollback()
    next(error)
  }
}

export const updateOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await Order.findByPk(req.params.id)

    if (!order) {
      throw new AppError("Order not found", 404)
    }

    if (req.user?.role === "customer" && order.user_id && order.user_id !== String(req.user.id)) {
      throw new AppError("Insufficient permissions", 403)
    }

    await order.update(req.body)
    res.json({ status: "success", data: order })
  } catch (error) {
    next(error)
  }
}

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id
    const { status } = req.body as { status: typeof ORDER_ALLOWED_STATUSES[number] }

    if (!ORDER_ALLOWED_STATUSES.includes(status)) {
      throw new AppError("Invalid order status", 400)
    }

    const order = await Order.findByPk(id)
    if (!order) {
      throw new AppError("Order not found", 404)
    }

    if (req.user?.role === "customer" && order.user_id && order.user_id !== String(req.user.id)) {
      throw new AppError("Insufficient permissions", 403)
    }

    await order.update({ status })

    const updated = await Order.findByPk(id, { include: [{ model: OrderItem, as: "items" }] })

    res.json({ status: "success", data: updated })
  } catch (error) {
    next(error)
  }
}

export const deleteOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await Order.findByPk(req.params.id)

    if (!order) {
      throw new AppError("Order not found", 404)
    }

    if (req.user?.role === "customer" && order.user_id && order.user_id !== String(req.user.id)) {
      throw new AppError("Insufficient permissions", 403)
    }

    await order.destroy()
    res.json({ status: "success", message: "Order deleted successfully" })
  } catch (error) {
    next(error)
  }
}
