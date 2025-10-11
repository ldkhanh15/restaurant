import type { Request, Response, NextFunction } from "express"
import sequelize from "../config/database"
import Order from "../models/Order"
import OrderItem from "../models/OrderItem"
import Voucher from "../models/Voucher"
import VoucherUsage from "../models/VoucherUsage"
import { AppError } from "../middlewares/errorHandler"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"
import orderService, { ORDER_ALLOWED_STATUSES } from "../services/orderService"
import Dish from "../models/Dish"
import Table from "../models/Table"
import Review from "../models/Review"
import Complaint from "../models/Complaint"
import { getIO } from "../sockets"
import { orderEvents } from "../sockets/orderSocket"

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
    try {
      orderEvents.orderCreated(getIO(), createdOrder)
    } catch { }
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
    try {
      orderEvents.orderStatusChanged(getIO(), updated)
    } catch { }
    res.json({ status: "success", data: updated })
  } catch (error) {
    next(error)
  }
}

export const applyVoucherToOrder = async (req: Request, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction()
  try {
    const { code } = req.body as { code: string }
    const orderId = req.params.id

    const order = await Order.findByPk(orderId, { include: [{ model: OrderItem, as: "items" }] })
    if (!order) throw new AppError("Order not found", 404)

    if (req.user?.role === "customer" && order.user_id && order.user_id !== String(req.user.id)) {
      throw new AppError("Insufficient permissions", 403)
    }

    const voucher = await Voucher.findOne({ where: { code, active: true } })
    if (!voucher) throw new AppError("Invalid voucher code", 400)

    const now = new Date()
    if (voucher.expiry_date && new Date(voucher.expiry_date) < now) {
      throw new AppError("Voucher expired", 400)
    }
    if (voucher.max_uses && voucher.current_uses >= voucher.max_uses) {
      throw new AppError("Voucher usage limit reached", 400)
    }

    const total_amount = Number(order.total_amount)
    if (voucher.min_order_value && total_amount < Number(voucher.min_order_value)) {
      throw new AppError("Order does not meet voucher minimum value", 400)
    }

    let discount = 0
    if (voucher.discount_type === "percentage") {
      discount = Math.min(Number(((total_amount * Number(voucher.value)) / 100).toFixed(2)), total_amount)
    } else {
      discount = Math.min(Number(voucher.value), total_amount)
    }

    const final_amount = Number((total_amount - discount).toFixed(2))

    await order.update(
      {
        voucher_id: voucher.id,
        voucher_discount_amount: discount,
        final_amount,
      },
      { transaction },
    )

    await VoucherUsage.create(
      { voucher_id: voucher.id, order_id: order.id, user_id: order.user_id },
      { transaction },
    )
    await voucher.update({ current_uses: voucher.current_uses + 1 }, { transaction })

    await transaction.commit()

    const updated = await Order.findByPk(order.id, { include: [{ model: OrderItem, as: "items" }] })
    try {
      orderEvents.orderUpdated(getIO(), updated)
    } catch { }
    res.json({ status: "success", data: updated })
  } catch (error) {
    await transaction.rollback()
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

// Helper to recompute order totals based on current items including event fee and deposit
const recomputeOrderTotals = async (order: Order, transaction?: any) => {
  const items = await OrderItem.findAll({ where: { order_id: order.id } })
  const subtotal = items.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0)
  const eventFee = Number(order.event_fee || 0)
  const deposit = Number(order.deposit_amount || 0)
  const discount = Number(order.voucher_discount_amount || 0)
  const total_amount = Number(subtotal.toFixed(2))
  const final_amount = Number((subtotal + eventFee - deposit - discount).toFixed(2))
  await order.update({ total_amount, final_amount }, { transaction })
}

export const addItemToOrder = async (req: Request, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction()
  try {
    const orderId = req.params.id
    const { dish_id, quantity } = req.body as { dish_id: string; quantity: number }

    const order = await Order.findByPk(orderId, { transaction })
    if (!order) throw new AppError("Order not found", 404)

    if (req.user?.role === "customer" && order.user_id && order.user_id !== String(req.user.id)) {
      throw new AppError("Insufficient permissions", 403)
    }

    if (!["pending", "preparing", "dining"].includes(order.status)) {
      throw new AppError("Order is not modifiable", 400)
    }

    const dish = await Dish.findByPk(dish_id)
    if (!dish || !dish.active) throw new AppError("Dish not available", 400)

    const existing = await OrderItem.findOne({ where: { order_id: order.id, dish_id }, transaction })
    if (existing) {
      await existing.update({ quantity: Number(existing.quantity) + Number(quantity) }, { transaction })
    } else {
      await OrderItem.create(
        {
          order_id: order.id,
          dish_id,
          quantity,
          price: dish.price,
        },
        { transaction },
      )
    }

    await recomputeOrderTotals(order, transaction)
    await transaction.commit()

    const updated = await Order.findByPk(order.id, { include: [{ model: OrderItem, as: "items" }] })
    try {
      orderEvents.orderUpdated(getIO(), updated)
    } catch { }
    res.status(200).json({ status: "success", data: updated })
  } catch (error) {
    await transaction.rollback()
    next(error)
  }
}

export const updateOrderItemQuantity = async (req: Request, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction()
  try {
    const { itemId } = req.params
    const { quantity } = req.body as { quantity: number }

    const item = await OrderItem.findByPk(itemId, { transaction })
    if (!item) throw new AppError("Order item not found", 404)

    const order = await Order.findByPk(item.order_id!, { transaction })
    if (!order) throw new AppError("Order not found", 404)

    if (req.user?.role === "customer" && order.user_id && order.user_id !== String(req.user.id)) {
      throw new AppError("Insufficient permissions", 403)
    }

    if (!["pending", "preparing", "dining"].includes(order.status)) {
      throw new AppError("Order is not modifiable", 400)
    }

    if (Number(quantity) === 0) {
      await item.destroy({ transaction })
    } else {
      await item.update({ quantity: Number(quantity) }, { transaction })
    }

    await recomputeOrderTotals(order, transaction)
    await transaction.commit()

    const updated = await Order.findByPk(order.id, { include: [{ model: OrderItem, as: "items" }] })
    try {
      orderEvents.orderUpdated(getIO(), updated)
    } catch { }
    res.json({ status: "success", data: updated })
  } catch (error) {
    await transaction.rollback()
    next(error)
  }
}

export const deleteOrderItem = async (req: Request, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction()
  try {
    const { itemId } = req.params
    const item = await OrderItem.findByPk(itemId, { transaction })
    if (!item) throw new AppError("Order item not found", 404)

    const order = await Order.findByPk(item.order_id!, { transaction })
    if (!order) throw new AppError("Order not found", 404)

    if (req.user?.role === "customer" && order.user_id && order.user_id !== String(req.user.id)) {
      throw new AppError("Insufficient permissions", 403)
    }

    if (!["pending", "preparing", "dining"].includes(order.status)) {
      throw new AppError("Order is not modifiable", 400)
    }

    await item.destroy({ transaction })
    await recomputeOrderTotals(order, transaction)
    await transaction.commit()

    const updated = await Order.findByPk(order.id, { include: [{ model: OrderItem, as: "items" }] })
    res.json({ status: "success", data: updated })
  } catch (error) {
    await transaction.rollback()
    next(error)
  }
}

export const changeOrderTable = async (req: Request, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction()
  try {
    const id = req.params.id
    const { new_table_id } = req.body as { new_table_id: string }
    const order = await Order.findByPk(id, { transaction })
    if (!order) throw new AppError("Order not found", 404)

    const newTable = await Table.findByPk(new_table_id, { transaction })
    if (!newTable) throw new AppError("Table not found", 404)
    if (newTable.status !== "available") throw new AppError("Table is not available", 400)

    if (order.table_id) {
      const oldTable = await Table.findByPk(order.table_id, { transaction })
      if (oldTable && oldTable.status === "occupied") await oldTable.update({ status: "available" }, { transaction })
    }

    await newTable.update({ status: "occupied" }, { transaction })
    await order.update({ table_id: new_table_id }, { transaction })

    await transaction.commit()
    const updated = await Order.findByPk(id, { include: [{ model: OrderItem, as: "items" }] })
    res.json({ status: "success", data: updated })
  } catch (error) {
    await transaction.rollback()
    next(error)
  }
}

export const requestSupport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // No WS layer in codebase now; placeholder for emit
    res.json({ status: "success", message: "Support requested" })
  } catch (error) {
    next(error)
  }
}

export const cancelOrderItem = async (req: Request, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction()
  try {
    const { orderId, itemId } = req.params
    const item = await OrderItem.findByPk(itemId, { transaction })
    if (!item) throw new AppError("Order item not found", 404)
    const order = await Order.findByPk(orderId, { transaction })
    if (!order) throw new AppError("Order not found", 404)

    if (req.user?.role === "customer" && order.user_id && order.user_id !== String(req.user.id)) {
      throw new AppError("Insufficient permissions", 403)
    }

    if (item.status !== "pending") throw new AppError("Only pending items can be cancelled", 400)

    await item.destroy({ transaction })
    await recomputeOrderTotals(order, transaction)
    await transaction.commit()
    const updated = await Order.findByPk(order.id, { include: [{ model: OrderItem, as: "items" }] })
    res.json({ status: "success", data: updated })
  } catch (error) {
    await transaction.rollback()
    next(error)
  }
}

export const updateOrderItemStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, itemId } = req.params
    const { status } = req.body as { status: "pending" | "completed" }

    const item = await OrderItem.findByPk(itemId)
    if (!item || item.order_id !== orderId) throw new AppError("Order item not found", 404)

    await item.update({ status })
    const updated = await Order.findByPk(orderId, { include: [{ model: OrderItem, as: "items" }] })
    res.json({ status: "success", data: updated })
  } catch (error) {
    next(error)
  }
}

export const getOrderSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id
    const order = await Order.findByPk(id, { include: [{ model: OrderItem, as: "items" }] })
    if (!order) throw new AppError("Order not found", 404)
    if (req.user?.role === "customer" && order.user_id && order.user_id !== String(req.user.id)) {
      throw new AppError("Insufficient permissions", 403)
    }

    const subtotal = Number(order.total_amount)
    const vatRate = Number(process.env.VAT_RATE || 0)
    const vat = Number(((subtotal * vatRate) / 100).toFixed(2))
    const event_fee = Number(order.event_fee || 0)
    const deposit = Number(order.deposit_amount || 0)
    const discount = Number(order.voucher_discount_amount || 0)
    const total = Number((subtotal + event_fee + vat - deposit - discount).toFixed(2))

    res.json({ status: "success", data: { subtotal, event_fee, deposit, vat_rate: vatRate, vat, discount, total } })
  } catch (error) {
    next(error)
  }
}

export const splitOrder = async (req: Request, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction()
  try {
    const id = req.params.id
    const { item_ids } = req.body as { item_ids: string[] }

    const source = await Order.findByPk(id, { transaction })
    if (!source) throw new AppError("Order not found", 404)

    const items = await OrderItem.findAll({ where: { order_id: id }, transaction })
    const moving = items.filter((i) => item_ids.includes(i.id))
    if (moving.length === 0) throw new AppError("No items to split", 400)

    const target = await Order.create(
      {
        user_id: source.user_id,
        table_id: source.table_id,
        status: "pending",
        total_amount: 0,
        voucher_discount_amount: 0,
        final_amount: 0,
      },
      { transaction },
    )

    for (const it of moving) {
      await it.update({ order_id: target.id }, { transaction })
    }

    await recomputeOrderTotals(source, transaction)
    await recomputeOrderTotals(target, transaction)
    await transaction.commit()

    const reloaded = await Order.findByPk(source.id, { include: [{ model: OrderItem, as: "items" }] })
    const newOrder = await Order.findByPk(target.id, { include: [{ model: OrderItem, as: "items" }] })
    res.json({ status: "success", data: { source: reloaded, target: newOrder } })
  } catch (error) {
    await transaction.rollback()
    next(error)
  }
}

export const removeVoucherFromOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id
    const order = await Order.findByPk(id)
    if (!order) throw new AppError("Order not found", 404)
    if (req.user?.role === "customer" && order.user_id && order.user_id !== String(req.user.id)) {
      throw new AppError("Insufficient permissions", 403)
    }
    await order.update({ voucher_id: null as any, voucher_discount_amount: 0, final_amount: Number(order.total_amount) })
    const updated = await Order.findByPk(id, { include: [{ model: OrderItem, as: "items" }] })
    res.json({ status: "success", data: updated })
  } catch (error) {
    next(error)
  }
}

export const applyManualDiscount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id
    const { amount } = req.body as { amount: number }
    const order = await Order.findByPk(id)
    if (!order) throw new AppError("Order not found", 404)
    const total = Number(order.total_amount)
    const discount = Math.min(Number(amount), total)
    const eventFee = Number(order.event_fee || 0)
    const deposit = Number(order.deposit_amount || 0)
    const final_amount = Number((total + eventFee - deposit - discount).toFixed(2))
    await order.update({ voucher_id: null as any, voucher_discount_amount: discount, final_amount })
    const updated = await Order.findByPk(id, { include: [{ model: OrderItem, as: "items" }] })
    res.json({ status: "success", data: updated })
  } catch (error) {
    next(error)
  }
}

export const setOrderEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id
    const { event_id, event_fee } = req.body as { event_id?: string; event_fee?: number }
    const order = await Order.findByPk(id)
    if (!order) throw new AppError("Order not found", 404)

    await order.update({ event_id: event_id || null as any, event_fee: Number(event_fee || 0) })
    await recomputeOrderTotals(order)
    const updated = await Order.findByPk(id, { include: [{ model: OrderItem, as: "items" }] })
    res.json({ status: "success", data: updated })
  } catch (error) {
    next(error)
  }
}

export const requestPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id
    const order = await Order.findByPk(id)
    if (!order) throw new AppError("Order not found", 404)
    await order.update({ status: "waiting_payment" })
    res.json({ status: "success", data: order })
  } catch (error) {
    next(error)
  }
}

export const updatePaymentMethod = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id
    const { payment_method } = req.body as { payment_method: any }
    const order = await Order.findByPk(id)
    if (!order) throw new AppError("Order not found", 404)
    await order.update({ payment_method })
    res.json({ status: "success", data: order })
  } catch (error) {
    next(error)
  }
}

export const completePayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id
    const order = await Order.findByPk(id)
    if (!order) throw new AppError("Order not found", 404)
    await order.update({ payment_status: "paid", status: "paid" })
    res.json({ status: "success", data: order })
  } catch (error) {
    next(error)
  }
}

export const getInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id
    const order = await Order.findByPk(id, { include: [{ model: OrderItem, as: "items" }] })
    if (!order) throw new AppError("Order not found", 404)
    res.json({ status: "success", data: { order, invoice: "INVOICE_PLACEHOLDER" } })
  } catch (error) {
    next(error)
  }
}

export const createOrderReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id
    const order = await Order.findByPk(id)
    if (!order) throw new AppError("Order not found", 404)
    const payload = { ...req.body, order_id: id, user_id: req.user?.id }
    const created = await Review.create(payload as any)
    res.status(201).json({ status: "success", data: created })
  } catch (error) {
    next(error)
  }
}

export const createOrderComplaint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id
    const order = await Order.findByPk(id)
    if (!order) throw new AppError("Order not found", 404)
    const payload = { ...req.body, order_id: id, user_id: req.user?.id }
    const created = await Complaint.create(payload as any)
    res.status(201).json({ status: "success", data: created })
  } catch (error) {
    next(error)
  }
}

export const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id
    const order = await Order.findByPk(id)
    if (!order) throw new AppError("Order not found", 404)
    await order.update({ status: "cancelled" })
    res.json({ status: "success", data: order })
  } catch (error) {
    next(error)
  }
}

export const getPrintPreview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id
    const order = await Order.findByPk(id, { include: [{ model: OrderItem, as: "items" }] })
    if (!order) throw new AppError("Order not found", 404)
    res.json({ status: "success", data: { order, preview: true } })
  } catch (error) {
    next(error)
  }
}

export const mergeOrders = async (req: Request, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction()
  try {
    const { source_table_id, target_table_id } = req.body as { source_table_id: string; target_table_id: string }

    if (!source_table_id || !target_table_id) {
      throw new AppError("source_table_id and target_table_id are required", 400)
    }
    if (source_table_id === target_table_id) {
      throw new AppError("source and target tables must be different", 400)
    }

    const [sourceTable, targetTable] = await Promise.all([
      Table.findByPk(source_table_id, { transaction }),
      Table.findByPk(target_table_id, { transaction }),
    ])
    if (!sourceTable || !targetTable) throw new AppError("Table not found", 404)
    if (sourceTable.status !== "occupied" || targetTable.status !== "occupied") {
      throw new AppError("Both tables must be occupied to merge", 400)
    }

    // Define active order status (use 'dining' as ongoing equivalent)
    const activeStatus: any = "dining"
    const sourceOrder = await Order.findOne({ where: { table_id: source_table_id, status: activeStatus }, include: [{ model: OrderItem, as: "items" }], transaction })
    const targetOrder = await Order.findOne({ where: { table_id: target_table_id, status: activeStatus }, include: [{ model: OrderItem, as: "items" }], transaction })
    if (!sourceOrder || !targetOrder) {
      throw new AppError("Both tables must have active orders to merge", 400)
    }

    // Move items from source to target (consolidate by dish)
    const sourceItems = await OrderItem.findAll({ where: { order_id: sourceOrder.id }, transaction })
    for (const sItem of sourceItems) {
      if (!sItem.dish_id) continue
      const tItem = await OrderItem.findOne({ where: { order_id: targetOrder.id, dish_id: sItem.dish_id }, transaction })
      if (tItem) {
        await tItem.update({ quantity: Number(tItem.quantity) + Number(sItem.quantity) }, { transaction })
        await sItem.destroy({ transaction })
      } else {
        await sItem.update({ order_id: targetOrder.id }, { transaction })
      }
    }

    // Recompute totals
    await recomputeOrderTotals(targetOrder, transaction)
    await recomputeOrderTotals(sourceOrder, transaction)

    // Mark source order as closed (use 'cancelled' due to enum)
    const mergedNote = `merged_into:${targetOrder.id}; from_table:${source_table_id}`
    const targetNote = `merged_from_table:${source_table_id}; merged_order:${sourceOrder.id}`
    await sourceOrder.update({ status: "cancelled", notes: sourceOrder.notes ? `${sourceOrder.notes}\n${mergedNote}` : mergedNote }, { transaction })
    await targetOrder.update({ notes: targetOrder.notes ? `${targetOrder.notes}\n${targetNote}` : targetNote }, { transaction })

    // Free source table
    await sourceTable.update({ status: "available" }, { transaction })

    await transaction.commit()

    const merged = await Order.findByPk(targetOrder.id, { include: [{ model: OrderItem, as: "items" }] })
    try { orderEvents.orderUpdated(getIO(), merged) } catch { }
    res.json({ status: "success", data: merged })
  } catch (error) {
    await transaction.rollback()
    next(error)
  }
}
