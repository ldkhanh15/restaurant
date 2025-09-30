import type { Request, Response, NextFunction } from "express"
import sequelize from "../config/database"
import Order from "../models/Order"
import OrderItem from "../models/OrderItem"
import { AppError } from "../middlewares/errorHandler"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"

export const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(req.query)
    const offset = (page - 1) * limit

    const { count, rows } = await Order.findAndCountAll({
      limit,
      offset,
      order: [[sortBy, sortOrder]],
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

    res.json({ status: "success", data: order })
  } catch (error) {
    next(error)
  }
}

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction()

  try {
    const { items, ...orderData } = req.body

    // Calculate total amount
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

    // Create order items
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

    await order.update(req.body)
    res.json({ status: "success", data: order })
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

    await order.destroy()
    res.json({ status: "success", message: "Order deleted successfully" })
  } catch (error) {
    next(error)
  }
}
