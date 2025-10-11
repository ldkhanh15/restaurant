import type { Request, Response, NextFunction } from "express"
import notificationAppUserService from "../services/notification_app_userService"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"
import { AppError } from "../middlewares/errorHandler"

/**
 * Lấy tất cả thông báo của người dùng đang đăng nhập
 */
export const getUserNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError("Unauthorized", 401)
    }

    const { page = 1, limit = 10, sortBy = "created_at", sortOrder = "DESC" } = getPaginationParams(req.query)
    const offset = (page - 1) * limit

    // Map common API sort field to the Notification model column names
    const sortField = sortBy === "created_at" ? "sent_at" : sortBy

    const { rows, count } = await notificationAppUserService.findByUser(String(userId), {
      limit,
      offset,
      order: [[sortField, sortOrder]],
    })

    const result = buildPaginationResult(rows, count, page, limit)
    res.json(result) // Trả về trực tiếp object phân trang
  } catch (error) {
    next(error)
  }
}

/**
 * Lấy số lượng thông báo chưa đọc
 */
export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError("Unauthorized", 401)
    }
    const count = await notificationAppUserService.countUnreadByUser(String(userId))
    res.json({ count })
  } catch (error) {
    next(error)
  }
}

/**
 * Đánh dấu một thông báo là đã đọc
 */
export const markNotificationAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError("Unauthorized", 401)
    }
    const { id } = req.params
    const notification = await notificationAppUserService.markAsRead(id, String(userId))
    res.json(notification)
  } catch (error) {
    next(error)
  }
}

/**
 * Đánh dấu tất cả thông báo là đã đọc
 */
export const markAllNotificationsAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError("Unauthorized", 401)
    }
    await notificationAppUserService.markAllAsRead(String(userId))
    res.status(200).json({ message: "All notifications marked as read" })
  } catch (error) {
    next(error)
  }
}

export const deleteNotificationForUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError("Unauthorized", 401)
    }
    await notificationAppUserService.deleteForUser(req.params.id, String(userId))
    res.status(200).json({ message: "Notification deleted successfully" })
  } catch (error) {
    next(error)
  }
}
