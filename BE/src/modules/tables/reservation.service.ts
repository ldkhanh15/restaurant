import { Op } from "sequelize";
import { Reservation } from "../../models/reservation.model";
import { Table } from "../../models/table.model";
import { User } from "../../models/user.model";
import {
  CreateReservationDTO,
  UpdateReservationDTO,
} from "../../types/dtos/table.dto";
import { v4 as uuidv4 } from "uuid";

export const ReservationService = {
  async list(filters?: Partial<CreateReservationDTO>) {
    return Reservation.findAll({
      where: filters,
      include: [
        {
          model: User,
          attributes: ["id", "full_name", "email", "phone"],
        },
        {
          model: Table,
        },
      ],
      order: [["reservation_time", "DESC"]],
    });
  },

  async get(id: string) {
    return Reservation.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ["id", "full_name", "email", "phone"],
        },
        {
          model: Table,
        },
      ],
    });
  },

  async create(payload: CreateReservationDTO) {
    const id = payload.id || uuidv4();
    const reservation = await Reservation.create({
      id,
      ...payload,
      status: payload.status || "pending",
      created_at: new Date(),
      updated_at: new Date(),
    });

    if (payload.table_id) {
      await Table.update(
        { status: "reserved" },
        { where: { id: payload.table_id } }
      );
    }

    return this.get(reservation.id);
  },

  async update(id: string, payload: UpdateReservationDTO) {
    const reservation = await Reservation.findByPk(id);
    if (!reservation) return null;

    await reservation.update({
      ...payload,
      updated_at: new Date(),
    });

    if (payload.table_id && payload.table_id !== reservation.table_id) {
      // Update old table status
      if (reservation.table_id) {
        await Table.update(
          { status: "available" },
          { where: { id: reservation.table_id } }
        );
      }

      // Update new table status
      await Table.update(
        { status: "reserved" },
        { where: { id: payload.table_id } }
      );
    }

    return this.get(id);
  },

  async cancel(id: string) {
    const reservation = await Reservation.findByPk(id);
    if (!reservation) return null;

    await reservation.update({
      status: "cancelled",
      updated_at: new Date(),
    });

    if (reservation.table_id) {
      await Table.update(
        { status: "available" },
        { where: { id: reservation.table_id } }
      );
    }

    return this.get(id);
  },

  async confirm(id: string) {
    const reservation = await Reservation.findByPk(id);
    if (!reservation) return null;

    await reservation.update({
      status: "confirmed",
      confirmation_sent: true,
      updated_at: new Date(),
    });

    return this.get(id);
  },

  async getUserReservations(userId: string) {
    return Reservation.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Table,
        },
      ],
      order: [["reservation_time", "DESC"]],
    });
  },
};
