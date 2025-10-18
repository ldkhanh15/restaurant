import { Op } from "sequelize";
import Order from "../models/Order";
import OrderItem from "../models/OrderItem";
import User from "../models/User";
import Table from "../models/Table";
import TableGroup from "../models/TableGroup";
import Dish from "../models/Dish";
import Voucher from "../models/Voucher";
import Reservation from "../models/Reservation";
import { AppError } from "../middlewares/errorHandler";

export interface OrderFilters {
  date?: string;
  status?: string;
  user_id?: string;
  table_id?: string;
  table_group_id?: string;
  page?: number;
  limit?: number;
}

export interface OrderWithDetails {
  id: string;
  user_id?: string;
  table_id?: string;
  table_group_id?: string;
  reservation_id?: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  total_amount: number;
  final_amount: number;
  voucher_id?: string;
  voucher_discount_amount?: number;
  event_fee?: number;
  deposit_amount?: number;
  created_at?: Date;
  updated_at?: Date;
  user?: User;
  table?: Table;
  table_group?: TableGroup;
  reservation?: Reservation;
  voucher?: Voucher;
  items?: Array<OrderItem & { dish?: Dish }>;
}

class OrderRepository {
  async findAll(filters: OrderFilters = {}) {
    const { page = 1, limit = 10, ...whereFilters } = filters;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (whereFilters.date) {
      const startOfDay = new Date(whereFilters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(whereFilters.date);
      endOfDay.setHours(23, 59, 59, 999);

      where.created_at = {
        [Op.between]: [startOfDay, endOfDay],
      };
    }

    if (whereFilters.status) {
      where.status = whereFilters.status;
    }

    if (whereFilters.user_id) {
      where.user_id = whereFilters.user_id;
    }

    if (whereFilters.table_id) {
      where.table_id = whereFilters.table_id;
    }

    if (whereFilters.table_group_id) {
      where.table_group_id = whereFilters.table_group_id;
    }

    const { rows, count } = await Order.findAndCountAll({
      where,
      limit,
      offset,
      order: [["created_at", "DESC"]],
      include: [
        { model: User, as: "user" },
        { model: Table, as: "table" },
        { model: Reservation, as: "reservation" },
        { model: Voucher, as: "voucher" },
      ],
    });

    return { rows, count, page, limit };
  }

  async findById(id: string): Promise<OrderWithDetails | null> {
    const order = await Order.findByPk(id, {
      include: [
        { model: User, as: "user" },
        { model: Table, as: "table" },
        { model: Reservation, as: "reservation" },
        { model: Voucher, as: "voucher" },
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Dish, as: "dish" }],
        },
      ],
    });

    return order as OrderWithDetails;
  }

  async findByTableId(
    tableId: string,
    status?: string
  ): Promise<OrderWithDetails | null> {
    const where: any = { table_id: tableId };
    if (status) {
      where.status = status;
    }

    const order = await Order.findOne({
      where,
      include: [
        { model: User, as: "user" },
        { model: Table, as: "table" },
        { model: TableGroup, as: "table_group" },
        { model: Reservation, as: "reservation" },
        { model: Voucher, as: "voucher" },
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Dish, as: "dish" }],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return order as OrderWithDetails;
  }

  async findByTableGroupId(
    tableGroupId: string,
    status?: string
  ): Promise<OrderWithDetails | null> {
    const where: any = { table_group_id: tableGroupId };
    if (status) {
      where.status = status;
    }

    const order = await Order.findOne({
      where,
      include: [
        { model: User, as: "user" },
        { model: Table, as: "table" },
        { model: TableGroup, as: "table_group" },
        { model: Reservation, as: "reservation" },
        { model: Voucher, as: "voucher" },
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Dish, as: "dish" }],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return order as OrderWithDetails;
  }

  async create(data: any): Promise<Order> {
    return await Order.create(data);
  }

  async update(id: string, data: any): Promise<Order> {
    const order = await Order.findByPk(id);
    if (!order) {
      throw new AppError("Order not found",404);
    }

    await order.update(data);
    return order;
  }

  async delete(id: string): Promise<void> {
    const order = await Order.findByPk(id);
    if (!order) {
      throw new AppError("Order not found",404);
    }

    await order.destroy();
  }

  async updateStatus(
    id: string,
    status:
      | "pending"
      | "dining"
      | "waiting_payment"
      | "preparing"
      | "ready"
      | "paid"
      | "cancelled"
  ): Promise<Order> {
    const order = await Order.findByPk(id);
    if (!order) {
      throw new AppError("Order not found",404);
    }

    await order.update({ status });
    return order;
  }

  async addItem(
    orderId: string,
    dishId: string,
    quantity: number,
    price: number
  ): Promise<OrderItem> {
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new AppError("Order not found",404);
    }

    // Check if item already exists
    const existingItem = await OrderItem.findOne({
      where: { order_id: orderId, dish_id: dishId },
    });

    if (existingItem) {
      await existingItem.update({
        quantity: Number(existingItem.quantity) + Number(quantity),
      });
      return existingItem;
    } else {
      return await OrderItem.create({
        order_id: orderId,
        dish_id: dishId,
        quantity,
        price,
        status: "pending",
      });
    }
  }

  async updateItemQuantity(
    itemId: string,
    quantity: number
  ): Promise<OrderItem> {
    const item = await OrderItem.findByPk(itemId);
    if (!item) {
      throw new AppError("Order item not found",404);
    }

    if (quantity === 0) {
      await item.destroy();
      return item;
    } else {
      await item.update({ quantity });
    return item;
  }
  }

  async updateItemStatus(
    itemId: string,
    status: "pending" | "completed"
  ): Promise<OrderItem> {
    const item = await OrderItem.findByPk(itemId);
    if (!item) {
      throw new AppError("Order item not found",404);
    }

    await item.update({ status });
    return item;
  }

  async deleteItem(itemId: string): Promise<void> {
    const item = await OrderItem.findByPk(itemId);
    if (!item) {
      throw new AppError("Order item not found",404);
    }

    await item.destroy();
  }

  async applyVoucher(
    orderId: string,
    voucherId: string,
    discountAmount: number
  ): Promise<Order> {
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new AppError("Order not found",404);
    }

    const finalAmount = Math.max(0, order.total_amount - discountAmount);

    await order.update({
      voucher_id: voucherId,
      voucher_discount_amount: discountAmount,
      final_amount: finalAmount,
    });

    return order;
  }

  async removeVoucher(orderId: string): Promise<Order> {
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new AppError("Order not found",404);
    }

    await order.update({
      voucher_id: undefined,
      voucher_discount_amount: 0,
      final_amount: order.total_amount,
    });

    return order;
  }

  async mergeOrders(
    sourceOrderId: string,
    targetOrderId: string
  ): Promise<Order> {
    const sourceOrder = await Order.findByPk(sourceOrderId);
    const targetOrder = await Order.findByPk(targetOrderId);

    if (!sourceOrder || !targetOrder) {
      throw new AppError("One or both orders not found",404);
    }

    // Get all items from source order
    const sourceItems = await OrderItem.findAll({
      where: { order_id: sourceOrderId },
    });

    // Merge items into target order
    for (const item of sourceItems) {
      const existingItem = await OrderItem.findOne({
        where: { order_id: targetOrderId, dish_id: item.dish_id },
      });

      if (existingItem) {
        await existingItem.update({
          quantity: existingItem.quantity + item.quantity,
        });
        await item.destroy();
      } else {
        await item.update({ order_id: targetOrderId });
      }
    }

    // Recalculate target order totals
    const targetItems = await OrderItem.findAll({
      where: { order_id: targetOrderId },
    });

    const totalAmount = targetItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const finalAmount = Math.max(
      0,
      totalAmount - (targetOrder.voucher_discount_amount || 0)
    );

    await targetOrder.update({
      total_amount: totalAmount,
      final_amount: finalAmount,
    });

    // Cancel source order
    await sourceOrder.update({ status: "cancelled" });

    return targetOrder;
  }

  async getRevenueStats(startDate: Date, endDate: Date) {
    const orders = await Order.findAll({
      where: {
        created_at: {
          [Op.between]: [startDate, endDate],
        },
        status: "paid",
      },
      attributes: [
        "status",
        "payment_method",
        [
          Order.sequelize!.fn("SUM", Order.sequelize!.col("final_amount")),
          "total_revenue",
        ],
        [
          Order.sequelize!.fn("COUNT", Order.sequelize!.col("id")),
          "total_orders",
        ],
      ],
      group: ["status", "payment_method"],
      raw: true,
    });

    return orders;
  }
}

export default new OrderRepository();
