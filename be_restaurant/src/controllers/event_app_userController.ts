import type { Request, Response, NextFunction } from "express"
import eventAppUserService from "../services/event_app_userService"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"
import eventBookingAppUserService from "../services/eventBooking_app_userService"
import { AppError } from "../middlewares/errorHandler"

export const getAllEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, sortBy = "created_at", sortOrder = "DESC" } = getPaginationParams(req.query)
    const offset = (page - 1) * limit

    const { rows, count } = await eventAppUserService.findAll({
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    })

      // Use the service method that includes related details (e.g., bookings)
      // so clients get richer event objects. The underlying service returns { rows, count }.
      // Note: we intentionally ignore the previous call result and call the detailed version.
      const detailed = await eventAppUserService.findAllWithDetails({
        limit,
        offset,
        order: [[sortBy, sortOrder]],
      })

      const rowsWithDetails = detailed.rows
      const countWithDetails = detailed.count
      const result = buildPaginationResult(rowsWithDetails, countWithDetails, page, limit)
      res.json({ status: "success", data: result })
  } catch (error) {
    next(error)
  }
}

/**
 * Lấy danh sách các vé đã đặt của người dùng.
 */
export const getUserEventBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError("Unauthorized", 401)
    }
    const { rows, count } = await eventBookingAppUserService.findBookingsByUser(String(userId))
    res.json({ status: "success", data: { bookings: rows, total: count } })
  } catch (error) {
    next(error)
  }
}

/**
 * Tạo một lượt đặt vé mới cho sự kiện.
 */
export const createEventBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError("Unauthorized", 401)
    }

    const { eventId, numberOfTickets } = req.body
    if (!eventId || !numberOfTickets) {
      throw new AppError("eventId and numberOfTickets are required", 400)
    }

    const booking = await eventBookingAppUserService.createBooking({
      userId: String(userId),
      eventId,
      numberOfTickets,
    })

    res.status(201).json({ status: "success", data: booking })
  } catch (error) {
    next(error)
  }
}

/**
 * Hủy một lượt đặt vé.
 */
export const cancelEventBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError("Unauthorized", 401)
    }

    const { bookingId } = req.params
    const cancelledBooking = await eventBookingAppUserService.cancelBooking(bookingId, String(userId))

    res.json({ status: "success", data: cancelledBooking })
  } catch (error) {
    next(error)
  }
}

/**
 * Lấy danh sách booking cho một sự kiện (thường dành cho admin/owner).
 */
export const getEventBookingsForEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventId = req.params.eventId
    if (!eventId) throw new AppError("Event id is required", 400)

    // reuse service findAllWithDetails and filter by event_id
    const { rows, count } = await eventBookingAppUserService.findAllWithDetails({ where: { event_id: eventId } })
    return res.json({ status: "success", data: { bookings: rows, total: count } })
  } catch (error) {
    next(error)
  }
}

/**
 * Tạo booking cho một sự kiện thông qua route nested /:eventId/bookings
 */
export const createEventBookingForEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError("Unauthorized", 401)
    }

    const eventId = req.params.eventId || req.body.eventId
    const { numberOfTickets } = req.body
    if (!eventId || !numberOfTickets) {
      throw new AppError("eventId and numberOfTickets are required", 400)
    }

    const booking = await eventBookingAppUserService.createBooking({
      userId: String(userId),
      eventId,
      numberOfTickets,
    })

    res.status(201).json({ status: "success", data: booking })
  } catch (error) {
    next(error)
  }
}

export const getUpcomingEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Support optional pagination via query params
    const { page = 1, limit = 0, sortBy = "created_at", sortOrder = "ASC" } = getPaginationParams(req.query)
    if (limit > 0) {
      const offset = (page - 1) * limit
      // Use the detailed fetch and filter for upcoming by delegating to service logic
      const rows = await eventAppUserService.findUpcomingEvents({ limit, offset, order: [[sortBy, sortOrder]] })
      // findUpcomingEvents returns an array of rows (not paginated count), so return as list
      return res.json({ status: "success", data: { events: rows } })
    }

    const events = await eventAppUserService.findUpcomingEvents()
    res.json({ status: "success", data: { events } })
  } catch (error) {
    next(error)
  }
}

export const getEventById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await eventAppUserService.findByIdWithDetails(req.params.id)
    res.json({ status: "success", data: event })
  } catch (error) {
    next(error)
  }
}

export const getPastEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await eventAppUserService.findPastEvents()
    res.json({ status: "success", data: { events } })
  } catch (error) {
    next(error)
  }
}

export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await eventAppUserService.create(req.body)
    res.status(201).json({ status: "success", data: event })
  } catch (error) {
    next(error)
  }
}

export const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await eventAppUserService.update(req.params.id, req.body)
    res.json({ status: "success", data: event })
  } catch (error) {
    next(error)
  }
}

export const deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await eventAppUserService.delete(req.params.id)
    res.json({ status: "success", message: "Event deleted successfully" })
  } catch (error) {
    next(error)
  }
}
