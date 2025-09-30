import { BaseService } from "./baseService"
import Reservation from "../models/Reservation"
import User from "../models/User"
import Table from "../models/Table"

class ReservationService extends BaseService<Reservation> {
  constructor() {
    super(Reservation)
  }

  async findAllWithDetails(options?: any) {
    return await this.findAll({
      ...options,
      include: [
        { model: User, as: "user" },
        { model: Table, as: "table" },
      ],
    })
  }
}

export default new ReservationService()
