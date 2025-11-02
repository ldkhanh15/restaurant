import type { Request, Response, NextFunction } from "express";
import reservationService from "../services/reservationService";
import {
  getPaginationParams,
  buildPaginationResult,
} from "../utils/pagination";

export const getAllReservations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 10, ...filters } = getPaginationParams(req.query);

    const result = await reservationService.getAllReservations({
      ...filters,
      page,
      limit,
    });

    const paginatedResult = buildPaginationResult(
      result.rows,
      result.count,
      page,
      limit
    );
    res.json({ status: "success", data: paginatedResult });
  } catch (error) {
    next(error);
  }
};

export const getReservationById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const reservation = await reservationService.getReservationById(
      req.params.id
    );
    res.json({ status: "success", data: reservation });
  } catch (error) {
    next(error);
  }
};

export const createReservation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Debug: log incoming pre_order_items to help trace accidental pre-orders
    try {
      console.log(`[Reservation] createReservation user=${req.user?.id} pre_order_items=`, req.body?.pre_order_items)
    } catch (e) {
      console.log('[Reservation] createReservation - failed to log pre_order_items')
    }

    const data = {
      ...req.body,
      user_id: req.user?.id,
    };

    const reservation = await reservationService.createReservation(data);
    res.status(201).json({ status: "success", data: reservation });
  } catch (error) {
    next(error);
  }
};

export const updateReservation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const reservation = await reservationService.updateReservation(
      req.params.id,
      req.body
    );
    res.json({ status: "success", data: reservation });
  } catch (error) {
    next(error);
  }
};

export const updateReservationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status } = req.body;
    const reservation = await reservationService.updateReservationStatus(
      req.params.id,
      status
    );
    res.json({ status: "success", data: reservation });
  } catch (error) {
    next(error);
  }
};

export const checkInReservation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await reservationService.checkInReservation(req.params.id);
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

export const deleteReservation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await reservationService.deleteReservation(req.params.id);
    res.json({
      status: "success",
      message: "Reservation deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const createDepositPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { amount, bankCode } = req.body;
    const result = await reservationService.createDepositPayment(
      req.params.id,
      amount,
      bankCode
    );
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

export const handleDepositPaymentSuccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const reservation = await reservationService.handleDepositPaymentSuccess(
      req.params.id
    );
    res.json({ status: "success", data: reservation });
  } catch (error) {
    next(error);
  }
};

export const handleDepositPaymentFailure = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const reservation = await reservationService.handleDepositPaymentFailure(
      req.params.id
    );
    res.json({ status: "success", data: reservation });
  } catch (error) {
    next(error);
  }
};
