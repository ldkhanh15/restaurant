import { Op } from "sequelize";
import Payment from "../models/Payment";
import Order from "../models/Order";
import Reservation from "../models/Reservation";
import User from "../models/User";
import Table from "../models/Table";
import { AppError } from "../middlewares/errorHandler";

export interface PaymentFilters {
  order_id?: string;
  reservation_id?: string;
  method?: "cash" | "vnpay";
  status?: "pending" | "completed" | "failed";
  user_id?: string;
  start_date?: Date;
  end_date?: Date;
  page?: number;
  limit?: number;
}

export interface PaymentWithDetails {
  id: string;
  order_id?: string;
  reservation_id?: string;
  amount: number;
  method: "cash" | "vnpay";
  status: "pending" | "completed" | "failed";
  transaction_id?: string;
  created_at?: Date;
  updated_at?: Date;
  order?: Order;
  reservation?: Reservation;
  user?: User;
}

class PaymentRepository {
  async findAll(filters: PaymentFilters = {}) {
    const { page = 1, limit = 10, ...whereFilters } = filters;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (whereFilters.order_id) {
      where.order_id = whereFilters.order_id;
    }

    if (whereFilters.reservation_id) {
      where.reservation_id = whereFilters.reservation_id;
    }

    if (whereFilters.method) {
      where.method = whereFilters.method;
    }

    if (whereFilters.status) {
      where.status = whereFilters.status;
    }

    if (whereFilters.start_date || whereFilters.end_date) {
      where.created_at = {};
      if (whereFilters.start_date) {
        where.created_at[Op.gte] = whereFilters.start_date;
      }
      if (whereFilters.end_date) {
        where.created_at[Op.lte] = whereFilters.end_date;
      }
    }

    const { rows, count } = await Payment.findAndCountAll({
      where,
      limit,
      offset,
      order: [["created_at", "DESC"]],
      include: [
        {
          model: Order,
          as: "order",
          include: [
            { model: User, as: "user" },
            { model: Table, as: "table" },
          ],
        },
        {
          model: Reservation,
          as: "reservation",
          include: [
            { model: User, as: "user" },
            { model: Table, as: "table" },
          ],
        },
      ],
    });

    return { rows, count, page, limit };
  }

  async findById(id: string): Promise<PaymentWithDetails | null> {
    const payment = await Payment.findByPk(id, {
      include: [
        {
          model: Order,
          as: "order",
          include: [
            { model: User, as: "user" },
            { model: Table, as: "table" },
          ],
        },
        {
          model: Reservation,
          as: "reservation",
          include: [
            { model: User, as: "user" },
            { model: Table, as: "table" },
          ],
        },
      ],
    });

    return payment as PaymentWithDetails;
  }

  async create(data: any): Promise<Payment> {
    return await Payment.create(data);
  }

  async update(id: string, data: any): Promise<Payment> {
    const payment = await Payment.findByPk(id);
    if (!payment) {
      throw new AppError("Payment not found",404);
    }

    await payment.update(data);
    return payment;
  }

  async delete(id: string): Promise<void> {
    const payment = await Payment.findByPk(id);
    if (!payment) {
      throw new AppError("Payment not found",404);
    }

    await payment.destroy();
  }

  async findByTransactionId(transactionId: string): Promise<Payment | null> {
    return await Payment.findOne({
      where: { transaction_id: transactionId },
    });
  }

  async updateStatusByTxnRef(
    transactionId: string,
    status: "pending" | "completed" | "failed"
  ): Promise<Payment | null> {
    const payment = await Payment.findOne({
      where: { transaction_id: transactionId },
    });

    if (payment) {
      await payment.update({ status });
      return payment;
    }

    return null;
  }

  async getPaymentStats(startDate?: Date, endDate?: Date) {
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

    return stats;
  }

  async getRevenueByTable(startDate?: Date, endDate?: Date) {
    const where: any = { status: "completed" };
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = startDate;
      if (endDate) where.created_at[Op.lte] = endDate;
    }

    const revenue = await Payment.findAll({
      where,
      include: [
        {
          model: Order,
          as: "order",
          include: [{ model: Table, as: "table" }],
        },
        {
          model: Reservation,
          as: "reservation",
          include: [{ model: Table, as: "table" }],
        },
      ],
      attributes: [
        [
          Payment.sequelize!.fn("SUM", Payment.sequelize!.col("amount")),
          "total_revenue",
        ],
      ],
      group: ["order.table.id", "reservation.table.id"],
      raw: true,
    });

    return revenue;
  }

  async getCustomerSpendingStats(startDate?: Date, endDate?: Date) {
    const where: any = { status: "completed" };
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = startDate;
      if (endDate) where.created_at[Op.lte] = endDate;
    }

    const spending = await Payment.findAll({
      where,
      include: [
        {
          model: Order,
          as: "order",
          include: [{ model: User, as: "user" }],
        },
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
      group: ["order.user.id", "reservation.user.id"],
      raw: true,
    });

    return spending;
  }

  async getDailyRevenue(startDate: Date, endDate: Date) {
    const dailyRevenue = await Payment.findAll({
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

    return dailyRevenue;
  }

  async getMonthlyRevenue(startDate: Date, endDate: Date) {
    const monthlyRevenue = await Payment.findAll({
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

    return monthlyRevenue;
  }

  // VNPay specific functions
  async createPendingPayment(data: {
    order_id?: string;
    reservation_id?: string;
    amount: number;
    method: "cash" | "vnpay";
    transaction_id?: string;
  }): Promise<Payment> {
    return await Payment.create({
      ...data,
      status: "pending",
    });
  }

  async updatePaymentStatusByTxnRef(
    transactionId: string,
    status: "pending" | "completed" | "failed"
  ): Promise<Payment | null> {
    const payment = await Payment.findOne({
      where: { transaction_id: transactionId },
    });

    if (payment) {
      await payment.update({ status });
      return payment;
    }

    return null;
  }
}

export default new PaymentRepository();
