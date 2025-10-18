import { Op } from "sequelize";
import sequelize from "../config/database";
import Reservation from "../models/Reservation";
import Order from "../models/Order";
import { AppError } from "../middlewares/errorHandler";

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
}

export function calculateTimeSlot(
  reservationTime: Date,
  durationMinutes: number
): TimeSlot {
  const startTime = new Date(reservationTime);
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
  return { startTime, endTime };
}

export async function validateReservationOverlap(
  tableId: string,
  reservationTime: Date,
  durationMinutes: number,
  excludeReservationId?: string
): Promise<void> {
  const { startTime, endTime } = calculateTimeSlot(
    reservationTime,
    durationMinutes
  );

  const whereClause: any = {
    table_id: tableId,
    status: { [Op.in]: ["pending", "confirmed"] },
    [Op.or]: [
      // New reservation starts during existing reservation
      {
        reservation_time: { [Op.lte]: startTime },
        [Op.and]: [
          sequelize.literal(
            `DATE_ADD(reservation_time, INTERVAL duration_minutes MINUTE) > '${startTime.toISOString()}'`
          ),
        ],
      },
      // New reservation ends during existing reservation
      {
        reservation_time: { [Op.lt]: endTime },
        [Op.and]: [
          sequelize.literal(
            `DATE_ADD(reservation_time, INTERVAL duration_minutes MINUTE) >= '${endTime.toISOString()}'`
          ),
        ],
      },
      // New reservation completely contains existing reservation
      {
        reservation_time: { [Op.gte]: startTime },
        [Op.and]: [
          sequelize.literal(
            `DATE_ADD(reservation_time, INTERVAL duration_minutes MINUTE) <= '${endTime.toISOString()}'`
          ),
        ],
      },
    ],
  };

  if (excludeReservationId) {
    whereClause.id = { [Op.ne]: excludeReservationId };
  }

  const conflictingReservation = await Reservation.findOne({
    where: whereClause,
  });

  if (conflictingReservation) {
    throw new AppError(
      `Table is already reserved from ${conflictingReservation.reservation_time} for ${conflictingReservation.duration_minutes} minutes`
    ,400);
  }
}

export async function validateOrderOverlap(
  tableId: string,
  orderTime: Date,
  excludeOrderId?: string
): Promise<void> {
  const whereClause: any = {
    table_id: tableId,
    status: {
      [Op.in]: ["pending", "dining", "preparing", "ready", "waiting_payment"],
    },
    created_at: { [Op.gte]: orderTime },
  };

  if (excludeOrderId) {
    whereClause.id = { [Op.ne]: excludeOrderId };
  }

  const conflictingOrder = await Order.findOne({
    where: whereClause,
  });

  if (conflictingOrder) {
    throw new AppError(
      `Table already has an active order (${conflictingOrder.status}) created at ${conflictingOrder.created_at}`
    ,400);
  }
}

export async function validateTableGroupReservationOverlap(
  tableGroupId: string,
  reservationTime: Date,
  durationMinutes: number,
  excludeReservationId?: string
): Promise<void> {
  const { startTime, endTime } = calculateTimeSlot(
    reservationTime,
    durationMinutes
  );

  const whereClause: any = {
    table_group_id: tableGroupId,
    status: { [Op.in]: ["pending", "confirmed"] },
    [Op.or]: [
      {
        reservation_time: { [Op.lte]: startTime },
        [Op.and]: [
          sequelize.literal(
            `DATE_ADD(reservation_time, INTERVAL duration_minutes MINUTE) > '${startTime.toISOString()}'`
          ),
        ],
      },
      {
        reservation_time: { [Op.lt]: endTime },
        [Op.and]: [
          sequelize.literal(
            `DATE_ADD(reservation_time, INTERVAL duration_minutes MINUTE) >= '${endTime.toISOString()}'`
          ),
        ],
      },
      {
        reservation_time: { [Op.gte]: startTime },
        [Op.and]: [
          sequelize.literal(
            `DATE_ADD(reservation_time, INTERVAL duration_minutes MINUTE) <= '${endTime.toISOString()}'`
          ),
        ],
      },
    ],
  };

  if (excludeReservationId) {
    whereClause.id = { [Op.ne]: excludeReservationId };
  }

  const conflictingReservation = await Reservation.findOne({
    where: whereClause,
  });

  if (conflictingReservation) {
    throw new AppError(
      `Table group is already reserved from ${conflictingReservation.reservation_time} for ${conflictingReservation.duration_minutes} minutes`
    ,400);
  }
}

export async function validateTableGroupOrderOverlap(
  tableGroupId: string,
  orderTime: Date,
  excludeOrderId?: string
): Promise<void> {
  const whereClause: any = {
    table_group_id: tableGroupId,
    status: {
      [Op.in]: ["pending", "dining", "preparing", "ready", "waiting_payment"],
    },
    created_at: { [Op.gte]: orderTime },
  };

  if (excludeOrderId) {
    whereClause.id = { [Op.ne]: excludeOrderId };
  }

  const conflictingOrder = await Order.findOne({
    where: whereClause,
  });

  if (conflictingOrder) {
    throw new AppError(
      `Table group already has an active order (${conflictingOrder.status}) created at ${conflictingOrder.created_at}`
    ,400);
  }
}
