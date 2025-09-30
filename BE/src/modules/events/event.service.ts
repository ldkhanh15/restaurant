import { Event, EventBooking, User } from "../../models/index";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import { CreateEventDTO, UpdateEventDTO } from "../../types/dtos/event.dto";

export const EventService = {
  async list(includeBookings = false) {
    return Event.findAll({
      include: [
        {
          model: User,
          as: "organizer",
          attributes: ["id", "full_name", "email"],
        },
        ...(includeBookings
          ? [
              {
                model: EventBooking,
                include: ["user"],
              },
            ]
          : []),
      ],
      order: [["start_date", "ASC"]],
    });
  },

  async get(id: string) {
    return Event.findByPk(id, {
      include: [
        {
          model: User,
          as: "organizer",
          attributes: ["id", "full_name", "email"],
        },
        {
          model: EventBooking,
          include: ["user"],
        },
      ],
    });
  },

  async create(payload: CreateEventDTO) {
    const id = payload.id || uuidv4();
    const event = await Event.create({
      id,
      ...payload,
      status: payload.status || "scheduled",
      created_at: new Date(),
    });
    return this.get(event.id);
  },

  async update(id: string, payload: UpdateEventDTO) {
    const event = await Event.findByPk(id);
    if (!event) return null;

    await event.update({
      ...payload,
      updated_at: new Date(),
    });
    return this.get(id);
  },

  async remove(id: string) {
    const event = await Event.findByPk(id);
    if (!event) return false;

    // Check if there are any bookings
    const bookings = await EventBooking.count({
      where: { event_id: id },
    });

    if (bookings > 0) {
      // Soft delete by updating status
      await event.update({
        status: "cancelled",
        updated_at: new Date(),
      });
    } else {
      // Hard delete if no bookings
      await event.destroy();
    }

    return true;
  },

  async getUpcomingEvents() {
    return Event.findAll({
      where: {
        start_date: {
          [Op.gt]: new Date(),
        },
        status: "scheduled",
      },
      include: [
        {
          model: User,
          as: "organizer",
          attributes: ["id", "full_name", "email"],
        },
      ],
      order: [["start_date", "ASC"]],
    });
  },

  async getEventsByDateRange(startDate: Date, endDate: Date) {
    return Event.findAll({
      where: {
        [Op.or]: [
          {
            start_date: {
              [Op.between]: [startDate, endDate],
            },
          },
          {
            end_date: {
              [Op.between]: [startDate, endDate],
            },
          },
        ],
      },
      include: [
        {
          model: User,
          as: "organizer",
          attributes: ["id", "full_name", "email"],
        },
        {
          model: EventBooking,
          include: ["user"],
        },
      ],
      order: [["start_date", "ASC"]],
    });
  },

  async checkAvailability(eventId: string) {
    const event = await Event.findByPk(eventId, {
      include: [
        {
          model: EventBooking,
          where: {
            status: {
              [Op.notIn]: ["cancelled", "rejected"],
            },
          },
          required: false,
        },
      ],
    });

    if (!event) return null;

    const totalBookings = event.event_bookings.reduce(
      (sum, booking) => sum + booking.number_of_guests,
      0
    );

    return {
      event_id: event.id,
      max_participants: event.max_participants,
      current_bookings: totalBookings,
      available_spots: event.max_participants
        ? event.max_participants - totalBookings
        : null,
      is_full: event.max_participants
        ? totalBookings >= event.max_participants
        : false,
    };
  },
};
