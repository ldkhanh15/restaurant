import { Request, Response, NextFunction } from "express";
import { createErrorResponse } from "./responseFormat";

export type UserRole = "admin" | "employee" | "customer";

export interface AuthenticatedUser {
  sub: string;
  role: UserRole;
  [key: string]: any;
}

export function authorize(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthenticatedUser;
    
    if (!user) {
      return res.status(401).json(createErrorResponse("Unauthorized", 401));
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json(createErrorResponse("Forbidden: Insufficient permissions", 403));
    }

    next();
  };
}

export function isOwnerOrAdmin(userId: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthenticatedUser;
    
    if (!user) {
      return res.status(401).json(createErrorResponse("Unauthorized", 401));
    }

    // Admin can access everything
    if (user.role === "admin") {
      return next();
    }

    // Employee can access everything
    if (user.role === "employee") {
      return next();
    }

    // Customer can only access their own resources
    if (user.role === "customer" && user.sub === userId) {
      return next();
    }

    return res.status(403).json(createErrorResponse("Forbidden: Can only access your own resources", 403));
  };
}
