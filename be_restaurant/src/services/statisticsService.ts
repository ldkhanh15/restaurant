import { Op } from "sequelize";
import Payment from "../models/Payment";
import Order from "../models/Order";
import Reservation from "../models/Reservation";
import User from "../models/User";
import Table from "../models/Table";
import OrderItem from "../models/OrderItem";
import Dish from "../models/Dish";

export interface RevenueStats {
  total_revenue: number;
  total_orders: number;
  total_reservations: number;
  total_payments: number;
  average_order_value: number;
  average_reservation_value: number;
}

export interface OrderStats {
  status: string;
  count: number;
  percentage: number;
}

export interface ReservationStats {
  status: string;
  count: number;
  percentage: number;
}

export interface PaymentStats {
  status: string;
  method: string;
  count: number;
  total_amount: number;
}

export interface TableRevenueStats {
  table_id: string;
  table_number: string;
  total_revenue: number;
  order_count: number;
  reservation_count: number;
}

export interface CustomerSpendingStats {
  user_id: string;
  user_name: string;
  user_email: string;
  total_spent: number;
  payment_count: number;
  order_count: number;
  reservation_count: number;
}

export interface DailyRevenueStats {
  date: string;
  revenue: number;
  payment_count: number;
  order_count: number;
  reservation_count: number;
}

export interface MonthlyRevenueStats {
  year: number;
  month: number;
  revenue: number;
  payment_count: number;
  order_count: number;
  reservation_count: number;
}

export interface DishStats {
  dish_id: string;
  dish_name: string;
  total_quantity: number;
  total_revenue: number;
  order_count: number;
}

class StatisticsService {
  async getRevenueStats(): Promise<RevenueStats> {
    const [
      totalRevenue,
      totalPayments,
      totalOrderRevenue,
      totalDepositRevenue,
    ] = await Promise.all([
      // Tổng tiền thanh toán hoàn thành
      Payment.sum("amount", { where: { status: "completed" } }),

      // Tổng số payment (mọi trạng thái)
      Payment.count(),

      // Tổng tiền thanh toán cho order hoàn thành
      Payment.sum("amount", {
        where: {
          status: "completed",
          order_id: { [Op.ne]: null }, // order_id khác null
        },
      }),

      // Tổng tiền thanh toán cho đặt cọc hoàn thành
      Payment.sum("amount", {
        where: {
          status: "completed",
          reservation_id: { [Op.ne]: null }, // reservation_id khác null
        },
      }),
    ]);

    return {
      total_revenue: totalRevenue || 0,
      total_payments: totalPayments,
      total_order_revenue: totalOrderRevenue || 0,
      total_deposit_revenue: totalDepositRevenue || 0,
    };
  }

  async getOrderStats(startDate?: Date, endDate?: Date): Promise<OrderStats[]> {
    const where: any = {};
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = startDate;
      if (endDate) where.created_at[Op.lte] = endDate;
    }

    const stats = await Order.findAll({
      where,
      attributes: [
        "status",
        [Order.sequelize!.fn("COUNT", Order.sequelize!.col("id")), "count"],
      ],
      group: ["status"],
      raw: true,
    });

    const totalCount = stats.reduce((sum, stat) => sum + Number(stat.count), 0);

    return stats.map((stat) => ({
      status: stat.status,
      count: Number(stat.count),
      percentage: totalCount > 0 ? (Number(stat.count) / totalCount) * 100 : 0,
    }));
  }

  async getReservationStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<ReservationStats[]> {
    const where: any = {};
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = startDate;
      if (endDate) where.created_at[Op.lte] = endDate;
    }

    const stats = await Reservation.findAll({
      where,
      attributes: [
        "status",
        [
          Reservation.sequelize!.fn("COUNT", Reservation.sequelize!.col("id")),
          "count",
        ],
      ],
      group: ["status"],
      raw: true,
    });

    const totalCount = stats.reduce((sum, stat) => sum + Number(stat.count), 0);

    return stats.map((stat) => ({
      status: stat.status,
      count: Number(stat.count),
      percentage: totalCount > 0 ? (Number(stat.count) / totalCount) * 100 : 0,
    }));
  }

  async getPaymentStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<PaymentStats[]> {
    const where: any = {};
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = startDate;
      if (endDate) where.created_at[Op.lte] = endDate;
    }

    const stats = await Payment.findAll({
      where,
      attributes: [
        "status",
        "method",
        [Payment.sequelize!.fn("COUNT", Payment.sequelize!.col("id")), "count"],
        [
          Payment.sequelize!.fn("SUM", Payment.sequelize!.col("amount")),
          "total_amount",
        ],
      ],
      group: ["status", "method"],
      raw: true,
    });

    return stats.map((stat) => ({
      status: stat.status,
      method: stat.method,
      count: Number(stat.count),
      total_amount: Number(stat.total_amount) || 0,
    }));
  }

  async getTableRevenueStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<TableRevenueStats[]> {
    const where: any = { status: "completed" };
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = startDate;
      if (endDate) where.created_at[Op.lte] = endDate;
    }

    // Get revenue from orders
    const orderRevenue = await Payment.findAll({
      where: { ...where, order_id: { [Op.ne]: null } },
      include: [
        {
          model: Order,
          as: "order",
          include: [{ model: Table, as: "table" }],
        },
      ],
      attributes: [
        [
          Payment.sequelize!.fn("SUM", Payment.sequelize!.col("amount")),
          "revenue",
        ],
        [
          Payment.sequelize!.fn("COUNT", Payment.sequelize!.col("id")),
          "order_count",
        ],
      ],
      group: ["order.table.id"],
      raw: true,
    });

    // Get revenue from reservations
    const reservationRevenue = await Payment.findAll({
      where: { ...where, reservation_id: { [Op.ne]: null } },
      include: [
        {
          model: Reservation,
          as: "reservation",
          include: [{ model: Table, as: "table" }],
        },
      ],
      attributes: [
        [
          Payment.sequelize!.fn("SUM", Payment.sequelize!.col("amount")),
          "revenue",
        ],
        [
          Payment.sequelize!.fn("COUNT", Payment.sequelize!.col("id")),
          "reservation_count",
        ],
      ],
      group: ["reservation.table.id"],
      raw: true,
    });

    // Combine results
    const tableStats: { [key: string]: TableRevenueStats } = {};

    orderRevenue.forEach((stat) => {
      const tableId = (stat as any)["order.table.id"];
      if (tableId) {
        tableStats[tableId] = {
          table_id: tableId,
          table_number: (stat as any)["order.table.table_number"] || "Unknown",
          total_revenue: Number(stat.revenue) || 0,
          order_count: Number(stat.order_count) || 0,
          reservation_count: 0,
        };
      }
    });

    reservationRevenue.forEach((stat) => {
      const tableId = (stat as any)["reservation.table.id"];
      if (tableId) {
        if (tableStats[tableId]) {
          tableStats[tableId].total_revenue += Number(stat.revenue) || 0;
          tableStats[tableId].reservation_count =
            Number(stat.reservation_count) || 0;
        } else {
          tableStats[tableId] = {
            table_id: tableId,
            table_number:
              (stat as any)["reservation.table.table_number"] || "Unknown",
            total_revenue: Number(stat.revenue) || 0,
            order_count: 0,
            reservation_count: Number(stat.reservation_count) || 0,
          };
        }
      }
    });

    return Object.values(tableStats).sort(
      (a, b) => b.total_revenue - a.total_revenue
    );
  }

  async getCustomerSpendingStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<CustomerSpendingStats[]> {
    const where: any = { status: "completed" };
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = startDate;
      if (endDate) where.created_at[Op.lte] = endDate;
    }

    // Get spending from orders
    const orderSpending = await Payment.findAll({
      where: { ...where, order_id: { [Op.ne]: null } },
      include: [
        {
          model: Order,
          as: "order",
          include: [{ model: User, as: "user" }],
        },
      ],
      attributes: [
        [
          Payment.sequelize!.fn("SUM", Payment.sequelize!.col("amount")),
          "total_spent",
        ],
        [
          Payment.sequelize!.fn("COUNT", Payment.sequelize!.col("id")),
          "payment_count",
        ],
      ],
      group: ["order.user.id"],
      raw: true,
    });

    // Get spending from reservations
    const reservationSpending = await Payment.findAll({
      where: { ...where, reservation_id: { [Op.ne]: null } },
      include: [
        {
          model: Reservation,
          as: "reservation",
          include: [{ model: User, as: "user" }],
        },
      ],
      attributes: [
        [
          Payment.sequelize!.fn("SUM", Payment.sequelize!.col("amount")),
          "total_spent",
        ],
        [
          Payment.sequelize!.fn("COUNT", Payment.sequelize!.col("id")),
          "payment_count",
        ],
      ],
      group: ["reservation.user.id"],
      raw: true,
    });

    // Get order and reservation counts
    const orderCounts = await Order.findAll({
      where:
        startDate || endDate
          ? {
              created_at:
                startDate || endDate
                  ? {
                      ...(startDate && { [Op.gte]: startDate }),
                      ...(endDate && { [Op.lte]: endDate }),
                    }
                  : {},
            }
          : {},
      attributes: [
        "user_id",
        [
          Order.sequelize!.fn("COUNT", Order.sequelize!.col("id")),
          "order_count",
        ],
      ],
      group: ["user_id"],
      raw: true,
    });

    const reservationCounts = await Reservation.findAll({
      where:
        startDate || endDate
          ? {
              created_at:
                startDate || endDate
                  ? {
                      ...(startDate && { [Op.gte]: startDate }),
                      ...(endDate && { [Op.lte]: endDate }),
                    }
                  : {},
            }
          : {},
      attributes: [
        "user_id",
        [
          Reservation.sequelize!.fn("COUNT", Reservation.sequelize!.col("id")),
          "reservation_count",
        ],
      ],
      group: ["user_id"],
      raw: true,
    });

    // Combine results
    const customerStats: { [key: string]: CustomerSpendingStats } = {};

    orderSpending.forEach((stat) => {
      const userId = (stat as any)["order.user.id"];
      if (userId) {
        customerStats[userId] = {
          user_id: userId,
          user_name: (stat as any)["order.user.name"] || "Unknown",
          user_email: (stat as any)["order.user.email"] || "Unknown",
          total_spent: Number(stat.total_spent) || 0,
          payment_count: Number(stat.payment_count) || 0,
          order_count: 0,
          reservation_count: 0,
        };
      }
    });

    reservationSpending.forEach((stat) => {
      const userId = (stat as any)["reservation.user.id"];
      if (userId) {
        if (customerStats[userId]) {
          customerStats[userId].total_spent += Number(stat.total_spent) || 0;
          customerStats[userId].payment_count +=
            Number(stat.payment_count) || 0;
        } else {
          customerStats[userId] = {
            user_id: userId,
            user_name: (stat as any)["reservation.user.name"] || "Unknown",
            user_email: (stat as any)["reservation.user.email"] || "Unknown",
            total_spent: Number(stat.total_spent) || 0,
            payment_count: Number(stat.payment_count) || 0,
            order_count: 0,
            reservation_count: 0,
          };
        }
      }
    });

    // Add order and reservation counts
    orderCounts.forEach((stat) => {
      if (customerStats[stat.user_id!]) {
        customerStats[stat.user_id!].order_count =
          Number(stat.order_count) || 0;
      }
    });

    reservationCounts.forEach((stat) => {
      if (customerStats[stat.user_id!]) {
        customerStats[stat.user_id!].reservation_count =
          Number(stat.reservation_count) || 0;
      }
    });

    return Object.values(customerStats).sort(
      (a, b) => b.total_spent - a.total_spent
    );
  }

  async getDailyRevenueStats(
    startDate: Date,
    endDate: Date
  ): Promise<DailyRevenueStats[]> {
    const dailyStats = await Payment.findAll({
      where: {
        status: "completed",
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        [
          Payment.sequelize!.fn("DATE", Payment.sequelize!.col("created_at")),
          "date",
        ],
        [
          Payment.sequelize!.fn("SUM", Payment.sequelize!.col("amount")),
          "revenue",
        ],
        [
          Payment.sequelize!.fn("COUNT", Payment.sequelize!.col("id")),
          "payment_count",
        ],
      ],
      group: [
        Payment.sequelize!.fn("DATE", Payment.sequelize!.col("created_at")),
      ],
      order: [
        [
          Payment.sequelize!.fn("DATE", Payment.sequelize!.col("created_at")),
          "ASC",
        ],
      ],
      raw: true,
    });

    // Get order and reservation counts for each day
    const orderCounts = await Order.findAll({
      where: {
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        [
          Order.sequelize!.fn("DATE", Order.sequelize!.col("created_at")),
          "date",
        ],
        [
          Order.sequelize!.fn("COUNT", Order.sequelize!.col("id")),
          "order_count",
        ],
      ],
      group: [Order.sequelize!.fn("DATE", Order.sequelize!.col("created_at"))],
      raw: true,
    });

    const reservationCounts = await Reservation.findAll({
      where: {
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        [
          Reservation.sequelize!.fn(
            "DATE",
            Reservation.sequelize!.col("created_at")
          ),
          "date",
        ],
        [
          Reservation.sequelize!.fn("COUNT", Reservation.sequelize!.col("id")),
          "reservation_count",
        ],
      ],
      group: [
        Reservation.sequelize!.fn(
          "DATE",
          Reservation.sequelize!.col("created_at")
        ),
      ],
      raw: true,
    });

    // Combine results
    const statsMap: { [key: string]: DailyRevenueStats } = {};

    dailyStats.forEach((stat) => {
      const date = stat.date as string;
      statsMap[date] = {
        date,
        revenue: Number(stat.revenue) || 0,
        payment_count: Number(stat.payment_count) || 0,
        order_count: 0,
        reservation_count: 0,
      };
    });

    orderCounts.forEach((stat) => {
      const date = stat.date as string;
      if (statsMap[date]) {
        statsMap[date].order_count = Number(stat.order_count) || 0;
      }
    });

    reservationCounts.forEach((stat) => {
      const date = stat.date as string;
      if (statsMap[date]) {
        statsMap[date].reservation_count = Number(stat.reservation_count) || 0;
      }
    });

    return Object.values(statsMap).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  async getMonthlyRevenueStats(
    startDate: Date,
    endDate: Date
  ): Promise<MonthlyRevenueStats[]> {
    const monthlyStats = await Payment.findAll({
      where: {
        status: "completed",
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        [
          Payment.sequelize!.fn("YEAR", Payment.sequelize!.col("created_at")),
          "year",
        ],
        [
          Payment.sequelize!.fn("MONTH", Payment.sequelize!.col("created_at")),
          "month",
        ],
        [
          Payment.sequelize!.fn("SUM", Payment.sequelize!.col("amount")),
          "revenue",
        ],
        [
          Payment.sequelize!.fn("COUNT", Payment.sequelize!.col("id")),
          "payment_count",
        ],
      ],
      group: [
        Payment.sequelize!.fn("YEAR", Payment.sequelize!.col("created_at")),
        Payment.sequelize!.fn("MONTH", Payment.sequelize!.col("created_at")),
      ],
      order: [
        [
          Payment.sequelize!.fn("YEAR", Payment.sequelize!.col("created_at")),
          "ASC",
        ],
        [
          Payment.sequelize!.fn("MONTH", Payment.sequelize!.col("created_at")),
          "ASC",
        ],
      ],
      raw: true,
    });

    // Get order and reservation counts for each month
    const orderCounts = await Order.findAll({
      where: {
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        [
          Order.sequelize!.fn("YEAR", Order.sequelize!.col("created_at")),
          "year",
        ],
        [
          Order.sequelize!.fn("MONTH", Order.sequelize!.col("created_at")),
          "month",
        ],
        [
          Order.sequelize!.fn("COUNT", Order.sequelize!.col("id")),
          "order_count",
        ],
      ],
      group: [
        Order.sequelize!.fn("YEAR", Order.sequelize!.col("created_at")),
        Order.sequelize!.fn("MONTH", Order.sequelize!.col("created_at")),
      ],
      raw: true,
    });

    const reservationCounts = await Reservation.findAll({
      where: {
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        [
          Reservation.sequelize!.fn(
            "YEAR",
            Reservation.sequelize!.col("created_at")
          ),
          "year",
        ],
        [
          Reservation.sequelize!.fn(
            "MONTH",
            Reservation.sequelize!.col("created_at")
          ),
          "month",
        ],
        [
          Reservation.sequelize!.fn("COUNT", Reservation.sequelize!.col("id")),
          "reservation_count",
        ],
      ],
      group: [
        Reservation.sequelize!.fn(
          "YEAR",
          Reservation.sequelize!.col("created_at")
        ),
        Reservation.sequelize!.fn(
          "MONTH",
          Reservation.sequelize!.col("created_at")
        ),
      ],
      raw: true,
    });

    // Combine results
    const statsMap: { [key: string]: MonthlyRevenueStats } = {};

    monthlyStats.forEach((stat) => {
      const key = `${stat.year}-${stat.month}`;
      statsMap[key] = {
        year: Number(stat.year),
        month: Number(stat.month),
        revenue: Number(stat.revenue) || 0,
        payment_count: Number(stat.payment_count) || 0,
        order_count: 0,
        reservation_count: 0,
      };
    });

    orderCounts.forEach((stat) => {
      const key = `${stat.year}-${stat.month}`;
      if (statsMap[key]) {
        statsMap[key].order_count = Number(stat.order_count) || 0;
      }
    });

    reservationCounts.forEach((stat) => {
      const key = `${stat.year}-${stat.month}`;
      if (statsMap[key]) {
        statsMap[key].reservation_count = Number(stat.reservation_count) || 0;
      }
    });

    return Object.values(statsMap).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  }

  async getDishStats(startDate?: Date, endDate?: Date): Promise<DishStats[]> {
    const where: any = {};
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = startDate;
      if (endDate) where.created_at[Op.lte] = endDate;
    }

    const dishStats = await OrderItem.findAll({
      where,
      include: [
        {
          model: Order,
          as: "order",
          where: { status: { [Op.in]: ["paid", "completed"] } },
        },
        {
          model: Dish,
          as: "dish",
        },
      ],
      attributes: [
        "dish_id",
        [
          OrderItem.sequelize!.fn("SUM", OrderItem.sequelize!.col("quantity")),
          "total_quantity",
        ],
        [
          OrderItem.sequelize!.fn("SUM", OrderItem.sequelize!.col("price")),
          "total_revenue",
        ],
        [
          OrderItem.sequelize!.fn(
            "COUNT",
            OrderItem.sequelize!.col("order_id")
          ),
          "order_count",
        ],
      ],
      group: ["dish_id"],
      raw: true,
    });

    return dishStats
      .map((stat) => ({
        dish_id: stat.dish_id,
        dish_name: (stat as any)["dish.name"] || "Unknown",
        total_quantity: Number(stat.total_quantity) || 0,
        total_revenue: Number(stat.total_revenue) || 0,
        order_count: Number(stat.order_count) || 0,
      }))
      .sort((a, b) => b.total_revenue - a.total_revenue);
  }
}

export default new StatisticsService();
