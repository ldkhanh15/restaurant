import { Request, Response } from "express";
import { NotificationService } from "./notification.service";

export const NotificationController = {
  async list(req: Request, res: Response) {
    try {
      const data = await NotificationService.list(req.params.userId, req.query);
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async get(req: Request, res: Response) {
    try {
      const data = await NotificationService.get(req.params.id);
      if (!data)
        return res.status(404).json({ message: "Notification not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async markAsRead(req: Request, res: Response) {
    try {
      const data = await NotificationService.markAsRead(req.params.id);
      if (!data)
        return res.status(404).json({ message: "Notification not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async markAllAsRead(req: Request, res: Response) {
    try {
      const data = await NotificationService.markAllAsRead(req.params.userId);
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const ok = await NotificationService.delete(req.params.id);
      if (!ok)
        return res.status(404).json({ message: "Notification not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async deleteAllRead(req: Request, res: Response) {
    try {
      await NotificationService.deleteAllRead(req.params.userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },
};
