import type { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.error(
      `${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method}`
    );
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  logger.error(`500 - ${err.message}\n${req.originalUrl}\n${req.method}`, {
    stack: err.stack,
  });
  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} not found`,
  });
};
