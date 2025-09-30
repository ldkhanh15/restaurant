import type { Request, Response, NextFunction } from "express"
import { verifyToken } from "../utils/jwt"
import { AppError } from "./errorHandler"

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("No token provided", 401)
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    req.user = decoded
    next()
  } catch (error) {
    next(new AppError("Invalid or expired token", 401))
  }
}

export const authorize = (...roles: Array<"customer" | "employee" | "admin">) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401))
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError("Insufficient permissions", 403))
    }

    next()
  }
}
