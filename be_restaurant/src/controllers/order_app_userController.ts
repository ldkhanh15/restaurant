import type { Request, Response, NextFunction } from "express"
import sequelize from "../config/database"
import Order from "../models/Order"
import OrderItem from "../models/OrderItem"
import Voucher from "../models/Voucher"
import VoucherUsage from "../models/VoucherUsage"
import { AppError } from "../middlewares/errorHandler"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"
import orderAppUserService, { ORDER_ALLOWED_STATUSES } from "../services/order_app_userService"
import { getIO } from "../sockets"
import { orderEvents } from "../sockets/orderSocket"

export const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, sortBy = "created_at", sortOrder = "DESC" } = getPaginationParams(req.query)
    const offset = (page - 1) * limit
    const search = (req.query.search as string) || undefined

    const where = orderAppUserService.buildSearchWhere(search)

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
    // If no userId param provided, default to the authenticated user
    const userId = req.params.userId ?? (req.user ? String(req.user.id) : undefined)

    if (!userId) {
      throw new AppError("User id required", 400)
    }

    // Customers can only fetch their own orders
    if (req.user?.role === "customer" && userId !== String(req.user.id)) {
      throw new AppError("Insufficient permissions", 403)
    }

    const { count, rows } = await orderAppUserService.getOrdersByUser(userId, {
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
      const { count, rows } = await orderAppUserService.searchOrders(undefined, {
        limit,
        offset,
        order: [[sortBy, sortOrder]],
        where: { status, user_id: String(req.user.id) },
      })
      const result = buildPaginationResult(rows, count, page, limit)
      return res.json({ status: "success", data: result })
    }

    const { count, rows } = await orderAppUserService.getOrdersByStatus(status, {
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

export const processOrderPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { payment_method, payment_status } = req.body as {
      payment_method: "zalopay" | "momo" | "cash"
      payment_status: "pending" | "paid" | "failed"
    }

    // Basic validation
    if (!payment_method || !payment_status) {
      throw new AppError("Payment method and status are required", 400)
    }

    const order = await orderAppUserService.findById(id)
    if (!order) {
      throw new AppError("Order not found", 404)
    }

    if (req.user?.role === "customer" && order.user_id && order.user_id !== String(req.user.id)) {
      throw new AppError("Insufficient permissions", 403)
    }

    const updatedOrder = await orderAppUserService.processPayment(id, { payment_method, payment_status })
    res.json({ status: "success", data: updatedOrder })
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
    const { items, voucher_code, ...orderData } = req.body as {
      items: Array<{ dish_id: string; quantity: number; price: number; customizations?: any }>
      voucher_code?: string
      [key: string]: any
    }

    let total_amount = 0
    for (const item of items) {
      total_amount += Number(item.price) * Number(item.quantity)
    }

    let voucher_discount_amount = 0
    let voucher: Voucher | null = null
    if (voucher_code) {
      voucher = await Voucher.findOne({ where: { code: voucher_code, active: true } })
      if (!voucher) {
        throw new AppError("Invalid voucher code", 400)
      }
      const now = new Date()
      if (voucher.expiry_date && new Date(voucher.expiry_date) < now) {
        throw new AppError("Voucher expired", 400)
      }
      if (voucher.max_uses && voucher.current_uses >= voucher.max_uses) {
        throw new AppError("Voucher usage limit reached", 400)
      }
      if (voucher.min_order_value && total_amount < Number(voucher.min_order_value)) {
        throw new AppError("Order does not meet voucher minimum value", 400)
      }
      // Calculate discount
      if (voucher.discount_type === "percentage") {
        voucher_discount_amount = Math.min(
          Number(((total_amount * Number(voucher.value)) / 100).toFixed(2)),
          Number(total_amount),
        )
      } else {
        voucher_discount_amount = Math.min(Number(voucher.value), Number(total_amount))
      }
    }

    const final_amount = Number((Number(total_amount) - Number(voucher_discount_amount)).toFixed(2))

    const order = await Order.create(
      {
        ...orderData,
        total_amount,
        voucher_id: voucher ? voucher.id : undefined,
        voucher_discount_amount,
        final_amount,
      },
      { transaction },
    )

    const orderItems = items.map((item: any) => ({
      ...item,
      order_id: order.id,
    }))

    await OrderItem.bulkCreate(orderItems, { transaction })

    if (voucher) {
      await VoucherUsage.create(
        {
          voucher_id: voucher.id,
          order_id: order.id,
          user_id: order.user_id,
        },
        { transaction },
      )
      await voucher.update({ current_uses: voucher.current_uses + 1 }, { transaction })
    }

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

export const sendOrderToKitchen = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id
    const order = await Order.findByPk(id)
    if (!order) throw new AppError("Order not found", 404)

    // Customers can send to kitchen only for their own orders
    if (req.user?.role === "customer" && order.user_id && order.user_id !== String(req.user.id)) {
      throw new AppError("Insufficient permissions", 403)
    }

    // Set status to waiting_kitchen_confirmation
    await order.update({ status: "waiting_kitchen_confirmation" })
    const updated = await Order.findByPk(id, { include: [{ model: OrderItem, as: "items" }] })
    try { orderEvents.orderStatusChanged(getIO(), updated) } catch {}
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
