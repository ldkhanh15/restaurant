
// Lightweight augmentation for Express Request to include authenticated user.
// Keep the shape small to avoid importing runtime modules from a declaration file.
declare global {
  namespace Express {
    interface Request {
      /** Authenticated user payload attached by auth middleware */
      user?: {
        id: string;
        email?: string;
        role?: "customer" | "employee" | "admin";
      };
    }
  }
}

export {};
// src/types/express.d.ts
import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface User extends JwtPayload {
      id: string;
      role: "admin" | "employee" | "customer";
      [key: string]: any;
    }

    interface Request {
      user?: User;
    }
  }
}
