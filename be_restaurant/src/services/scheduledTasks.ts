import { Op } from "sequelize";
import Reservation from "../models/Reservation";
import Table from "../models/Table";
import User from "../models/User";
import { reservationEvents } from "../sockets/reservationSocket";
import { getIO } from "../sockets";
import logger from "../config/logger";

/**
 * Auto-cancel reservations that are more than 30 minutes late
 * Runs every 5 minutes
 */
export async function cancelLateReservations() {
  try {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    // Find confirmed reservations that are more than 30 minutes past their reservation time
    const lateReservations = await Reservation.findAll({
      where: {
        status: "confirmed",
        reservation_time: {
          [Op.lt]: thirtyMinutesAgo,
        },
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "email"],
        },
      ],
    });

    for (const reservation of lateReservations) {
      try {
        // Update reservation status to cancelled
        await reservation.update({
          status: "cancelled",
        });

        // Free up the table if assigned
        if (reservation.table_id) {
          await Table.update(
            { status: "available" },
            { where: { id: reservation.table_id } }
          );
        }

        // Emit WebSocket event
        try {
          reservationEvents.reservationStatusChanged(
            getIO(),
            reservation,
            "cancelled"
          );
        } catch (error) {
          logger.error(
            `Failed to emit reservation status changed event for ${reservation.id}:`,
            error
          );
        }

        logger.info(
          `Auto-cancelled late reservation ${reservation.id} (was scheduled for ${reservation.reservation_time})`
        );
      } catch (error) {
        logger.error(
          `Failed to cancel late reservation ${reservation.id}:`,
          error
        );
      }
    }

    if (lateReservations.length > 0) {
      logger.info(
        `Auto-cancelled ${lateReservations.length} late reservation(s)`
      );
    }
  } catch (error) {
    logger.error("Error in cancelLateReservations:", error);
  }
}

/**
 * Check and ban users who have failed reservations more than 5 times in the current month
 * Runs daily at midnight
 */
export async function checkAndBanUsersWithFailedReservations() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    // Find users with 5+ cancelled/no_show reservations in current month
    const failedReservations = await Reservation.findAll({
      where: {
        status: {
          [Op.in]: ["cancelled", "no_show"],
        },
        created_at: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "email", "deleted_at"],
          required: true,
        },
      ],
    });

    // Group by user_id and count (only for customer users)
    const userFailureCounts = new Map<string, number>();
    for (const reservation of failedReservations) {
      if (
        reservation.user_id &&
        reservation.user &&
        reservation.user.role === "customer"
      ) {
        const count = userFailureCounts.get(reservation.user_id) || 0;
        userFailureCounts.set(reservation.user_id, count + 1);
      }
    }

    // Ban users with 5+ failures
    const usersToBan: string[] = [];
    for (const [userId, count] of userFailureCounts.entries()) {
      if (count >= 5) {
        usersToBan.push(userId);
      }
    }

    // Soft delete (ban) users
    for (const userId of usersToBan) {
      try {
        const user = await User.findByPk(userId);
        if (user && !user.deleted_at) {
          await user.update({
            deleted_at: new Date(),
          });

          logger.info(
            `Banned user ${userId} (${
              user.username
            }) for ${userFailureCounts.get(
              userId
            )} failed reservations in current month`
          );

          // Note: Token invalidation will be handled by authentication middleware
          // when checking if user.deleted_at is set
        }
      } catch (error) {
        logger.error(`Failed to ban user ${userId}:`, error);
      }
    }

    if (usersToBan.length > 0) {
      logger.info(
        `Banned ${usersToBan.length} user(s) for excessive failed reservations`
      );
    }
  } catch (error) {
    logger.error("Error in checkAndBanUsersWithFailedReservations:", error);
  }
}

/**
 * Start scheduled tasks
 */
export function startScheduledTasks() {
  // Run cancelLateReservations every 5 minutes
  setInterval(() => {
    cancelLateReservations();
  }, 5 * 60 * 1000); // 5 minutes

  // Run checkAndBanUsersWithFailedReservations daily at midnight
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const msUntilMidnight = midnight.getTime() - now.getTime();

  setTimeout(() => {
    checkAndBanUsersWithFailedReservations();
    // Then run daily
    setInterval(() => {
      checkAndBanUsersWithFailedReservations();
    }, 24 * 60 * 60 * 1000); // 24 hours
  }, msUntilMidnight);

  logger.info("Scheduled tasks started");
}
