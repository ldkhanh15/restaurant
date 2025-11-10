import type { Request, Response, NextFunction } from "express";
import reservationService, {
  RESERVATION_ALLOWED_STATUSES,
} from "../services/reservation_app_userService";
import notificationService from "../services/notificationService";
import { Op } from "sequelize";
import { AppError } from "../middlewares/errorHandler";

// Simple endpoints for mobile app
export const getReservations_app_user = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw new AppError("Unauthorized", 401);
    }
    const reservations = await reservationService.getReservationsByUser(
      String(req.user.id),
      {
        order: [["reservation_time", "DESC"]],
      }
    );
    // return raw rows array
    res.json(reservations.rows);
  } catch (error) {
    next(error);
  }
};

export const getReservationById_app_user = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw new AppError("Unauthorized", 401);
    }
    const reservation = await reservationService.findByIdWithDetails(
      req.params.id
    );
    if (!reservation) {
      throw new AppError("Reservation not found", 404);
    }
    if (String(reservation.user_id) !== String(req.user.id)) {
      throw new AppError("Forbidden", 403);
    }
    res.json(reservation);
  } catch (error) {
    next(error);
  }
};

export const createReservation_app_user = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw new AppError("Unauthorized", 401);
    }
    const reservation = await reservationService.create({
      ...req.body,
      user_id: req.user.id,
    });
    // Create a simple notification for the user about the created reservation.
    // Non-blocking: if notification creation fails we still return the reservation.
    try {
      const when = reservation.reservation_time
        ? new Date(reservation.reservation_time).toISOString()
        : undefined;
      const content = `Đặt bàn của bạn đã được tạo${
        when ? ` — thời gian: ${when}` : ""
      }. Mã: ${reservation.id}`;
      await notificationService.createNotification({
        user_id: req.user.id,
        type: "reservation",
        content,
      });
    } catch (e) {
      console.error(
        "[createReservation_app_user] failed to create notification",
        e
      );
    }

    res.status(201).json(reservation);
  } catch (error) {
    next(error);
  }
};

export const confirmReservation_app_user = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw new AppError("Unauthorized", 401);
    }
    const existingReservation = await reservationService.findById(
      req.params.id
    );
    if (!existingReservation) {
      throw new AppError("Reservation not found", 404);
    }
    if (String(existingReservation.user_id) !== String(req.user.id)) {
      throw new AppError("Forbidden", 403);
    }
    const reservation = await reservationService.confirm(req.params.id);
    res.json(reservation);
  } catch (error) {
    next(error);
  }
};

export const updateReservation_app_user = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw new AppError("Unauthorized", 401);
    }
    const existingReservation = await reservationService.findById(
      req.params.id
    );
    if (!existingReservation) {
      throw new AppError("Reservation not found", 404);
    }
    if (String(existingReservation.user_id) !== String(req.user.id)) {
      throw new AppError("Forbidden", 403);
    }
    const reservation = await reservationService.update(
      req.params.id,
      req.body
    );
    res.json(reservation);
  } catch (error) {
    next(error);
  }
};

export const cancelReservation_app_user = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw new AppError("Unauthorized", 401);
    }
    const existingReservation = await reservationService.findById(
      req.params.id
    );
    if (!existingReservation) {
      throw new AppError("Reservation not found", 404);
    }
    if (String(existingReservation.user_id) !== String(req.user.id)) {
      throw new AppError("Forbidden", 403);
    }
    const reservation = await reservationService.cancel(req.params.id);
    res.json(reservation);
  } catch (error) {
    next(error);
  }
};

export const getReservationsByTableAndDate_app_user = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw new AppError("Unauthorized", 401);
    }

    const tableId = req.query.tableId as string | undefined;
    const dateStr = req.query.date as string | undefined;
    if (!tableId || !dateStr) {
      throw new AppError("Missing tableId or date query parameter", 400);
    }

    // Expect date as YYYY-MM-DD (no time) to avoid timezone issues
    const dateParts = dateStr.split("-");
    if (dateParts.length !== 3) {
      throw new AppError("Invalid date format, expected YYYY-MM-DD", 400);
    }
    const [y, m, d] = dateParts.map((p) => parseInt(p, 10));
    if (isNaN(y) || isNaN(m) || isNaN(d)) {
      throw new AppError("Invalid date parts", 400);
    }

    // Build local start and end of the day
    const start = new Date(y, m - 1, d, 0, 0, 0, 0);
    const end = new Date(y, m - 1, d, 23, 59, 59, 999);

    const reservations = await reservationService.findAllWithDetails({
      where: {
        table_id: tableId,
        reservation_time: {
          [Op.between]: [start.toISOString(), end.toISOString()],
        },
        status: {
          [Op.notIn]: ["cancelled", "no_show"],
        },
      },
      order: [["reservation_time", "ASC"]],
    });

    // service.findAllWithDetails returns either an array or a { rows, count } object
    const rows = Array.isArray(reservations)
      ? reservations
      : (reservations as any).rows || [];
    res.json(rows);
  } catch (error) {
    next(error);
  }
};
