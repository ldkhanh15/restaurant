import { BaseService } from "./baseService"
import OrderItem from "../models/OrderItem"
import Order from "../models/Order"
import Dish from "../models/Dish"

class OrderItemService extends BaseService<OrderItem> {
  constructor() {
    super(OrderItem)
  }

  async findAllWithDetails(options?: any) {
    return await this.findAll({
      ...options,
      include: [
        { model: Order, as: "order" },
        { model: Dish, as: "dish" },
      ],
    })
  }
}

export default new OrderItemService()
