import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

export interface ApiResponse<T = any> {
  meta: {
    timestamp: string;
    requestId: string;
    paging?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  error: null | {
    message: string;
    details?: any;
  };
  code: number;
  data: T | null;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  total: number;
}

export function createSuccessResponse<T>(
  data: T,
  code: number = 200,
  pagination?: PaginationOptions
): ApiResponse<T> {
  const response: ApiResponse<T> = {
    meta: {
      timestamp: new Date().toISOString(),
      requestId: uuidv4(),
    },
    error: null,
    code,
    data,
  };

  if (pagination) {
    response.meta.paging = {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: Math.ceil(pagination.total / pagination.limit),
    };
  }

  return response;
}

export function createErrorResponse(
  message: string,
  code: number = 400,
  details?: any
): ApiResponse<null> {
  return {
    meta: {
      timestamp: new Date().toISOString(),
      requestId: uuidv4(),
    },
    error: {
      message,
      details,
    },
    code,
    data: null,
  };
}

export function responseFormatMiddleware(req: Request, res: Response, next: NextFunction) {
  // Override res.json to use our format
  const originalJson = res.json;
  
  res.json = function(body: any) {
    // If response already has our format, use it as is
    if (body && typeof body === "object" && body.meta && body.error !== undefined && body.code !== undefined) {
      return originalJson.call(this, body);
    }

    // Otherwise, wrap in our format
    const formattedResponse = createSuccessResponse(body, res.statusCode);
    return originalJson.call(this, formattedResponse);
  };

  next();
}
