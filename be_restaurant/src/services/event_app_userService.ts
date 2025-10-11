import { BaseService } from "./baseService"
import Event from "../models/Event"
import { Op } from "sequelize"

class EventAppUserService extends BaseService<Event> {
  constructor() {
    super(Event)
  }

  /**
   * Lấy danh sách các sự kiện sắp diễn ra, sắp xếp theo ngày gần nhất.
   */
  async findUpcomingEvents() {
    const now = new Date()
    const { rows } = await this.findAll({
      where: { eventDate: { [Op.gte]: now } },
      order: [["eventDate", "ASC"]],
    })
    return rows
  }

  /**
   * Lấy danh sách các sự kiện đã diễn ra, sắp xếp theo ngày gần nhất.
   */
  async findPastEvents() {
    const now = new Date()
    const { rows } = await this.findAll({
      where: { eventDate: { [Op.lt]: now } },
      order: [["eventDate", "DESC"]],
    })
    return rows
  }
}

export default new EventAppUserService()
