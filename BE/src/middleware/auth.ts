import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    try {
        const payload = verifyToken(token);
        (req as any).user = payload;
        next();
    } catch (e) {
        return res.status(401).json({ message: "Invalid token" });
    }
} 