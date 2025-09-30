import { EventBooking, Event, User } from "../../models/index";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import {
  CreateEventBookingDTO,
  UpdateEventBookingDTO,
} from "../../types/dtos/event.dto";
import { EventService } from "../events/event.service";
import { NotificationService } from "../notifications/notification.service";

export const EventBookingService = {
  async list() {
    return EventBooking.findAll({
      include: ["event", "user"],
      order: [["created_at", "DESC"]],
    });
  },

  async get(id: string) {
    return EventBooking.findByPk(id, {
      include: ["event", "user"],
    });
  },

  async create(payload: CreateEventBookingDTO) {
    // Check event availability
    const availability = await EventService.checkAvailability(payload.event_id);
    if (!availability) {
      throw new Error("Event not found");
    }

    if (availability.is_full) {
      throw new Error("Event is fully booked");
    }

    if (
      availability.available_spots &&
      payload.number_of_guests > availability.available_spots
    ) {
      throw new Error("Not enough available spots");
    }

    const id = payload.id || uuidv4();
    const booking = await EventBooking.create({
      id,
      ...payload,
      status: "pending",
      payment_status: payload.payment_status || "pending",
      created_at: new Date(),
    });

    // Notify event organizer
    const event = await Event.findByPk(payload.event_id, {
      include: [
        {
          model: User,
          as: "organizer",
        },
      ],
    });

    if (event?.organizer) {
      await NotificationService.create({
        user_id: event.organizer.id,
        title: "New Event Booking",
        message: `New booking received for event: ${event.name}`,
        type: "event_booking",
        data: {
          event_id: event.id,
          booking_id: booking.id,
        },
      });
    }

    return this.get(booking.id);
  },

  async update(id: string, payload: UpdateEventBookingDTO) {
    const booking = await EventBooking.findByPk(id, {
      include: ["event", "user"],
    });
    if (!booking) return null;

    // If updating number of guests, check availability
    if (
      payload.number_of_guests &&
      payload.number_of_guests !== booking.number_of_guests
    ) {
      const availability = await EventService.checkAvailability(
        booking.event_id
      );
      if (!availability) {
        throw new Error("Event not found");
      }

      const additionalGuests =
        payload.number_of_guests - booking.number_of_guests;
      if (
        availability.available_spots &&
        additionalGuests > availability.available_spots
      ) {
        throw new Error("Not enough available spots");
      }
    }

    await booking.update({
      ...payload,
      updated_at: new Date(),
    });

    // If status is updated, notify the user
    if (payload.status && payload.status !== booking.status) {
      await NotificationService.create({
        user_id: booking.user_id,
        title: "Event Booking Update",
        message: `Your booking status has been updated to ${payload.status}`,
        type: "event_booking_status",
        data: {
          event_id: booking.event_id,
          booking_id: booking.id,
          status: payload.status,
        },
      });
    }

    return this.get(id);
  },

  async cancel(id: string, reason?: string) {
    const booking = await EventBooking.findByPk(id);
    if (!booking) return false;

    await booking.update({
      status: "cancelled",
      cancellation_reason: reason,
      updated_at: new Date(),
    });

    // Notify user about cancellation
    await NotificationService.create({
      user_id: booking.user_id,
      title: "Event Booking Cancelled",
      message: `Your event booking has been cancelled${
        reason ? `: ${reason}` : ""
      }`,
      type: "event_booking_cancelled",
      data: {
        event_id: booking.event_id,
        booking_id: booking.id,
      },
    });

    return true;
  },

  async getUserBookings(userId: string) {
    return EventBooking.findAll({
      where: { user_id: userId },
      include: ["event"],
      order: [["created_at", "DESC"]],
    });
  },

  async getEventBookings(eventId: string) {
    return EventBooking.findAll({
      where: { event_id: eventId },
      include: ["user"],
      order: [["created_at", "DESC"]],
    });
  },

  async processPayment(id: string, amount: number, paymentMethod: string) {
    const booking = await EventBooking.findByPk(id);
    if (!booking) return null;

    await booking.update({
      payment_status: "paid",
      amount_paid: amount,
      payment_method: paymentMethod,
      updated_at: new Date(),
    });

    // Update booking status if payment completes
    if (booking.status === "pending") {
      await booking.update({
        status: "confirmed",
      });
    }

    // Notify user about successful payment
    await NotificationService.create({
      user_id: booking.user_id,
      title: "Payment Processed",
      message:
        "Your payment for the event booking has been processed successfully",
      type: "payment_processed",
      data: {
        event_id: booking.event_id,
        booking_id: booking.id,
        amount: amount,
        payment_method: paymentMethod,
      },
    });

    return this.get(id);
  },
};
