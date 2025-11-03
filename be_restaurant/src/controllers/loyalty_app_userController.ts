import type { Request, Response, NextFunction } from "express";
import loyaltyService from "../services/loyalty_app_userService";
import User from "../models/User";
import { AppError } from "../middlewares/errorHandler";

export const getMyLoyalty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) throw new AppError("Not authenticated", 401);
    const user = await User.findByPk(String(req.user.id));
    if (!user) throw new AppError("User not found", 404);
    res.json({ status: "success", data: { points: user.points || 0, ranking: user.ranking } });
  } catch (error) {
    next(error);
  }
};

// Allows awarding points for a specific order (authenticated users or admins)
export const awardPointsForOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { order_id } = req.body as { order_id: string };
    if (!order_id) throw new AppError("order_id is required", 400);

    // We need to load the order; rely on loyalty service to accept order-like object
    const { default: OrderModel } = await import("../models/Order");
    const order = await OrderModel.findByPk(order_id);
    if (!order) throw new AppError("Order not found", 404);

    const result = await loyaltyService.awardPointsForOrder(order);
    if (!result) return res.json({ status: "success", message: "No points awarded (maybe order has no user or 0 amount)" });

    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};
