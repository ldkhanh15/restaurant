import notificationRepository from "../repositories/notificationRepository";
import User from "../models/User";
import { getIO } from "../sockets";
import { AppError } from "../middlewares/errorHandler";

export interface CreateNotificationData {
  type: string;
  title?: string;
  content: string;
  user_id?: string;
  data?: any;
}

export interface UpdateNotificationData {
  title?: string;
  content?: string;
  data?: any;
  is_read?: boolean;
}

class NotificationService {
  async getAllNotifications(filters: any) {
    // Validate filters
    if (filters.type && !this.isValidNotificationType(filters.type)) {
      throw new AppError("Invalid notification type", 400);
    }

    if (filters.is_read !== undefined && typeof filters.is_read !== "boolean") {
      throw new AppError("is_read must be boolean", 400);
    }

    return await notificationRepository.findAll(filters);
  }

  async getNotificationById(id: string) {
    if (!id) {
      throw new AppError("Notification ID is required", 400);
    }

    const notification = await notificationRepository.findById(id);
    if (!notification) {
      throw new AppError("Notification not found", 404);
    }

    return notification;
  }

  async getUnreadNotifications(userId: string) {
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    // Validate user exists
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    return await notificationRepository.findUnreadByUser(userId);
  }

  async createNotification(data: CreateNotificationData) {
    // Validate required fields
    if (!data.type || !this.isValidNotificationType(data.type)) {
      throw new AppError("Invalid notification type", 400);
    }

    if (!data.content || data.content.trim().length === 0) {
      throw new AppError("Notification content is required", 400);
    }

    if (data.content.length > 1000) {
      throw new AppError(
        "Notification content too long (max 1000 characters)",
        400
      );
    }

    if (data.title && data.title.length > 200) {
      throw new AppError(
        "Notification title too long (max 200 characters)",
        400
      );
    }

    // Validate user if provided
    if (data.user_id) {
      const user = await User.findByPk(data.user_id);
      if (!user) {
        throw new AppError("User not found", 404);
      }
    }

    const notification = await notificationRepository.create({
      ...data,
      content: data.content.trim(),
      title: data.title?.trim(),
      is_read: false,
      status: "sent",
    });

    // Emit WebSocket notification
    try {
      const io = getIO();
      if (io) {
        // Emit to admin namespace for staff
        const { notificationEvents } = await import(
          "../sockets/notificationSocket"
        );
        notificationEvents.notifyStaff(io, notification);

        // Emit to specific customer if user_id provided
        if (data.user_id) {
          notificationEvents.notifyCustomer(io, data.user_id, {
            id: notification.id,
            user_id: notification.user_id,
            type: notification.type,
            title: notification.title,
            content: notification.content,
            data: notification.data,
            is_read: notification.is_read,
            sent_at: notification.sent_at,
            status: notification.status,
            created_at: (notification as any).createdAt,
            updated_at: (notification as any).updatedAt,
          });
        }
      }
    } catch (error) {
      console.error("Failed to emit notification:", error);
    }

    return notification;
  }

  async updateNotification(id: string, data: UpdateNotificationData) {
    const notification = await notificationRepository.findById(id);
    if (!notification) {
      throw new AppError("Notification not found", 404);
    }

    // Validate updates
    if (data.content !== undefined) {
      if (!data.content || data.content.trim().length === 0) {
        throw new AppError("Notification content cannot be empty", 400);
      }
      if (data.content.length > 1000) {
        throw new AppError(
          "Notification content too long (max 1000 characters)",
          400
        );
      }
      data.content = data.content.trim();
    }

    if (data.title !== undefined && data.title && data.title.length > 200) {
      throw new AppError(
        "Notification title too long (max 200 characters)",
        400
      );
    }

    const updatedNotification = await notificationRepository.update(id, data);
    return updatedNotification;
  }

  async deleteNotification(id: string) {
    const notification = await notificationRepository.findById(id);
    if (!notification) {
      throw new AppError("Notification not found", 404);
    }

    await notificationRepository.delete(id);
  }

  async markAsRead(id: string) {
    const notification = await notificationRepository.findById(id);
    if (!notification) {
      throw new AppError("Notification not found", 404);
    }

    const updatedNotification = await notificationRepository.markAsRead(id);
    return updatedNotification;
  }

  async markAllAsRead(userId: string) {
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    // Validate user exists
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const affectedCount = await notificationRepository.markAllAsRead(userId);

    // Emit update event to customer
    try {
      const io = getIO();
      if (io) {
        io.of("/customer")
          .to(`customer:${userId}`)
          .emit("notification:mark_all_read", {
            userId,
            affected_count: affectedCount,
          });
      }
    } catch (error) {
      console.error("Failed to emit mark all read:", error);
    }

    return { affected_count: affectedCount };
  }

  async getUnreadCount(userId: string) {
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    return await notificationRepository.getUnreadCount(userId);
  }

  async getNotificationStats() {
    return await notificationRepository.getNotificationStats();
  }

  async getRecentNotifications(limit: number = 20) {
    if (limit < 1 || limit > 100) {
      throw new AppError("Limit must be between 1 and 100", 400);
    }

    return await notificationRepository.getRecentNotifications(limit);
  }

  async deleteOldNotifications(daysOld: number = 30) {
    if (daysOld < 1) {
      throw new AppError("Days old must be at least 1", 400);
    }

    return await notificationRepository.deleteOldNotifications(daysOld);
  }

  async getNotificationsByType(type: string, limit: number = 50) {
    if (!this.isValidNotificationType(type)) {
      throw new AppError("Invalid notification type", 400);
    }

    if (limit < 1 || limit > 100) {
      throw new AppError("Limit must be between 1 and 100", 400);
    }

    return await notificationRepository.getNotificationsByType(type, limit);
  }

  // Specific notification methods for different events
  async notifyOrderCreated(order: any) {
    return await this.createNotification({
      type: "order_created",
      title: "Đơn hàng mới",
      content: `Khách hàng đã tạo đơn hàng mới #${order.id} với tổng tiền ${order.final_amount}đ`,
      data: {
        order_id: order.id,
        table_id: order.table_id,
        table_group_id: order.table_group_id,
        amount: order.final_amount,
      },
    });
  }

  async notifyOrderUpdated(order: any) {
    return await this.createNotification({
      type: "order_updated",
      title: "Đơn hàng được cập nhật",
      content: `Đơn hàng #${order.id} đã được cập nhật`,
      data: {
        order_id: order.id,
        table_id: order.table_id,
        table_group_id: order.table_group_id,
      },
    });
  }

  async notifyOrderStatusChanged(order: any, oldStatus: string) {
    const statusMap: Record<string, string> = {
      pending: "Chờ xử lý",
      preparing: "Đang chuẩn bị",
      ready: "Sẵn sàng",
      delivered: "Đã giao",
      paid: "Đã thanh toán",
      cancelled: "Đã hủy",
    };

    return await this.createNotification({
      type: "order_status_changed",
      title: "Trạng thái đơn hàng thay đổi",
      content: `Đơn hàng #${order.id} đã chuyển từ "${
        statusMap[oldStatus] || oldStatus
      }" sang "${statusMap[order.status] || order.status}"`,
      data: {
        order_id: order.id,
        table_id: order.table_id,
        table_group_id: order.table_group_id,
        old_status: oldStatus,
        new_status: order.status,
      },
    });
  }

  async notifyReservationCreated(reservation: any) {
    return await this.createNotification({
      type: "reservation_created",
      title: "Đặt bàn mới",
      content: `Khách hàng đã đặt bàn mới cho ${
        reservation.num_people
      } người vào ${new Date(reservation.reservation_time).toLocaleString(
        "vi-VN"
      )}`,
      data: {
        reservation_id: reservation.id,
        table_id: reservation.table_id,
        table_group_id: reservation.table_group_id,
        num_people: reservation.num_people,
      },
    });
  }

  async notifyReservationUpdated(reservation: any) {
    return await this.createNotification({
      type: "reservation_updated",
      title: "Đặt bàn được cập nhật",
      content: `Đặt bàn #${reservation.id} đã được cập nhật`,
      data: {
        reservation_id: reservation.id,
        table_id: reservation.table_id,
        table_group_id: reservation.table_group_id,
      },
    });
  }

  async notifyChatMessage(message: any, session: any) {
    return await this.createNotification({
      type: "chat_message",
      title: "Tin nhắn tư vấn mới",
      content: `Khách hàng đã gửi tin nhắn: "${message.message_text.substring(
        0,
        100
      )}${message.message_text.length > 100 ? "..." : ""}"`,
      data: {
        message_id: message.id,
        session_id: message.session_id,
        sender_type: message.sender_type,
      },
    });
  }

  async notifySupportRequest(order: any) {
    return await this.createNotification({
      type: "support_request",
      title: "Yêu cầu hỗ trợ",
      content: `Bàn ${
        order.table_id || order.table_group_id
      } yêu cầu hỗ trợ cho đơn hàng #${order.id}`,
      data: {
        order_id: order.id,
        table_id: order.table_id,
        table_group_id: order.table_group_id,
      },
    });
  }

  async notifyPaymentCompleted(order: any) {
    return await this.createNotification({
      type: "payment_completed",
      title: "Thanh toán hoàn tất",
      content: `Đơn hàng #${order.id} đã thanh toán thành công với số tiền ${order.final_amount}đ`,
      data: {
        order_id: order.id,
        table_id: order.table_id,
        table_group_id: order.table_group_id,
        amount: order.final_amount,
        payment_method: order.payment_method,
      },
    });
  }
  async notifyRequestPayment(order: any) {
    return await this.createNotification({
      type: "request_payment",
      title: "Yêu cầu thanh toán",
      content: `Khách đã yêu cầu thanh toán cho đơn hàng #${order.id}`,
      data: {
        order_id: order.id,
        table_id: order.table_id,
        table_group_id: order.table_group_id,
        amount: order.final_amount,
        payment_method: order.payment_method,
      },
    });
  }
  private isValidNotificationType(type: string): boolean {
    const validTypes = [
      "low_stock",
      "reservation_confirm",
      "promotion",
      "order_created",
      "order_updated",
      "order_status_changed",
      "reservation_created",
      "reservation_updated",
      "chat_message",
      "support_request",
      "payment_completed",
      "other",
    ];

    return validTypes.includes(type);
  }
}

export default new NotificationService();
