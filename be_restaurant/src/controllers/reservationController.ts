import type { Request, Response, NextFunction } from "express"
import reservationService from "../services/reservationService"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"

export const getAllReservations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(req.query)
    const offset = (page - 1) * limit

    const { rows, count } = await reservationService.findAllWithDetails({
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

export const getReservationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reservation = await reservationService.findById(Number(req.params.id))
    res.json({ status: "success", data: reservation })
  } catch (error) {
    next(error)
  }
}

export const createReservation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reservation = await reservationService.create(req.body)
    res.status(201).json({ status: "success", data: reservation })
  } catch (error) {
    next(error)
  }
}

export const updateReservation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reservation = await reservationService.update(Number(req.params.id), req.body)
    res.json({ status: "success", data: reservation })
  } catch (error) {
    next(error)
  }
}

export const deleteReservation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await reservationService.delete(Number(req.params.id))
    res.json({ status: "success", message: "Reservation deleted successfully" })
  } catch (error) {
    next(error)
  }
}
