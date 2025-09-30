import type { Request, Response, NextFunction } from "express"
import User from "../models/User"
import { AppError } from "../middlewares/errorHandler"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(req.query)
    const offset = (page - 1) * limit

    const { count, rows } = await User.findAndCountAll({
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      attributes: { exclude: ["password_hash"] },
    })

    const result = buildPaginationResult(rows, count, page, limit)
    res.json({ status: "success", data: result })
  } catch (error) {
    next(error)
  }
}

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password_hash"] },
    })

    if (!user) {
      throw new AppError("User not found", 404)
    }

    res.json({ status: "success", data: user })
  } catch (error) {
    next(error)
  }
}

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.params.id)

    if (!user) {
      throw new AppError("User not found", 404)
    }

    await user.update(req.body)

    res.json({ status: "success", data: user })
  } catch (error) {
    next(error)
  }
}

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.params.id)

    if (!user) {
      throw new AppError("User not found", 404)
    }

    await user.destroy()

    res.json({ status: "success", message: "User deleted successfully" })
  } catch (error) {
    next(error)
  }
}
