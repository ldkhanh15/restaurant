import type { Request, Response, NextFunction } from "express"
import userAppUserService from "../services/user_app_userService"
import { AppError } from "../middlewares/errorHandler"

/**
 * Lấy thông tin cá nhân của người dùng đang đăng nhập.
 */
export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.user?.id)
    if (!userId) {
      throw new AppError("Unauthorized", 401)
    }

    const user = await userAppUserService.findById(userId, {
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

/**
 * Cập nhật thông tin cá nhân của người dùng đang đăng nhập.
 */
export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.user?.id)
    if (!userId) {
      throw new AppError("Unauthorized", 401)
    }

    const user = await userAppUserService.findById(userId)
    if (!user) {
      throw new AppError("User not found", 404)
    }

    const updatedUser = await userAppUserService.update(userId, req.body)

    // Loại bỏ mật khẩu khỏi dữ liệu trả về
    if (updatedUser) (updatedUser as any).password_hash = undefined

    res.json({ status: "success", data: updatedUser })
  } catch (error) {
    next(error)
  }
}
