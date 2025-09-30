import type { Request, Response, NextFunction } from "express"
import User from "../models/User"
import { hashPassword, comparePassword } from "../utils/password"
import { generateToken } from "../utils/jwt"
import { AppError } from "../middlewares/errorHandler"

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password, phone, full_name, role } = req.body

    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) {
      throw new AppError("Email already registered", 400)
    }

    const password_hash = await hashPassword(password)

    const user = await User.create({
      username,
      email,
      password_hash,
      phone,
      full_name,
      role: role || "customer",
    })

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    })

    res.status(201).json({
      status: "success",
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        token,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ where: { email } })
    if (!user) {
      throw new AppError("Invalid credentials", 401)
    }

    const isPasswordValid = await comparePassword(password, user.password_hash)
    if (!isPasswordValid) {
      throw new AppError("Invalid credentials", 401)
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    })

    res.json({
      status: "success",
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        token,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const validateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      status: "success",
      data: {
        user: req.user,
      },
    })
  } catch (error) {
    next(error)
  }
}
