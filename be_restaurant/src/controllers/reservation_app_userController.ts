import type { Request, Response, NextFunction } from "express"
import reservationService from "../services/reservationService"

// Simple endpoints for mobile app
export const getReservations_app_user = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reservations = await reservationService.findAllWithDetails({ limit: 1000, offset: 0 })
    // return raw rows array
    res.json(reservations.rows ? reservations.rows : reservations)
  } catch (error) {
    next(error)
  }
}

export const createReservation_app_user = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reservation = await reservationService.create(req.body)
    res.status(201).json(reservation)
  } catch (error) {
    next(error)
  }
}
