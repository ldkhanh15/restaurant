import type { Request, Response, NextFunction } from "express";
import User from "../models/User";
import { AppError } from "../middlewares/errorHandler";
import {
  getPaginationParams,
  buildPaginationResult,
} from "../utils/pagination";
import { Op, Sequelize } from "sequelize";

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
   try {
    const {
      page = 1,
      limit = 10,
      sortBy = "created_at",
      sortOrder = "DESC",
    } = getPaginationParams(req.query);

    const { role } = req.query as { role?: string };
    const { unassigned } = req.query as { unassigned?: string };
    const offset = (page - 1) * limit;

    // Xây dựng điều kiện where
    const whereClause: any = {};
    if (role) {
      whereClause.role = role;
    }

    // Nếu có unassigned=true → lấy user chưa có trong bảng employees
    if (unassigned === "true") {
      whereClause.id = {
        [Op.notIn]: Sequelize.literal("(SELECT user_id FROM employees WHERE user_id IS NOT NULL)"),
      };
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      // attributes: { exclude: ["password_hash"] },
    });

    const result = buildPaginationResult(rows, count, page, limit);
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Sử dụng findById, phương thức này cũng hỗ trợ options
    const user = await userService.findById(req.params.id, {
      attributes: { exclude: ["password_hash"] },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.json({ status: "success", data: user });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    await user.update(req.body);

    res.json({ status: "success", data: user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    await user.destroy();

    res.json({ status: "success", message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};
