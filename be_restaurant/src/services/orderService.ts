import { BaseService } from "./baseService"
import Order from "../models/Order"
import User from "../models/User"
import Table from "../models/Table"
import OrderItem from "../models/OrderItem"

class OrderService extends BaseService<Order> {
  constructor() {
    super(Order)
  }

  async findAllWithDetails(options?: any) {
    return await this.findAll({
      ...options,
      include: [
        { model: User, as: "user" },
        { model: Table, as: "table" },
        { model: OrderItem, as: "items" },
      ],
    })
  }

  async findByIdWithDetails(id: number) {
    return await this.findById(id, {
      include: [
        { model: User, as: "user" },
        { model: Table, as: "table" },
        { model: OrderItem, as: "items" },
      ],
    })
  }
}

export default new OrderService()
