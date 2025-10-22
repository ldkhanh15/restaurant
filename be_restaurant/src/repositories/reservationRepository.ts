import { Op } from "sequelize";
import Reservation from "../models/Reservation";
import User from "../models/User";
import Table from "../models/Table";
import TableGroup from "../models/TableGroup";
import Event from "../models/Event";
import Order from "../models/Order";
import OrderItem from "../models/OrderItem";
import Dish from "../models/Dish";
import { AppError } from "../middlewares/errorHandler";

export interface ReservationFilters {
  date?: string;
  status?: string;
  table_id?: string;
  table_group_id?: string;
  user_id?: string;
  event_id?: string;
  page?: number;
  limit?: number;
}

export interface ReservationWithDetails {
  id: string;
  user_id?: string;
  table_id?: string;
  table_group_id?: string;
  reservation_time: Date;
  duration_minutes: number;
  num_people: number;
  preferences?: any;
  event_id?: string;
  event_fee?: number;
  status: string;
  timeout_minutes: number;
  confirmation_sent: boolean;
  pre_order_items?: any;
  deposit_amount?: number;
  created_at?: Date;
  updated_at?: Date;
  user?: User;
  table?: Table;
  table_group?: TableGroup;
  event?: Event;
  order?: Order;
  order_items?: Array<OrderItem & { dish?: Dish }>;
}

class ReservationRepository {
  async findAll(filters: ReservationFilters = {}) {
    const { page = 1, limit = 10, ...whereFilters } = filters;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (whereFilters.date) {
      const startOfDay = new Date(whereFilters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(whereFilters.date);
      endOfDay.setHours(23, 59, 59, 999);

      where.reservation_time = {
        [Op.between]: [startOfDay, endOfDay],
      };
    }

    if (whereFilters.status) {
      where.status = whereFilters.status;
    }

    if (whereFilters.table_id) {
      where.table_id = whereFilters.table_id;
    }

    if (whereFilters.table_group_id) {
      where.table_group_id = whereFilters.table_group_id;
    }

    if (whereFilters.user_id) {
      where.user_id = whereFilters.user_id;
    }

    if (whereFilters.event_id) {
      where.event_id = whereFilters.event_id;
    }

    const { rows, count } = await Reservation.findAndCountAll({
      where,
      limit,
      offset,
      order: [["reservation_time", "ASC"]],
      include: [
        { model: User, as: "user" },
        { model: Table, as: "table" },
        { model: Event, as: "event" },
      ],
    });

    return { rows, count, page, limit };
  }

  async findById(id: string): Promise<ReservationWithDetails | null> {
    const reservation = await Reservation.findByPk(id, {
      include: [
        { model: User, as: "user" },
        { model: Table, as: "table" },
        { model: Event, as: "event" },
        {
          model: Order,
          as: "orders",
          include: [
            {
              model: OrderItem,
              as: "items",
              include: [{ model: Dish, as: "dish" }],
            },
          ],
        },
      ],
    });

    return reservation as ReservationWithDetails;
  }

  async create(data: any): Promise<Reservation> {
    return await Reservation.create(data);
  }

  async update(id: string, data: any): Promise<Reservation> {
    const reservation = await Reservation.findByPk(id);
    if (!reservation) {
      throw new AppError("Reservation not found",404);
    }

    await reservation.update(data);
    return reservation;
  }

  async delete(id: string): Promise<void> {
    const reservation = await Reservation.findByPk(id);
    if (!reservation) {
      throw new AppError("Reservation not found",404);
    }

    await reservation.destroy();
  }

  async updateStatus(
    id: string,
    status: "pending" | "confirmed" | "cancelled" | "no_show"
  ): Promise<Reservation> {
    const reservation = await Reservation.findByPk(id);
    if (!reservation) {
      throw new AppError("Reservation not found",404);
    }

    await reservation.update({ status });
    return reservation;
  }

  async checkIn(
    id: string
  ): Promise<{ reservation: Reservation; order: Order }> {
    const reservation = await Reservation.findByPk(id);
    if (!reservation) {
      throw new AppError("Reservation not found",404);
    }

    // Check if order already exists (created after successful deposit)
    let order = await Order.findOne({
      where: { reservation_id: reservation.id },
    });

    if (!order) {
      throw new AppError(
        "Order not found for this reservation. Please complete deposit payment first.",
        404
      );
    }

    // Update order status to dining
    await order.update({ status: "dining" });

    // Update table/table group status
    if (reservation.table_id) {
      const table = await Table.findByPk(reservation.table_id);
      if (table) {
        await table.update({ status: "occupied" });
      }
    }

    if (reservation.table_group_id) {
      const tableGroup = await TableGroup.findByPk(reservation.table_group_id);
      if (tableGroup) {
        await tableGroup.update({ status: "occupied" });
      }
    }

    return { reservation, order };
  }

  async canModify(id: string): Promise<boolean> {
    const reservation = await Reservation.findByPk(id);
    if (!reservation) {
      return false;
    }

    const now = new Date();
    const reservationTime = new Date(reservation.reservation_time);

    // Get cancel_minutes from table or table_group
    let cancelMinutes = 0;
    if (reservation.table_id) {
      const table = await Table.findByPk(reservation.table_id);
      if (table) {
        cancelMinutes = table.cancel_minutes;
      }
    }

    const cutoffTime = new Date(
      reservationTime.getTime() - cancelMinutes * 60000
    );
    return now <= cutoffTime;
  }
}

export default new ReservationRepository();
