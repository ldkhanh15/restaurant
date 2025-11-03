import { BaseService } from "./baseService"
import Event from "../models/Event"
import EventBooking from "../models/EventBooking"
import { Op } from "sequelize"
import { FindOptions } from "sequelize"

class EventAppUserService extends BaseService<Event> {
  constructor() {
    super(Event)
  }

  /**
   * Lấy danh sách các sự kiện sắp diễn ra, sắp xếp theo ngày gần nhất.
   */
  // (See robust implementation lower in the file)

  /**
   * Lấy danh sách các sự kiện đã diễn ra, sắp xếp theo ngày gần nhất.
   */
  async findPastEvents() {
    const now = new Date()
    // Try a few common date field names; fall back to created_at if none exist
    const dateFields = ["event_date", "eventDate", "start_date", "startDate", "created_at", "createdAt"]
    for (const field of dateFields) {
      try {
        const options: FindOptions = {
          where: { [field]: { [Op.lt]: now } } as any,
          order: [[field, "DESC"]] as any,
        }
        const { rows } = await this.findAll(options)
        return rows
      } catch (_) {
        // ignore and try next field
      }
    }

    // Fallback: return all events ordered by created_at desc
    const { rows } = await this.findAll({ order: [["created_at", "DESC"]] })
    return rows
  }

  /**
   * Return events with related details (e.g., bookings). Useful for event detail endpoint.
   */
  async findByIdWithDetails(id: string, options?: FindOptions) {
    return await this.findById(id, {
      ...options,
      include: [{ model: EventBooking, as: "bookings" }],
    })
  }

  async findAllWithDetails(options?: FindOptions) {
    return await this.findAll({ ...options, include: [{ model: EventBooking, as: "bookings" }] })
  }

  /**
   * Find upcoming events. Attempts common date fields then falls back to ordering by created_at ascending.
   */
  async findUpcomingEvents(options?: FindOptions) {
    const now = new Date()
    const dateFields = ["event_date", "eventDate", "start_date", "startDate", "created_at", "createdAt"]
    for (const field of dateFields) {
      try {
        const opts: FindOptions = {
          where: { [field]: { [Op.gte]: now } } as any,
          order: [[field, "ASC"]] as any,
          ...options,
        }
        const { rows } = await this.findAll(opts)
        return rows
      } catch (_) {
        // try next field
      }
    }

    // Fallback: return all events ordered by created_at ascending
    const { rows } = await this.findAll({ order: [["created_at", "ASC"]], ...options })
    return rows
  }
}

export default new EventAppUserService()
