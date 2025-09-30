import { BaseService } from "./baseService"
import EventBooking from "../models/EventBooking"
import Event from "../models/Event"
import User from "../models/User"

class EventBookingService extends BaseService<EventBooking> {
  constructor() {
    super(EventBooking)
  }

  async findAllWithDetails(options?: any) {
    return await this.findAll({
      ...options,
      include: [
        { model: Event, as: "event" },
        { model: User, as: "user" },
      ],
    })
  }
}

export default new EventBookingService()
