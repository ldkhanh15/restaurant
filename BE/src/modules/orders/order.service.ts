import { Order } from "../../models/order.model";
import { OrderItem } from "../../models/orderItem.model";
import { v4 as uuidv4 } from "uuid";
import {
  CreateOrderDTO,
  UpdateOrderDTO,
  CreateOrderItemDTO,
  UpdateOrderItemDTO,
} from "../../types/dtos/order.dto";

export const OrderService = {
  async list() {
    return Order.findAll({ include: [OrderItem] });
  },

  async get(id: string) {
    return Order.findByPk(id, { include: [OrderItem] });
  },

  async create(payload: CreateOrderDTO) {
    const id = payload.id || uuidv4();
    const items = payload.items || [];
    const order = await Order.create({ id, ...payload });

    for (const item of items) {
      await OrderItem.create({
        id: uuidv4(),
        order_id: order.id,
        ...item,
      });
    }

    return Order.findByPk(order.id, { include: [OrderItem] });
  },

  async update(id: string, payload: UpdateOrderDTO) {
    const order = await Order.findByPk(id);
    if (!order) return null;
    await order.update(payload);
    return order;
  },

  async updateOrderItem(
    orderId: string,
    itemId: string,
    payload: UpdateOrderItemDTO
  ) {
    const item = await OrderItem.findOne({
      where: { id: itemId, order_id: orderId },
    });
    if (!item) return null;
    await item.update(payload);
    return Order.findByPk(orderId, { include: [OrderItem] });
  },
};
