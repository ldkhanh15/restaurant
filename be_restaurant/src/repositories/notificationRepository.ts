import { Op } from "sequelize";
import Notification from "../models/Notification";
import User from "../models/User";
import { AppError } from "../middlewares/errorHandler";

export interface NotificationFilters {
  user_id?: string;
  type?: string;
  is_read?: boolean;
  page?: number;
  limit?: number;
}

export interface NotificationWithDetails {
  id: string;
  user_id?: string;
  type: string;
  content: string;
  title?: string;
  data?: any;
  is_read: boolean;
  sent_at?: Date;
  status: string;
  user?: User;
}

class NotificationRepository {
  async findAll(filters: NotificationFilters = {}) {
    const { page = 1, limit = 10, ...whereFilters } = filters;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (whereFilters.user_id) {
      where.user_id = whereFilters.user_id;
    }

    if (whereFilters.type) {
      where.type = whereFilters.type;
    }

    if (whereFilters.is_read !== undefined) {
      where.is_read = whereFilters.is_read;
    }

    const { rows, count } = await Notification.findAndCountAll({
      where,
      limit,
      offset,
      order: [["sent_at", "DESC"]],
      include: [{ model: User, as: "user" }],
    });

    return { rows, count, page, limit };
  }

  async findById(id: string): Promise<NotificationWithDetails | null> {
    const notification = await Notification.findByPk(id, {
      include: [{ model: User, as: "user" }],
    });

    return notification as NotificationWithDetails;
  }

  async findUnreadByUser(userId: string): Promise<Notification[]> {
    return await Notification.findAll({
      where: {
        user_id: userId,
        is_read: false,
      },
      order: [["sent_at", "DESC"]],
      include: [{ model: User, as: "user" }],
    });
  }

  async create(data: any): Promise<Notification> {
    return await Notification.create(data);
  }

  async update(id: string, data: any): Promise<Notification> {
    const notification = await Notification.findByPk(id);
    if (!notification) {
      throw new AppError("Notification not found",404);
    }

    await notification.update(data);
    return notification;
  }

  async delete(id: string): Promise<void> {
    const notification = await Notification.findByPk(id);
    if (!notification) {
      throw new AppError("Notification not found",404);
    }

    await notification.destroy();
  }

  async markAsRead(id: string): Promise<Notification> {
    const notification = await Notification.findByPk(id);
    if (!notification) {
      throw new AppError("Notification not found",404);
    }

    await notification.update({ is_read: true });
    return notification;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const [affectedCount] = await Notification.update(
      { is_read: true },
      {
        where: {
          user_id: userId,
          is_read: false,
        },
      }
    );

    return affectedCount;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await Notification.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    });
  }

  async getNotificationStats() {
    const totalNotifications = await Notification.count();
    const unreadNotifications = await Notification.count({
      where: { is_read: false },
    });
    const readNotifications = await Notification.count({
      where: { is_read: true },
    });

    // Get counts by type
    const typeStats = await Notification.findAll({
      attributes: [
        "type",
        [
          Notification.sequelize!.fn(
            "COUNT",
            Notification.sequelize!.col("id")
          ),
          "count",
        ],
      ],
      group: ["type"],
      raw: true,
    });

    return {
      total_notifications: totalNotifications,
      unread_notifications: unreadNotifications,
      read_notifications: readNotifications,
      type_stats: typeStats,
    };
  }

  async getRecentNotifications(limit: number = 20) {
    return await Notification.findAll({
      order: [["sent_at", "DESC"]],
      limit,
      include: [{ model: User, as: "user" }],
    });
  }

  async deleteOldNotifications(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const deletedCount = await Notification.destroy({
      where: {
        sent_at: {
          [Op.lt]: cutoffDate,
        },
        is_read: true,
      },
    });

    return deletedCount;
  }

  async getNotificationsByType(type: string, limit: number = 50) {
    return await Notification.findAll({
      where: { type },
      order: [["sent_at", "DESC"]],
      limit,
      include: [{ model: User, as: "user" }],
    });
  }
}

export default new NotificationRepository();
