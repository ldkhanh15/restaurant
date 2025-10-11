import { BaseService } from "./baseService"
import Reservation from "../models/Reservation"
import User from "../models/User"
import Table from "../models/Table"
import { type FindOptions } from "sequelize"

export const RESERVATION_ALLOWED_STATUSES = [
  "pending",
  "confirmed",
  "seated",
  "completed",
  "cancelled",
  "no_show",
] as const

const includeDetails = [
  { model: User, as: "user" },
  { model: Table, as: "table" },
]

class ReservationService extends BaseService<Reservation> {
  constructor() {
    super(Reservation)
  }

  async findAllWithDetails(options?: FindOptions) {
    return await this.findAll({
      ...options,
      include: includeDetails,
    })
  }

  async findByIdWithDetails(id: string, options?: FindOptions) {
    return await this.findById(id, {
      ...options,
      include: includeDetails,
    })
  }

  async getReservationsByUser(userId: string, options?: FindOptions): Promise<{ rows: Reservation[]; count: number }> {
    return await this.findAllWithDetails({
      ...options,
      where: { ...(options?.where || {}), user_id: userId },
    })
  }

  async create(data: any): Promise<Reservation> {
    const newReservation = await super.create(data)
    return (await this.findByIdWithDetails(newReservation.id))!
  }

  async update(id: string, data: any): Promise<Reservation> {
    const updatedReservation = await super.update(id, data)
    return (await this.findByIdWithDetails(updatedReservation.id))!
  }

  async cancel(id: string): Promise<Reservation> {
    const reservation = await this.findById(id)
    await reservation.update({ status: "cancelled" })
    return (await this.findByIdWithDetails(id))!
  }

  async confirm(id: string): Promise<Reservation> {
    const reservation = await this.findById(id)
    await reservation.update({ status: "confirmed" })
    return (await this.findByIdWithDetails(id))!
  }

  async pending(id: string): Promise<Reservation> {
    const reservation = await this.findById(id)
    await reservation.update({ status: "pending" })
    return (await this.findByIdWithDetails(id))!
  }

  async no_show(id: string): Promise<Reservation> {
    const reservation = await this.findById(id)
    await reservation.update({ status: "no_show" })
    return (await this.findByIdWithDetails(id))!
  }
}

export default new ReservationService()
