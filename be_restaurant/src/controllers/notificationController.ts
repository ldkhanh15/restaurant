import type { Request, Response, NextFunction } from "express"
import notificationService from "../services/notificationService"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"

export const getAllNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(req.query)
    const offset = (page - 1) * limit

    const { rows, count } = await notificationService.findAllWithUser({
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    })

    const result = buildPaginationResult(rows, count, page, limit)
    res.json({ status: "success", data: result })
  } catch (error) {
    next(error)
  }
}

export const getUnreadNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" })
    }
    const notifications = await notificationService.findUnreadByUser(userId)
    res.json({ status: "success", data: notifications })
  } catch (error) {
    next(error)
  }
}

export const getNotificationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = await notificationService.findById(Number(req.params.id))
    res.json({ status: "success", data: notification })
  } catch (error) {
    next(error)
  }
}

export const createNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = await notificationService.create(req.body)
    res.status(201).json({ status: "success", data: notification })
  } catch (error) {
    next(error)
  }
}

export const updateNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = await notificationService.update(Number(req.params.id), req.body)
    res.json({ status: "success", data: notification })
  } catch (error) {
    next(error)
  }
}

export const deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationService.delete(Number(req.params.id))
    res.json({ status: "success", message: "Notification deleted successfully" })
  } catch (error) {
    next(error)
  }
}
