import type { Request, Response, NextFunction } from "express"
import userService from "../services/user_app_userService"
import { AppError } from "../middlewares/errorHandler"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, sortBy = "created_at", sortOrder = "DESC" } = getPaginationParams(req.query)

    const offset = (page - 1) * limit;

    const { count, rows } = await userService.findAllUsers({
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

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sử dụng findById, phương thức này cũng hỗ trợ options
    const user = await userService.findById(req.params.id, {
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
    const user = await userService.findById(req.params.id)

    if (!user) {
      throw new AppError("User not found", 404)
    }

    // Security check: only admin or the user themselves can update
    if (req.user?.role !== "admin" && String(user.id) !== String(req.user?.id)) {
      throw new AppError("Forbidden: You can only update your own profile.", 403)
    }

    const updatedUser = await userService.update(req.params.id, req.body)

    // Exclude password hash from the response
    if (updatedUser) (updatedUser as any).password_hash = undefined

    res.json({ status: "success", data: updatedUser })
  } catch (error) {
    next(error)
  }
}

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.findById(req.params.id)

    if (!user) {
      throw new AppError("User not found", 404)
    }

    await userService.delete(req.params.id)

    res.json({ status: "success", message: "User deleted successfully" })
  } catch (error) {
    next(error)
  }
}
