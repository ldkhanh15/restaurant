import { BaseService } from "./baseService"
import Order from "../models/Order"
import User from "../models/User"
import Table from "../models/Table"
import OrderItem from "../models/OrderItem"
import { Op, type FindOptions, type WhereOptions } from "sequelize"

export const ORDER_ALLOWED_STATUSES = [
  "pending",
  "preparing",
  "ready",
  "delivered",
  "paid",
  "cancelled",
] as const

class OrderService extends BaseService<Order> {
  constructor() {
    super(Order)
  }

  buildSearchWhere(search?: string): WhereOptions | undefined {
    if (!search) return undefined

    const like = { [Op.like]: `%${search}%` }

    return {
      [Op.or]: [
        { status: like },
        { payment_status: like },
        { payment_method: like },
        { notes: like },
        { id: { [Op.like]: `${search}%` } },
      ],
    }
  }

  async findAllWithDetails(options?: FindOptions) {
    return await this.findAll({
      ...options,
      include: [
        { model: User, as: "user" },
        { model: Table, as: "table" },
        { model: OrderItem, as: "items" },
      ],
    })
  }

  async findByIdWithDetails(id: number | string) {
    return await this.findById(id as string, {
      include: [
        { model: User, as: "user" },
        { model: Table, as: "table" },
        { model: OrderItem, as: "items" },
      ],
    })
  }

  async getOrdersByUser(userId: string, options?: FindOptions) {
    return await this.findAllWithDetails({
      ...options,
      where: { ...(options?.where || {}), user_id: userId },
    })
  }

  async getOrdersByStatus(status: (typeof ORDER_ALLOWED_STATUSES)[number], options?: FindOptions) {
    return await this.findAllWithDetails({
      ...options,
      where: { ...(options?.where || {}), status },
    })
  }

  async searchOrders(search?: string, options?: FindOptions) {
    const where = this.buildSearchWhere(search)
    return await this.findAllWithDetails({ ...options, where: { ...(options?.where || {}), ...(where || {}) } })
  }

  async updateStatus(id: string, status: (typeof ORDER_ALLOWED_STATUSES)[number]) {
    const order = await Order.findByPk(id)
    if (!order) {
      throw new Error("Order not found")
    }
    await order.update({ status })
    return await Order.findByPk(id, { include: [{ model: OrderItem, as: "items" }] })
  }
}

export default new OrderService()
