import type { Request, Response, NextFunction } from "express"
import eventService from "../services/eventService"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"
import { AppConstants } from "../constants/AppConstants"

export const getAllEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, sortBy = "created_at", sortOrder = "DESC" } = getPaginationParams(req.query)
    const offset = (page - 1) * limit

    const { rows, count } = await eventService.findAll({
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    })

    const result = buildPaginationResult(rows, count, page, limit)
    res.json({ status: "success", data: result })
  } catch (error) {
    next(error)
  }
}

export const getUpcomingEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await eventService.findUpcomingEvents()
    res.json({ status: "success", data: events })
  } catch (error) {
    next(error)
  }
}

export const getEventById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await eventService.findById(req.params.id)
    res.json({ status: "success", data: event })
  } catch (error) {
    next(error)
  }
}

export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await eventService.create(req.body)
    if(event.status !== AppConstants.EVENT_STATUS.PLANNED && event.status !== AppConstants.EVENT_STATUS.ONGOING && event.status !== AppConstants.EVENT_STATUS.COMPLETED){
      res.status(400).json({ status: "failed", error: "Invalid status value" })
    }
    res.status(201).json({ status: "success", data: event })
  } catch (error) {
    next(error)
  }
}

export const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await eventService.update(req.params.id, req.body)
    if(event.status !== AppConstants.EVENT_STATUS.PLANNED && event.status !== AppConstants.EVENT_STATUS.ONGOING && event.status !== AppConstants.EVENT_STATUS.COMPLETED){
       res.status(400).json({ status: "failed", error: "Invalid status value" })
    }
    res.json({ status: "success", data: event })
  } catch (error) {
    next(error)
  }
}

export const deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await eventService.delete(req.params.id)
    res.json({ status: "success", message: "Event deleted successfully" })
  } catch (error) {
    next(error)
  }
}
