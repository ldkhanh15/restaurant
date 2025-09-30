import { Request, Response } from "express";
import { UserBehaviorLogService } from "./userBehavior.service";

export const UserBehaviorController = {
  async list(req: Request, res: Response) {
    try {
      const data = await UserBehaviorLogService.list(req.query);
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async logBehavior(req: Request, res: Response) {
    try {
      const data = await UserBehaviorLogService.logBehavior(req.body);
      res.status(201).json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async getUserBehavior(req: Request, res: Response) {
    try {
      const data = await UserBehaviorLogService.getUserBehavior(
        req.params.userId
      );
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async getActionAnalytics(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await UserBehaviorLogService.getActionAnalytics(
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },
};
