import type { Request, Response, NextFunction } from "express"
import reservationService, { RESERVATION_ALLOWED_STATUSES } from "../services/reservation_app_userService"
import { AppError } from "../middlewares/errorHandler"

// Simple endpoints for mobile app
export const getReservations_app_user = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      throw new AppError("Unauthorized", 401)
    }
    const reservations = await reservationService.getReservationsByUser(String(req.user.id), {
      order: [["reservation_time", "DESC"]],
    })
    // return raw rows array
    res.json(reservations.rows)
  } catch (error) {
    next(error)
  }
}

export const getReservationById_app_user = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      throw new AppError("Unauthorized", 401)
    }
    const reservation = await reservationService.findByIdWithDetails(req.params.id)
    if (!reservation) {
      throw new AppError("Reservation not found", 404)
    }
    if (String(reservation.user_id) !== String(req.user.id)) {
      throw new AppError("Forbidden", 403)
    }
    res.json(reservation)
  } catch (error) {
    next(error)
  }
}

export const createReservation_app_user = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      throw new AppError("Unauthorized", 401)
    }
    const reservation = await reservationService.create({ ...req.body, user_id: req.user.id })
    res.status(201).json(reservation)
  } catch (error) {
    next(error)
  }
}

export const confirmReservation_app_user = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      throw new AppError("Unauthorized", 401)
    }
    const existingReservation = await reservationService.findById(req.params.id)
    if (!existingReservation) {
      throw new AppError("Reservation not found", 404)
    }
    if (String(existingReservation.user_id) !== String(req.user.id)) {
      throw new AppError("Forbidden", 403)
    }
    const reservation = await reservationService.confirm(req.params.id)
    res.json(reservation)
  } catch (error) {
    next(error)
  }
}

export const updateReservation_app_user = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      throw new AppError("Unauthorized", 401)
    }
    const existingReservation = await reservationService.findById(req.params.id)
    if (!existingReservation) {
      throw new AppError("Reservation not found", 404)
    }
    if (String(existingReservation.user_id) !== String(req.user.id)) {
      throw new AppError("Forbidden", 403)
    }
    const reservation = await reservationService.update(req.params.id, req.body)
    res.json(reservation)
  } catch (error) {
    next(error)
  }
}

export const cancelReservation_app_user = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      throw new AppError("Unauthorized", 401)
    }
    const existingReservation = await reservationService.findById(req.params.id)
    if (!existingReservation) {
      throw new AppError("Reservation not found", 404)
    }
    if (String(existingReservation.user_id) !== String(req.user.id)) {
      throw new AppError("Forbidden", 403)
    }
    const reservation = await reservationService.cancel(req.params.id)
    res.json(reservation)
  } catch (error) {
    next(error)
  }
}
