// src/types/express.d.ts
import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface User extends JwtPayload {
      id: number;
      role: "admin" | "employee" | "customer";
      [key: string]: any;
    }

    interface Request {
      user?: User;
    }
  }
}
