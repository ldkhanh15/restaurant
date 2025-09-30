import { BaseService } from "./baseService"
import Event from "../models/Event"

class EventService extends BaseService<Event> {
  constructor() {
    super(Event)
  }

  async findUpcomingEvents() {
    return await this.model.findAll({
      where: { status: "upcoming" },
      order: [["eventDate", "ASC"]],
    })
  }
}

export default new EventService()
