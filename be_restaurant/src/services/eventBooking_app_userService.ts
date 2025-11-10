import { BaseService } from "./baseService";
import EventBooking from "../models/EventBooking";
import Event from "../models/Event";
import User from "../models/User";
import { AppError } from "../middlewares/errorHandler";
import { FindOptions } from "sequelize";
import sequelize from "../config/database";

const includeDetails = [
  { model: Event, as: "event" },
  { model: User, as: "user", attributes: { exclude: ["password_hash"] } },
];

class EventBookingAppUserService extends BaseService<EventBooking> {
  constructor() {
    super(EventBooking);
  }

  /**
   * Lấy danh sách các lượt đặt vé của một người dùng.
   */
  async findBookingsByUser(userId: string, options?: FindOptions) {
    return await this.findAll({
      ...options,
      where: { user_id: userId },
      include: includeDetails,
      order: [["created_at", "DESC"]],
    });
  }

  /**
   * Lấy chi tiết một lượt đặt vé.
   */
  async findBookingByIdWithDetails(id: string, userId: string) {
    const booking = await this.findOne(
      { id, user_id: userId },
      { include: includeDetails }
    );
    if (!booking) {
      throw new AppError(
        "Booking not found or you do not have permission to view it",
        404
      );
    }
    return booking;
  }

  /**
   * Tạo một lượt đặt vé mới cho sự kiện.
   */
  async createBooking(data: {
    userId: string;
    eventId: string;
    numberOfTickets: number;
  }) {
    const { userId, eventId, numberOfTickets } = data;

    return sequelize.transaction(async (transaction) => {
      // Kiểm tra sự kiện có tồn tại và đủ vé không
      const event = await Event.findByPk(eventId, { transaction, lock: true });
      if (!event) {
        throw new AppError("Event not found", 404);
      }
      if ((event as any).capacity < numberOfTickets) {
        throw new AppError("Not enough tickets available for this event", 400);
      }

      // Tạo lượt đặt vé
      const newBooking = await EventBooking.create(
        {
          event_id: eventId,
          reservation_id: undefined,
          special_requests: `User ${userId} - ${numberOfTickets} tickets`,
          status: "confirmed", // Mặc định là đã xác nhận
        } as any,
        { transaction } as any
      );

      // Cập nhật lại số lượng vé của sự kiện
      await event.decrement({ capacity: numberOfTickets } as any, {
        transaction,
      });

      return newBooking;
    });
  }

  /**
   * Hủy một lượt đặt vé.
   */
  async cancelBooking(bookingId: string, userId: string) {
    return sequelize.transaction(async (transaction) => {
      const booking = await this.findOne(
        { id: bookingId, user_id: userId },
        { transaction, lock: true }
      );
      if (!booking) {
        throw new AppError(
          "Booking not found or you do not have permission to cancel it",
          404
        );
      }

      if ((booking as any).status === "cancelled") {
        throw new AppError("This booking has already been cancelled", 400);
      }

      // Cập nhật trạng thái booking
      await booking.update({ status: "cancelled" }, { transaction });

      // Hoàn lại số lượng vé cho sự kiện
      await Event.increment(
        { capacity: (booking as any).number_of_tickets } as any,
        {
          where: { id: (booking as any).event_id },
          transaction,
        }
      );

      return booking;
    });
  }

  async findAllWithDetails(options?: any) {
    return await this.findAll({
      ...options,
      include: includeDetails,
    });
  }
}

export default new EventBookingAppUserService();
