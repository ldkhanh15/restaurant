import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { AppError } from "./errorHandler";

// Helper to extract token from multiple common locations (header, cookie, query)
const extractToken = (req: Request): { token?: string; source?: string } => {
  // 1) Authorization header
  const authHeader = req.headers.authorization || (req.headers.Authorization as string | undefined);
  if (authHeader && typeof authHeader === 'string') {
    const m = authHeader.match(/Bearer\s+(.+)/i)
    if (m && m[1]) return { token: m[1], source: 'authorization_header' }
  }

  // Common alternative header used by some clients
  const xAccess = (req.headers['x-access-token'] || req.headers['X-Access-Token']) as string | undefined
  if (xAccess && typeof xAccess === 'string') {
    return { token: xAccess, source: 'x-access-token_header' }
  }

  // 2) Cookies (if cookie-parser is used)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyReq = req as any
  if (anyReq.cookies) {
    if (anyReq.cookies.token) return { token: anyReq.cookies.token, source: 'cookie:token' }
    if (anyReq.cookies.access_token) return { token: anyReq.cookies.access_token, source: 'cookie:access_token' }
  }

  // 3) Query params
  if (anyReq.query) {
    if (anyReq.query.access_token) return { token: String(anyReq.query.access_token), source: 'query:access_token' }
    if (anyReq.query.token) return { token: String(anyReq.query.token), source: 'query:token' }
  }

  return {}
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, source } = extractToken(req)
    if (!token) {
      throw new AppError("No token provided", 401);
    }

    // Dev debug: log token source and a masked prefix so we can correlate logs
    if (process.env.NODE_ENV !== 'production') {
      try {
        const masked = token ? `${token.substr(0, 8)}...len=${token.length}` : 'empty'
        console.debug('[auth] authenticate token from', source || 'unknown', masked)
      } catch (e) { /* ignore logging failures */ }
    }
    const decoded = verifyToken(token);

    ;(req as any).user = decoded;
    next();
  } catch (error) {
    // In development include the original error message to help debugging
    if (process.env.NODE_ENV !== 'production') {
      try {
        const maybeMessage = (err: any) => (err && (err.message || String(err)))
        console.debug('[auth] token verify error:', maybeMessage(error))
      } catch (e) {}
    }
    next(new AppError("Invalid or expired token", 401));
  }
};

// Optional authentication: if token present and valid, attach req.user; otherwise continue as guest
export const authenticateOptional = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, source } = extractToken(req)
    if (!token) return next() // no token: continue as guest

    if (process.env.NODE_ENV !== 'production') {
      try { console.debug('[auth] authenticateOptional token present from', source || 'unknown', 'len=', token.length) } catch(e) {}
    }
    const decoded = verifyToken(token);
    ;(req as any).user = decoded;
    return next();
  } catch (error) {
    // invalid token: treat as guest (don't block)
    if (process.env.NODE_ENV !== 'production') {
      try {
        const maybeMessage = (err: any) => (err && (err.message || String(err)))
        console.debug('[auth] authenticateOptional invalid token:', maybeMessage(error))
      } catch(e) {}
    }
    return next();
  }
};

export const authorize = (
  ...roles: Array<"customer" | "employee" | "admin">
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user
    if (!user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!roles.includes(user.role)) {
      return next(new AppError("Insufficient permissions", 403));
    }
    next();
  };
};
