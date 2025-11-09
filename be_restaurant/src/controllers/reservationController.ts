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

export const getMyReservations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const { page = 1, limit = 10, ...filters } = getPaginationParams(req.query);

    // Only return reservations for the authenticated user
    const result = await reservationService.getAllReservations({
      ...filters,
      user_id: userId, // Force filter by current user
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
      console.log(
        `[Reservation] createReservation user=${req.user?.id} pre_order_items=`,
        req.body?.pre_order_items
      );
    } catch (e) {
      console.log(
        "[Reservation] createReservation - failed to log pre_order_items"
      );
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

export const cancelReservation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reason } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Check if user is authorized (admin/employee or owner)
    const reservation = await reservationService.getReservationById(
      req.params.id
    );
    if (!reservation) {
      return res.status(404).json({
        status: "error",
        message: "Reservation not found",
      });
    }

    // Allow if admin/employee or if user owns the reservation
    if (
      userRole !== "admin" &&
      userRole !== "employee" &&
      reservation.user_id !== userId
    ) {
      return res.status(403).json({
        status: "error",
        message: "You can only cancel your own reservations",
      });
    }

    const cancelledReservation = await reservationService.cancelReservation(
      req.params.id,
      reason || "Cancelled by user"
    );
    res.json({ status: "success", data: cancelledReservation });
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
    // Determine client source from query or header; default to user
    const clientFromQuery = (req.query.client as string) || "";
    const headerClient = (req.headers["x-client"] as string) || "";
    const client =
      (clientFromQuery || headerClient).toLowerCase() === "admin"
        ? "admin"
        : "user";

    const result = await reservationService.createDepositPayment(
      req.params.id,
      amount,
      bankCode,
      client
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

export const addDishToReservation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { dish_id, quantity } = req.body;
    const reservation = await reservationService.addDishToReservation(
      req.params.id,
      dish_id,
      quantity
    );
    res.json({ status: "success", data: reservation });
  } catch (error) {
    next(error);
  }
};

export const updateDishQuantity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { quantity } = req.body;
    const reservation = await reservationService.updateDishQuantity(
      req.params.id,
      req.params.dishId,
      quantity
    );
    res.json({ status: "success", data: reservation });
  } catch (error) {
    next(error);
  }
};

export const removeDishFromReservation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const reservation = await reservationService.removeDishFromReservation(
      req.params.id,
      req.params.dishId
    );
    res.json({ status: "success", data: reservation });
  } catch (error) {
    next(error);
  }
};
