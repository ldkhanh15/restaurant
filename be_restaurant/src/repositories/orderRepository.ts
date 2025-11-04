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
import { Fn } from "sequelize/types/utils";

export interface OrderFilters {
  date?: string;
  start_date?: string | Date;
  end_date?: string | Date;
  status?: string;
  user_id?: string;
  customer_id?: string;
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

    // Handle date range filter (start_date and end_date take priority over date)
    if (whereFilters.start_date || whereFilters.end_date) {
      where.created_at = {};
      if (whereFilters.start_date) {
        const startDate = new Date(whereFilters.start_date);
        startDate.setHours(0, 0, 0, 0);
        where.created_at[Op.gte] = startDate;
      }
      if (whereFilters.end_date) {
        const endDate = new Date(whereFilters.end_date);
        endDate.setHours(23, 59, 59, 999);
        where.created_at[Op.lte] = endDate;
      }
    } else if (whereFilters.date) {
      // Legacy support: single date filter
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

    // Support both user_id and customer_id for compatibility
    if (whereFilters.customer_id) {
      where.user_id = whereFilters.customer_id;
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
      throw new AppError("Order not found", 404);
    }

    await order.update(data);
    return order;
  }

  async delete(id: string): Promise<void> {
    const order = await Order.findByPk(id);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    await order.destroy();
  }

  async updateStatus(
    id: string,
    status: "pending" | "paid" | "dining" | "waiting_payment" | "cancelled"
  ): Promise<Order> {
    const order = await Order.findByPk(id);
    if (!order) {
      throw new AppError("Order not found", 404);
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
      throw new AppError("Order not found", 404);
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
      throw new AppError("Order item not found", 404);
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
    status: "pending" | "completed" | "preparing" | "ready"
  ): Promise<OrderItem> {
    const item = await OrderItem.findByPk(itemId);
    if (!item) {
      throw new AppError("Order item not found", 404);
    }

    await item.update({ status });
    return item;
  }

  async deleteItem(itemId: string): Promise<void> {
    const item = await OrderItem.findByPk(itemId);
    if (!item) {
      throw new AppError("Order item not found", 404);
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
      throw new AppError("Order not found", 404);
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
      throw new AppError("Order not found", 404);
    }

    await order.update({
      voucher_id: null,
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
      throw new AppError("One or both orders not found", 404);
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

  async getRevenueStats() {
    // Lấy tổng số order
    const totalOrders = await Order.count();

    // Lấy tổng số order theo từng trạng thái
    const statusCounts = await Order.findAll({
      attributes: [
        "status",
        [Order.sequelize!.fn("COUNT", Order.sequelize!.col("id")), "count"],
      ],
      group: ["status"],
      raw: true,
    });

    // Chuyển kết quả thành dạng { pending: n, paid: n }
    const pendingOrders =
      statusCounts.find((s) => s.status === "pending")?.count || 0;
    const paidOrders =
      statusCounts.find((s) => s.status === "paid")?.count || 0;

    // Tính tổng doanh thu (chỉ tính các order đã thanh toán)
    const revenueResult = await Order.findOne({
      where: { status: "paid" },
      attributes: [
        [
          Order.sequelize!.fn("SUM", Order.sequelize!.col("final_amount")),
          "total_revenue",
        ],
      ],
      raw: true,
    });

    const totalRevenue = revenueResult?.total_revenue || 0;

    // Trả về object tổng hợp
    return {
      total_orders: totalOrders,
      total_pending_orders: pendingOrders,
      total_paid_orders: paidOrders,
      total_revenue: Number(totalRevenue),
    };
  }

  // 1. Thống kê theo tháng (12 tháng gần đây)
  async getMonthlyStats() {
    const now = new Date();
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(now.getMonth() - 11);

    const stats = await Order.findAll({
      where: {
        created_at: { [Op.gte]: twelveMonthsAgo },
        status: "paid",
      },
      attributes: [
        [
          Order.sequelize!.literal(
            `DATE_FORMAT(created_at, '%Y-%m')`
          ) as unknown as Fn,
          "month",
        ],
        [
          Order.sequelize!.fn("SUM", Order.sequelize!.col("final_amount")),
          "revenue",
        ],
        [
          Order.sequelize!.fn("COUNT", Order.sequelize!.col("id")),
          "order_count",
        ],
        [
          Order.sequelize!.fn(
            "COUNT",
            Order.sequelize!.fn("DISTINCT", Order.sequelize!.col("user_id"))
          ),
          "customer_count",
        ],
      ],
      group: [
        Order.sequelize!.literal(
          `DATE_FORMAT(created_at, '%Y-%m')`
        ) as unknown as Fn,
      ],
      order: [Order.sequelize!.literal(`DATE_FORMAT(created_at, '%Y-%m') ASC`)],
      raw: true,
    });

    const statsMap = new Map(
      stats.map((s: any) => [
        s.month,
        {
          month: s.month,
          revenue: parseFloat(s.revenue || 0),
          orders: parseInt(s.order_count || 0),
          customers: parseInt(s.customer_count || 0),
        },
      ])
    );

    const months: string[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(twelveMonthsAgo);
      d.setMonth(twelveMonthsAgo.getMonth() + i);
      const monthStr = d.toISOString().slice(0, 7);
      months.push(monthStr);
    }

    const fullStats = months.map((month) => {
      return (
        statsMap.get(month) || {
          month,
          revenue: 0,
          orders: 0,
          customers: 0,
        }
      );
    });

    return fullStats;
  }

  // 2. Thống kê theo giờ (24h, mỗi 2h)
  async getHourlyStats() {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Biểu thức dùng cho SELECT / GROUP / ORDER — phải GIỐNG NHAU
    const hourExpr = `DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00')`;

    const stats = await Order.findAll({
      where: {
        created_at: { [Op.gte]: twentyFourHoursAgo },
        status: "paid",
      },
      attributes: [
        [Order.sequelize!.literal(hourExpr), "hour"],
        [
          Order.sequelize!.fn("SUM", Order.sequelize!.col("final_amount")),
          "revenue",
        ],
        [
          Order.sequelize!.fn("COUNT", Order.sequelize!.col("id")),
          "order_count",
        ],
      ],
      // ép literal => Fn để hợp TypeScript
      group: [Order.sequelize!.literal(hourExpr) as unknown as Fn],
      order: [[Order.sequelize!.literal(hourExpr) as unknown as Fn, "ASC"]],
      raw: true,
    });

    // Gom nhóm 2 tiếng/lần (client-side)
    const hourlyData: any[] = [];
    // Use 'now' as reference date; ensure hours align to today's 00:00..23:00
    const base = new Date(now);
    base.setMinutes(0, 0, 0);
    for (let i = 0; i < 24; i += 2) {
      const startHour = new Date(base);
      startHour.setHours(i, 0, 0, 0);
      const endHour = new Date(base);
      endHour.setHours(i + 2, 0, 0, 0);

      const periodStats = stats.filter((stat: any) => {
        // stat.hour is like '2025-10-23 14:00:00'
        const statHour = new Date(stat.hour);
        return statHour >= startHour && statHour < endHour;
      });

      const totalRevenue = periodStats.reduce(
        (sum: number, stat: any) => sum + parseFloat(stat.revenue || 0),
        0
      );
      const totalOrders = periodStats.reduce(
        (sum: number, stat: any) => sum + parseInt(stat.order_count || 0),
        0
      );

      hourlyData.push({
        time: `${(i + 2).toString().padStart(2, "0")}:00`,
        revenue: totalRevenue,
        orders: totalOrders,
      });
    }

    return hourlyData;
  }

  // 3. Thống kê khách hàng (7 ngày)
  async getCustomerStats() {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6); // lấy đủ 7 ngày tính cả hôm nay

    // Sử dụng fn thay vì literal cho đúng kiểu type
    const dayExpr = Order.sequelize!.fn(
      "DATE_FORMAT",
      Order.sequelize!.col("created_at"),
      "%Y-%m-%d"
    );

    const stats = await Order.findAll({
      where: {
        created_at: { [Op.gte]: sevenDaysAgo },
        status: "paid",
      },
      attributes: [
        [dayExpr, "day"],
        [
          Order.sequelize!.fn(
            "COUNT",
            Order.sequelize!.fn("DISTINCT", Order.sequelize!.col("user_id"))
          ),
          "registered_customers",
        ],
        [
          Order.sequelize!.literal(
            `SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END)`
          ),
          "walk_in_customers",
        ],
      ],
      group: [dayExpr],
      order: [[dayExpr, "ASC"]],
      raw: true,
    });

    // Tạo map để tra nhanh dữ liệu theo ngày
    const statsMap = new Map(
      stats.map((s: any) => [
        s.day,
        {
          day: s.day,
          registered_customers: parseInt(s.registered_customers || 0),
          walk_in_customers: parseInt(s.walk_in_customers || 0),
        },
      ])
    );

    // Sinh danh sách 7 ngày gần nhất (YYYY-MM-DD)
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(sevenDaysAgo.getDate() + i);
      const dayStr = d.toISOString().slice(0, 10);
      days.push(dayStr);
    }

    // Gộp dữ liệu — điền 0 nếu ngày trống
    const fullStats = days.map((day) => {
      return (
        statsMap.get(day) || {
          day,
          registered_customers: 0,
          walk_in_customers: 0,
        }
      );
    });

    return fullStats;
  }

  // 4. Thống kê hôm nay
  async getTodayStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Import Reservation model
    const Reservation = (await import("../models/Reservation")).default;

    const [orderStats, reservationStats] = await Promise.all([
      // Order statistics
      Order.findAll({
        where: {
          created_at: {
            [Op.between]: [today, tomorrow],
          },
          status: "paid",
        },
        attributes: [
          [
            Order.sequelize!.fn("SUM", Order.sequelize!.col("final_amount")),
            "revenue",
          ],
          [
            Order.sequelize!.fn("COUNT", Order.sequelize!.col("id")),
            "order_count",
          ],
        ],
        raw: true,
      }),
      // Reservation statistics
      Reservation.findAll({
        where: {
          created_at: {
            [Op.between]: [today, tomorrow],
          },
        },
        attributes: [
          [
            Reservation.sequelize!.fn(
              "COUNT",
              Reservation.sequelize!.col("id")
            ),
            "reservation_count",
          ],
        ],
        raw: true,
      }),
    ]);

    return {
      revenue: orderStats[0]?.revenue || 0,
      order_count: orderStats[0]?.order_count || 0,
      reservation_count: reservationStats[0]?.reservation_count || 0,
    };
  }
}

export default new OrderRepository();
