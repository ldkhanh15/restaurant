import { Op } from "sequelize";
import reservationRepository from "../repositories/reservationRepository";
import Reservation from "../models/Reservation";
import Order from "../models/Order";
import OrderItem from "../models/OrderItem";
import Dish from "../models/Dish";
import Event from "../models/Event";
import Table from "../models/Table";
import TableGroup from "../models/TableGroup";
import User from "../models/User";
import Payment from "../models/Payment";
import notificationService from "./notificationService";
import paymentService from "./paymentService";
import { getIO } from "../sockets";
import { reservationEvents } from "../sockets/reservationSocket";
import {
  validateReservationOverlap,
  validateTableGroupReservationOverlap,
} from "../utils/validation";
import { AppError } from "../middlewares/errorHandler";

export interface CreateReservationData {
  user_id?: string;
  table_id?: string;
  table_group_id?: string;
  reservation_time: Date;
  duration_minutes?: number;
  num_people: number;
  preferences?: any;
  event_id?: string;
  event_fee?: number;
  deposit_amount?: number;
  pre_order_items?: Array<{
    dish_id: string;
    quantity: number;
  }>;
}

export interface UpdateReservationData {
  table_id?: string;
  table_group_id?: string;
  reservation_time?: Date;
  duration_minutes?: number;
  num_people?: number;
  preferences?: any;
  event_id?: string;
  event_fee?: number;
  pre_order_items?: Array<{
    dish_id: string;
    quantity: number;
  }>;
}

class ReservationService {
  async getAllReservations(filters: any) {
    return await reservationRepository.findAll(filters);
  }

  async getReservationById(id: string) {
    const reservation = await reservationRepository.findById(id);
    if (!reservation) {
      throw new AppError("Reservation not found", 404);
    }

    // Get detailed information with all related data
    const detailedReservation = await Reservation.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "email", "phone"],
        },
        {
          model: Table,
          as: "table",
          attributes: ["id", "table_number", "capacity", "status"],
        },
        {
          model: Event,
          as: "event",
          attributes: ["id", "name", "description"],
        },
        {
          model: Order,
          as: "orders",
          include: [
            {
              model: OrderItem,
              as: "items",
              include: [
                {
                  model: Dish,
                  as: "dish",
                  attributes: ["id", "name", "price", "media_urls"],
                },
              ],
            },
          ],
        },
        {
          model: Payment,
          as: "payments",
          where: { reservation_id: id },
          required: false,
        },
      ],
    });

    // Populate dish information for pre_order_items
    if (detailedReservation && detailedReservation.pre_order_items) {
      const preOrderItems = detailedReservation.pre_order_items;
      if (Array.isArray(preOrderItems) && preOrderItems.length > 0) {
        const dishIds = preOrderItems
          .map((item: any) => item.dish_id)
          .filter(Boolean);
        if (dishIds.length > 0) {
          const dishes = await Dish.findAll({
            where: { id: dishIds },
            attributes: [
              "id",
              "name",
              "price",
              "description",
              "media_urls",
              "category_id",
              "is_best_seller",
              "seasonal",
              "active",
            ],
          });

          const dishesMap = new Map(
            dishes.map((dish: any) => [dish.id, dish.toJSON()])
          );

          // Replace pre_order_items with populated dish information
          detailedReservation.pre_order_items = preOrderItems.map(
            (item: any) => ({
              ...item,
              dish: dishesMap.get(item.dish_id) || null,
            })
          );
        }
      }
    }

    return detailedReservation;
  }

  async createReservation(data: CreateReservationData) {
    // Check table/table group availability
    if (data.table_id) {
      const table = await Table.findByPk(data.table_id);
      if (!table) {
        throw new AppError("Table not found", 404);
      }
      if (data.num_people > table.capacity) {
        throw new AppError("Number of people exceeds table capacity", 400);
      }

      // Validate reservation time overlap - this will check for existing reservations
      const durationMinutes = data.duration_minutes || 90;
      await validateReservationOverlap(
        data.table_id,
        data.reservation_time,
        durationMinutes
      );
    }

    if (data.table_group_id) {
      const tableGroup = await TableGroup.findByPk(data.table_group_id);
      if (!tableGroup) {
        throw new AppError("Table group not found", 404);
      }

      // Validate table group reservation time overlap - this will check for existing reservations
      const durationMinutes = data.duration_minutes || 90;
      await validateTableGroupReservationOverlap(
        data.table_group_id,
        data.reservation_time,
        durationMinutes
      );
    }
    let eventFee = 0;
    // Validate event if provided
    if (data.event_id) {
      const event = await Event.findByPk(data.event_id);
      if (!event) {
        throw new AppError("Event not found", 404);
      }
      eventFee = Number(event.price);
    }
    let price_dish = 0;
    // Validate pre-order items
    if (data.pre_order_items && data.pre_order_items.length > 0) {
      for (const item of data.pre_order_items) {
        const dish = await Dish.findByPk(item.dish_id);
        if (!dish || !dish.active) {
          throw new AppError(`Dish ${item.dish_id} not found or inactive`, 404);
        }
        if (item.quantity < 1) {
          throw new AppError("Item quantity must be at least 1", 400);
        }
        price_dish = Number(price_dish) + Number(dish.price * item.quantity);
      }
    }
    // Check if user is VIP
    const user = data.user_id ? await User.findByPk(data.user_id) : null;
    const isVip = user?.ranking === "vip" || user?.role === "admin";

    let requiredDeposit = eventFee + price_dish * 0.3;
    if (data.table_id) {
      const table = await Table.findByPk(data.table_id);
      if (table) {
        requiredDeposit = Number(requiredDeposit) + Number(table.deposit);
      }
    }
    // Create reservation
    const reservation = await reservationRepository.create({
      ...data,
      status: "pending",
      duration_minutes: data.duration_minutes || 90,
      timeout_minutes: parseInt(
        process.env.RESERVATION_TIMEOUT_MINUTES || "15"
      ),
      confirmation_sent: false,
      event_fee: eventFee,
      deposit_amount: Math.floor(requiredDeposit),
    });

    // If VIP user, create order immediately
    if (isVip && data.pre_order_items && data.pre_order_items.length > 0) {
      console.log(
        `[ReservationService] Creating order for VIP reservation user_id=${
          data.user_id
        } table_id=${data.table_id} reservation_temp=${
          /* temporary reservation id unknown yet */ ""
        } pre_order_items=`,
        data.pre_order_items
      );
      const order = await Order.create({
        user_id: data.user_id,
        table_id: data.table_id,
        table_group_id: data.table_group_id,
        reservation_id: reservation.id,
        status: "pending",
        total_amount: 0,
        final_amount: 0,
        event_fee: eventFee,
      });

      let totalAmount = eventFee;
      for (const item of data.pre_order_items) {
        const dish = await Dish.findByPk(item.dish_id);
        if (dish) {
          await OrderItem.create({
            order_id: order.id,
            dish_id: item.dish_id,
            quantity: item.quantity,
            price: dish.price,
            status: "pending",
          });
          totalAmount += dish.price * item.quantity;
        }
      }

      await order.update({
        total_amount: totalAmount,
        final_amount: totalAmount,
      });

      // Note: Table status will be updated to "reserved" when reservation is confirmed
      // This prevents conflicts during the reservation creation process

      // Send notification and WebSocket event
      await notificationService.notifyReservationCreated(reservation);
      try {
        reservationEvents.reservationCreated(getIO(), reservation);
      } catch (error) {
        console.error("Failed to emit reservation created event:", error);
      }

      return { reservation, requires_payment: false };
    }

    // For non-VIP users, check if deposit is required
    // If deposit is required, return payment URL
    if (requiredDeposit > 0) {
      const clientIp = "127.0.0.1"; // You should get this from request
      const paymentUrl = paymentService.generateVnpayReservationUrl(
        reservation.id,
        requiredDeposit,
        undefined,
        clientIp,
        "user" // client: "user" for user-web
      );
      await paymentService.createPendingPayment({
        reservation_id: reservation.id,
        amount: requiredDeposit,
        method: "vnpay",
        transaction_id: paymentUrl.txnRef,
      });
      try {
        reservationEvents.depositPaymentRequested(
          getIO(),
          reservation,
          paymentUrl.url
        );
      } catch (error) {
        console.error("Failed to emit deposit payment requested event:", error);
      }

      return {
        reservation,
        requires_payment: true,
        payment_url: paymentUrl,
        deposit_amount: Math.floor(requiredDeposit),
      };
    }

    // No deposit required, send notification and WebSocket event
    await notificationService.notifyReservationCreated(reservation);
    try {
      reservationEvents.reservationCreated(getIO(), reservation);
    } catch (error) {
      console.error("Failed to emit reservation created event:", error);
    }

    return { reservation, requires_payment: false };
  }

  async updateReservation(id: string, data: UpdateReservationData) {
    const reservation = await reservationRepository.findById(id);
    if (!reservation) {
      throw new AppError("Reservation not found", 404);
    }

    // Check if reservation can be modified
    const canModify = await reservationRepository.canModify(id);
    if (!canModify) {
      throw new AppError("Reservation cannot be modified at this time", 400);
    }

    // Validate updates
    if (data.reservation_time) {
      const now = new Date();
      const reservationTime = new Date(data.reservation_time);
      if (reservationTime <= now) {
        throw new AppError("Reservation time must be in the future", 400);
      }
    }

    if (data.num_people && data.num_people < 1) {
      throw new AppError("Number of people must be at least 1", 400);
    }

    // Validate table/table group if changing
    if (data.table_id) {
      const table = await Table.findByPk(data.table_id);
      if (!table) {
        throw new AppError("Table not found", 404);
      }
      if (table.status !== "available" && table.id !== reservation.table_id) {
        throw new AppError("Table is not available", 400);
      }
      if (data.num_people && data.num_people > table.capacity) {
        throw new AppError("Number of people exceeds table capacity", 400);
      }

      // Validate reservation time overlap for new table
      if (data.reservation_time && table.id !== reservation.table_id) {
        const durationMinutes =
          data.duration_minutes || reservation.duration_minutes || 90;
        await validateReservationOverlap(
          data.table_id,
          data.reservation_time,
          durationMinutes,
          reservation.id
        );
      }
    }

    if (data.table_group_id) {
      const tableGroup = await TableGroup.findByPk(data.table_group_id);
      if (!tableGroup) {
        throw new AppError("Table group not found", 404);
      }
      if (
        tableGroup.status !== "available" &&
        tableGroup.id !== reservation.table_group_id
      ) {
        throw new AppError("Table group is not available", 400);
      }

      // Validate table group reservation time overlap
      if (
        data.reservation_time &&
        tableGroup.id !== reservation.table_group_id
      ) {
        const durationMinutes =
          data.duration_minutes || reservation.duration_minutes || 90;
        await validateTableGroupReservationOverlap(
          data.table_group_id,
          data.reservation_time,
          durationMinutes,
          reservation.id
        );
      }
    }

    // Update reservation
    const updatedReservation = await reservationRepository.update(id, data);

    // Update pre-order items if provided
    if (data.pre_order_items) {
      // Find existing order
      const existingOrder = await Order.findOne({
        where: { reservation_id: id },
      });

      if (data.pre_order_items.length > 0) {
        // Validate dishes
        for (const item of data.pre_order_items) {
          const dish = await Dish.findByPk(item.dish_id);
          if (!dish || !dish.active) {
            throw new AppError(
              `Dish ${item.dish_id} not found or inactive`,
              404
            );
          }
          if (item.quantity < 1) {
            throw new AppError("Item quantity must be at least 1", 400);
          }
        }

        let order;
        if (existingOrder) {
          // Clear existing items and add new ones
          await OrderItem.destroy({ where: { order_id: existingOrder.id } });
          order = existingOrder;
        } else {
          // Create new order
          console.log(
            `[ReservationService] updateReservation creating new order for reservation=${reservation.id} user_id=${reservation.user_id} pre_order_items=`,
            data.pre_order_items
          );
          order = await Order.create({
            user_id: reservation.user_id,
            table_id: reservation.table_id,
            table_group_id: reservation.table_group_id,
            reservation_id: reservation.id,
            status: "pending",
            total_amount: 0,
            final_amount: 0,
          });
        }

        let totalAmount = 0;
        for (const item of data.pre_order_items) {
          const dish = await Dish.findByPk(item.dish_id);
          if (dish) {
            await OrderItem.create({
              order_id: order.id,
              dish_id: item.dish_id,
              quantity: item.quantity,
              price: dish.price,
              status: "pending",
            });
            totalAmount += dish.price * item.quantity;
          }
        }

        await order.update({
          total_amount: totalAmount,
          final_amount: totalAmount,
        });
      } else if (existingOrder) {
        // Remove all items
        await OrderItem.destroy({ where: { order_id: existingOrder.id } });
        await existingOrder.update({
          total_amount: 0,
          final_amount: 0,
        });
      }
    }

    // Send notification and WebSocket event
    await notificationService.notifyReservationUpdated(updatedReservation);
    try {
      reservationEvents.reservationUpdated(getIO(), updatedReservation);
    } catch (error) {
      console.error("Failed to emit reservation updated event:", error);
    }

    return updatedReservation;
  }

  async updateReservationStatus(id: string, status: string) {
    if (
      !["pending", "confirmed", "completed", "cancelled", "no_show"].includes(
        status
      )
    ) {
      throw new AppError("Invalid status", 400);
    }

    const reservation = await reservationRepository.updateStatus(
      id,
      status as "pending" | "cancelled" | "confirmed" | "no_show" | "completed"
    );

    // Update table/table group status based on reservation status
    if (status === "confirmed") {
      if (reservation.table_id) {
        await Table.update(
          { status: "reserved" },
          { where: { id: reservation.table_id } }
        );
      }
      if (reservation.table_group_id) {
        await TableGroup.update(
          { status: "reserved" },
          { where: { id: reservation.table_group_id } }
        );
      }
    } else if (status === "cancelled" || status === "no_show") {
      if (reservation.table_id) {
        await Table.update(
          { status: "available" },
          { where: { id: reservation.table_id } }
        );
      }
      if (reservation.table_group_id) {
        await TableGroup.update(
          { status: "available" },
          { where: { id: reservation.table_group_id } }
        );
      }
    } else if (status === "completed") {
      if (reservation.table_id) {
        await Table.update(
          { status: "occupied" },
          { where: { id: reservation.table_id } }
        );
      }
    }
    if (status === "no_show") {
      if (reservation.table_id) {
        await Table.update(
          { status: "available" },
          { where: { id: reservation.table_id } }
        );
      }
    }

    try {
      reservationEvents.reservationStatusChanged(getIO(), reservation);
    } catch (error) {
      console.error("Failed to emit reservation status changed event:", error);
    }

    return reservation;
  }

  async checkInReservation(id: string) {
    const reservation = await reservationRepository.findById(id);
    if (!reservation) {
      throw new AppError("Reservation not found", 404);
    }

    if (reservation.status !== "confirmed") {
      throw new AppError("Reservation is not confirmed", 400);
    }

    // Validate check-in time: allow check-in from 5 minutes before to 10 minutes after reservation time
    const reservationTime = new Date(reservation.reservation_time);
    const now = new Date();
    const minutesBefore = 5;
    const minutesAfter = 10;

    const earliestCheckIn = new Date(reservationTime);
    earliestCheckIn.setMinutes(earliestCheckIn.getMinutes() - minutesBefore);

    const latestCheckIn = new Date(reservationTime);
    latestCheckIn.setMinutes(latestCheckIn.getMinutes() + minutesAfter);

    if (now < earliestCheckIn) {
      const minutesUntil = Math.ceil(
        (earliestCheckIn.getTime() - now.getTime()) / (1000 * 60)
      );
      throw new AppError(
        `Chưa đến giờ check-in. Vui lòng quay lại sau ${minutesUntil} phút nữa (từ ${earliestCheckIn.toLocaleTimeString(
          "vi-VN",
          { hour: "2-digit", minute: "2-digit" }
        )}).`,
        400
      );
    }

    if (now > latestCheckIn) {
      throw new AppError(
        `Đã quá thời gian check-in. Thời gian check-in hợp lệ là từ ${earliestCheckIn.toLocaleTimeString(
          "vi-VN",
          { hour: "2-digit", minute: "2-digit" }
        )} đến ${latestCheckIn.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })}.`,
        400
      );
    }

    const result = await reservationRepository.checkIn(id);

    // Send notification and WebSocket event
    await notificationService.notifyOrderCreated(result.order);
    try {
      reservationEvents.reservationCheckedIn(
        getIO(),
        result.reservation,
        result.order
      );
    } catch (error) {
      console.error("Failed to emit reservation checked in event:", error);
    }

    return result;
  }

  async cancelReservation(id: string, reason: string) {
    const reservation = await reservationRepository.findById(id);
    if (!reservation) {
      throw new AppError("Reservation not found", 404);
    }

    // Check if reservation can be cancelled
    if (reservation.status === "cancelled") {
      throw new AppError("Reservation is already cancelled", 400);
    }

    if (reservation.status === "completed") {
      throw new AppError("Cannot cancel a completed reservation", 400);
    }

    // Update preferences to include cancellation reason
    const preferences = reservation.preferences || {};
    const updatedPreferences = {
      ...preferences,
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString(),
      cancelled_by: reservation.user_id ? "user" : "admin", // Could be enhanced to use req.user.id
    };

    // Update reservation status to cancelled and save reason
    const updatedReservation = await reservationRepository.update(id, {
      status: "cancelled",
      preferences: updatedPreferences,
    });

    // Update table/table group status to available
    if (reservation.table_id) {
      await Table.update(
        { status: "available" },
        { where: { id: reservation.table_id } }
      );
    }
    if (reservation.table_group_id) {
      await TableGroup.update(
        { status: "available" },
        { where: { id: reservation.table_group_id } }
      );
    }

    // Send notification and WebSocket event
    await notificationService.notifyReservationUpdated(updatedReservation);
    try {
      reservationEvents.reservationStatusChanged(getIO(), updatedReservation);
    } catch (error) {
      console.error("Failed to emit reservation cancelled event:", error);
    }

    return updatedReservation;
  }

  async deleteReservation(id: string) {
    const reservation = await reservationRepository.findById(id);
    if (!reservation) {
      throw new AppError("Reservation not found", 404);
    }

    // Check if reservation can be modified
    const canModify = await reservationRepository.canModify(id);
    if (!canModify) {
      throw new AppError("Reservation cannot be cancelled at this time", 400);
    }

    // Update table/table group status
    if (reservation.table_id) {
      await Table.update(
        { status: "available" },
        { where: { id: reservation.table_id } }
      );
    }

    await reservationRepository.delete(id);
  }

  async createDepositPayment(
    reservationId: string,
    amount: number,
    bankCode?: string,
    client?: "admin" | "user"
  ) {
    const reservation = await reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new AppError("Reservation not found", 404);
    }

    // Check if user is VIP (you need to implement VIP check logic)
    const user = await User.findByPk(reservation.user_id);
    if (user && user.ranking === "vip") {
      throw new AppError("VIP users do not need to pay deposit", 400);
    }

    // Get deposit amount from table or table group
    let requiredDeposit = 0;
    if (reservation.table_id) {
      const table = await Table.findByPk(reservation.table_id);
      if (table) {
        requiredDeposit = table.deposit;
      }
    }

    if (amount < requiredDeposit) {
      throw new AppError(`Minimum deposit amount is ${requiredDeposit}`, 400);
    }

    // Create VNPay payment URL
    const clientIp = "127.0.0.1"; // You should get this from request
    const url = paymentService.generateVnpayReservationUrl(
      reservationId,
      amount,
      bankCode,
      clientIp,
      client || "user"
    );
    console.log("url", url);
    return { redirect_url: url };
  }

  async handleDepositPaymentSuccess(reservationId: string) {
    const reservation = await reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new AppError("Reservation not found", 404);
    }

    // Create order with pre-order items if they exist
    const preOrderItems = reservation?.pre_order_items;
    if (preOrderItems && preOrderItems.length > 0) {
      console.log(
        `[ReservationService] handleDepositPaymentSuccess creating order for reservation=${reservation.id} user_id=${reservation.user_id} pre_order_items=`,
        preOrderItems
      );
      const order = await Order.create({
        user_id: reservation.user_id,
        table_id: reservation.table_id,
        table_group_id: reservation.table_group_id,
        reservation_id: reservation.id,
        status: "pending",
        total_amount: 0,
        final_amount: 0,
        deposit_amount: reservation.deposit_amount || 0,
      });

      let totalAmount = Number(reservation.event_fee) || 0;
      for (const item of preOrderItems) {
        const dish = await Dish.findByPk(item.dish_id);
        if (dish) {
          await OrderItem.create({
            order_id: order.id,
            dish_id: item.dish_id,
            quantity: item.quantity,
            price: dish.price,
            status: "pending",
          });
          totalAmount += Number(dish.price * item.quantity);
        }
      }
      const table = await Table.findByPk(reservation.table_id);
      if (table) {
        totalAmount += Number(table.deposit || 0);
      }
      console.log("totalAmount", totalAmount);

      await order.update({
        total_amount: totalAmount,
        final_amount: totalAmount,
      });

      // Send notification
      await notificationService.notifyOrderCreated(order);
    }

    // Update reservation status
    await reservationRepository.update(reservation.id, { status: "confirmed" });

    // Update table/table group status to reserved when deposit payment is completed
    if (reservation.table_id) {
      await Table.update(
        { status: "reserved" },
        { where: { id: reservation.table_id } }
      );
    }
    if (reservation.table_group_id) {
      await TableGroup.update(
        { status: "reserved" },
        { where: { id: reservation.table_group_id } }
      );
    }

    // Send notification and WebSocket event
    await notificationService.notifyReservationUpdated(reservation);
    try {
      reservationEvents.depositPaymentCompleted(getIO(), reservation);
    } catch (error) {
      console.error("Failed to emit deposit payment completed event:", error);
    }

    return reservation;
  }

  async handleDepositPaymentFailure(reservationId: string) {
    const reservation = await reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new AppError("Reservation not found", 404);
    }

    // Keep reservation as pending, no order created
    try {
      reservationEvents.depositPaymentFailed(getIO(), reservation);
    } catch (error) {
      console.error("Failed to emit deposit payment failed event:", error);
    }

    return reservation;
  }

  // Helper methods for managing pre-order dishes
  async addDishToReservation(
    reservationId: string,
    dishId: string,
    quantity: number
  ) {
    const reservation = await this.getReservationById(reservationId);
    if (!reservation) {
      throw new AppError("Reservation not found", 404);
    }

    // Check if reservation can be modified
    const canModify = await reservationRepository.canModify(reservationId);
    if (!canModify) {
      throw new AppError("Reservation cannot be modified at this time", 400);
    }

    // Validate dish
    const dish = await Dish.findByPk(dishId);
    if (!dish || !dish.active) {
      throw new AppError("Dish not found or inactive", 404);
    }

    // Get current pre_order_items
    const preOrderItems = (reservation.pre_order_items || []) as Array<{
      dish_id: string;
      quantity: number;
    }>;

    // Check if dish already exists
    const existingIndex = preOrderItems.findIndex(
      (item) => item.dish_id === dishId
    );

    if (existingIndex >= 0) {
      // Update quantity
      preOrderItems[existingIndex].quantity += quantity;
    } else {
      // Add new dish
      preOrderItems.push({ dish_id: dishId, quantity });
    }

    // Update reservation
    const updatedReservation = await reservationRepository.update(
      reservationId,
      { pre_order_items: preOrderItems }
    );

    // Emit dish added event
    try {
      const dishWithDetails = {
        dish_id: dishId,
        quantity:
          existingIndex >= 0 ? preOrderItems[existingIndex].quantity : quantity,
        dish: {
          id: dish.id,
          name: dish.name,
          price: dish.price,
          media_urls: dish.media_urls,
          description: dish.description,
        },
      };
      reservationEvents.reservationDishAdded(
        getIO(),
        reservationId,
        dishWithDetails,
        updatedReservation
      );
    } catch (error) {
      console.error("Failed to emit reservation dish added event:", error);
    }

    // Also emit reservation updated
    await notificationService.notifyReservationUpdated(updatedReservation);
    try {
      reservationEvents.reservationUpdated(getIO(), updatedReservation);
    } catch (error) {
      console.error("Failed to emit reservation updated event:", error);
    }

    return updatedReservation;
  }

  async updateDishQuantity(
    reservationId: string,
    dishId: string,
    quantity: number
  ) {
    const reservation = await this.getReservationById(reservationId);
    if (!reservation) {
      throw new AppError("Reservation not found", 404);
    }

    // Check if reservation can be modified
    const canModify = await reservationRepository.canModify(reservationId);
    if (!canModify) {
      throw new AppError("Reservation cannot be modified at this time", 400);
    }

    if (quantity < 1) {
      throw new AppError("Quantity must be at least 1", 400);
    }

    // Get current pre_order_items
    const preOrderItems = (reservation.pre_order_items || []) as Array<{
      dish_id: string;
      quantity: number;
    }>;

    const existingIndex = preOrderItems.findIndex(
      (item) => item.dish_id === dishId
    );

    if (existingIndex < 0) {
      throw new AppError("Dish not found in reservation", 404);
    }

    // Update quantity
    preOrderItems[existingIndex].quantity = quantity;

    // Update reservation
    const updatedReservation = await reservationRepository.update(
      reservationId,
      { pre_order_items: preOrderItems }
    );

    // Emit dish updated event
    try {
      const dish = await Dish.findByPk(dishId);
      const dishWithDetails = {
        dish_id: dishId,
        quantity,
        dish: dish
          ? {
              id: dish.id,
              name: dish.name,
              price: dish.price,
              media_urls: dish.media_urls,
              description: dish.description,
            }
          : null,
      };
      reservationEvents.reservationDishUpdated(
        getIO(),
        reservationId,
        dishWithDetails,
        updatedReservation
      );
    } catch (error) {
      console.error("Failed to emit reservation dish updated event:", error);
    }

    // Also emit reservation updated
    await notificationService.notifyReservationUpdated(updatedReservation);
    try {
      reservationEvents.reservationUpdated(getIO(), updatedReservation);
    } catch (error) {
      console.error("Failed to emit reservation updated event:", error);
    }

    return updatedReservation;
  }

  async removeDishFromReservation(reservationId: string, dishId: string) {
    const reservation = await this.getReservationById(reservationId);
    if (!reservation) {
      throw new AppError("Reservation not found", 404);
    }

    // Check if reservation can be modified
    const canModify = await reservationRepository.canModify(reservationId);
    if (!canModify) {
      throw new AppError("Reservation cannot be modified at this time", 400);
    }

    // Get current pre_order_items
    const preOrderItems = (reservation.pre_order_items || []) as Array<{
      dish_id: string;
      quantity: number;
    }>;

    const existingIndex = preOrderItems.findIndex(
      (item) => item.dish_id === dishId
    );

    if (existingIndex < 0) {
      throw new AppError("Dish not found in reservation", 404);
    }

    // Remove dish
    preOrderItems.splice(existingIndex, 1);

    // Update reservation
    const updatedReservation = await reservationRepository.update(
      reservationId,
      { pre_order_items: preOrderItems }
    );

    // Emit dish removed event
    try {
      reservationEvents.reservationDishRemoved(
        getIO(),
        reservationId,
        dishId,
        updatedReservation
      );
    } catch (error) {
      console.error("Failed to emit reservation dish removed event:", error);
    }

    // Also emit reservation updated
    await notificationService.notifyReservationUpdated(updatedReservation);
    try {
      reservationEvents.reservationUpdated(getIO(), updatedReservation);
    } catch (error) {
      console.error("Failed to emit reservation updated event:", error);
    }

    return updatedReservation;
  }
}

export default new ReservationService();
