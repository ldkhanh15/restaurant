import { BaseService } from "./baseService"
import Notification from "../models/Notification"
import { AppError } from "../middlewares/errorHandler"
import { FindOptions } from "sequelize"

class NotificationAppUserService extends BaseService<Notification> {
  constructor() {
    super(Notification)
  }

  /**
   * Lấy danh sách thông báo cho một người dùng cụ thể (có phân trang).
   */
  async findByUser(userId: string, options?: FindOptions): Promise<{ rows: Notification[]; count: number }> {
    // Note: Notification model defines `user_id` (snake_case). Use that column name here.
    return await this.model.findAndCountAll({
      ...options,
      where: { user_id: userId },
    }) as unknown as { rows: Notification[]; count: number }
  }

  /**
   * Đếm số thông báo chưa đọc của người dùng.
   */
  async countUnreadByUser(userId: string): Promise<number> {
    // The current Notification model does not track a "read" flag.
    // As a fallback, return total notifications count for the user.
    // If unread-count behavior is required, add a `read` column or a separate user_notification table.
    return await this.model.count({
      where: { user_id: userId },
    }) as number
  }

  /**
   * Đánh dấu một thông báo là đã đọc.
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.findById(notificationId)
    if (!notification || String((notification as any).user_id) !== userId) {
      throw new AppError("Notification not found or you don't have permission", 404)
    }
    // Notification model does not have a `read` column. Cannot mark as read.
    throw new AppError(
      "Cannot mark notification as read: Notification model does not track read status. Add a 'read' column or a separate tracking table.",
      400,
    )
  }

  /**
   * Đánh dấu tất cả thông báo của người dùng là đã đọc.
   */
  async markAllAsRead(userId: string): Promise<[number]> {
    // Not supported because Notification model doesn't have a `read` attribute.
    throw new AppError(
      "Cannot mark all as read: Notification model does not track read status. Add a 'read' column or a separate tracking table.",
      400,
    )
  }

  /**
   * Xóa một thông báo.
   */
  async deleteForUser(notificationId: string, userId: string): Promise<void> {
    const notification = await this.findById(notificationId)
    if (!notification || String((notification as any).user_id) !== userId) {
      throw new AppError("Notification not found or you don't have permission", 404)
    }
    return await this.delete(notificationId)
  }
}

export default new NotificationAppUserService()
