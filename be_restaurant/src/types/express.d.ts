declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        role: "customer" | "employee" | "admin"
        email: string
      }
    }
  }
}
