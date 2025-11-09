import type { Request, Response, NextFunction } from "express";
import notificationService from "../services/notificationService";
import {
  getPaginationParams,
  buildPaginationResult,
} from "../utils/pagination";

export const getAllNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 10, ...filters } = getPaginationParams(req.query);
    const currentUserId = req.user?.id;
    const userRole = req.user?.role;

    // If customer, only show their own notifications
    // Admin/employee can see all or filter by user_id
    const notificationFilters: any = { ...filters };
    if (userRole === "customer" && currentUserId) {
      notificationFilters.user_id = String(currentUserId);
    }

    const result = await notificationService.getAllNotifications({
      ...notificationFilters,
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

export const getNotificationById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentUserId = req.user?.id;
    const userRole = req.user?.role;
    const notification = await notificationService.getNotificationById(
      req.params.id
    );

    // If customer, ensure they can only access their own notification
    if (userRole === "customer" && notification.user_id !== currentUserId) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: You can only access your own notifications",
      });
    }

    res.json({ status: "success", data: notification });
  } catch (error) {
    next(error);
  }
};

export const getUnreadNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const notifications = await notificationService.getUnreadNotifications(
      String(userId)
    );
    res.json({ status: "success", data: notifications });
  } catch (error) {
    next(error);
  }
};

export const createNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const notification = await notificationService.createNotification(req.body);
    res.status(201).json({ status: "success", data: notification });
  } catch (error) {
    next(error);
  }
};

export const updateNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentUserId = req.user?.id;
    const userRole = req.user?.role;
    const notification = await notificationService.getNotificationById(
      req.params.id
    );

    // If customer, ensure they can only update their own notification
    if (userRole === "customer" && notification.user_id !== currentUserId) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: You can only update your own notifications",
      });
    }

    const updatedNotification = await notificationService.updateNotification(
      req.params.id,
      req.body
    );
    res.json({ status: "success", data: updatedNotification });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentUserId = req.user?.id;
    const userRole = req.user?.role;
    const notification = await notificationService.getNotificationById(
      req.params.id
    );

    // If customer, ensure they can only delete their own notification
    if (userRole === "customer" && notification.user_id !== currentUserId) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: You can only delete your own notifications",
      });
    }

    await notificationService.deleteNotification(req.params.id);
    res.json({
      status: "success",
      message: "Notification deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentUserId = req.user?.id;
    const userRole = req.user?.role;
    const notification = await notificationService.getNotificationById(
      req.params.id
    );

    // If customer, ensure they can only mark their own notification as read
    if (userRole === "customer" && notification.user_id !== currentUserId) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: You can only mark your own notifications as read",
      });
    }

    const updatedNotification = await notificationService.markAsRead(
      req.params.id
    );

    // Emit update event to customer if notification belongs to customer
    if (notification.user_id) {
      const io = (await import("../sockets")).getIO();
      io.of("/customer")
        .to(`customer:${notification.user_id}`)
        .emit("notification:update", {
          notifications: [
            {
              id: updatedNotification.id,
              is_read: true,
            },
          ],
        });
    }

    res.json({ status: "success", data: updatedNotification });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const result = await notificationService.markAllAsRead(String(userId));
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const count = await notificationService.getUnreadCount(String(userId));
    res.json({ status: "success", data: { count } });
  } catch (error) {
    next(error);
  }
};

export const getNotificationStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await notificationService.getNotificationStats();
    res.json({ status: "success", data: stats });
  } catch (error) {
    next(error);
  }
};

export const getRecentNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { limit = 20 } = req.query;
    const notifications = await notificationService.getRecentNotifications(
      Number(limit)
    );
    res.json({ status: "success", data: notifications });
  } catch (error) {
    next(error);
  }
};

export const deleteOldNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { days_old = 30 } = req.body;
    const deletedCount = await notificationService.deleteOldNotifications(
      Number(days_old)
    );
    res.json({ status: "success", data: { deleted_count: deletedCount } });
  } catch (error) {
    next(error);
  }
};

export const getNotificationsByType = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type } = req.params;
    const { limit = 50 } = req.query;
    const notifications = await notificationService.getNotificationsByType(
      type,
      Number(limit)
    );
    res.json({ status: "success", data: notifications });
  } catch (error) {
    next(error);
  }
};
