import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import logger from "./config/logger"
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler"

// Import routes
import authRoutes from "./routes/authRoutes"
import userRoutes from "./routes/userRoutes"
import dishRoutes from "./routes/dishRoutes"
import orderRoutes from "./routes/orderRoutes"
import employeeRoutes from "./routes/employeeRoutes"
import categoryDishRoutes from "./routes/categoryDishRoutes"
import ingredientRoutes from "./routes/ingredientRoutes"
import supplierRoutes from "./routes/supplierRoutes"
import tableRoutes from "./routes/tableRoutes"
import reservationRoutes from "./routes/reservationRoutes"
import reviewRoutes from "./routes/reviewRoutes"
import eventRoutes from "./routes/eventRoutes"
import voucherRoutes from "./routes/voucherRoutes"
import employeeShiftRoutes from "./routes/employeeShiftRoutes"
import attendanceLogRoutes from "./routes/attendanceLogRoutes"
import payrollRoutes from "./routes/payrollRoutes"
import complaintRoutes from "./routes/complaintRoutes"
import notificationRoutes from "./routes/notificationRoutes"
import blogPostRoutes from "./routes/blogPostRoutes"
import chatSessionRoutes from "./routes/chatSessionRoutes"
import chatMessageRoutes from "./routes/chatMessageRoutes"
import menuAppUserRoutes from "./routes/menu_app_userRoutes"
import tableAppUserRoutes from "./routes/table_app_userRoutes"
import reservationAppUserRoutes from "./routes/reservation_app_userRoutes"

// Import models to initialize associations
import "./models/index"

dotenv.config()

const app = express()

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`)
  next()
})

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/dishes", dishRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/employees", employeeRoutes)
app.use("/api/categories", categoryDishRoutes)
app.use("/api/ingredients", ingredientRoutes)
app.use("/api/suppliers", supplierRoutes)
app.use("/api/tables", tableRoutes)
app.use("/api/reservations", reservationRoutes)
app.use("/api/reviews", reviewRoutes)
app.use("/api/events", eventRoutes)
app.use("/api/vouchers", voucherRoutes)
app.use("/api/shifts", employeeShiftRoutes)
app.use("/api/attendance", attendanceLogRoutes)
app.use("/api/payroll", payrollRoutes)
app.use("/api/complaints", complaintRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/blog", blogPostRoutes)
app.use("/api/chat/sessions", chatSessionRoutes)
app.use("/api/chat/messages", chatMessageRoutes)

// App user lightweight endpoints (mobile app)
app.use("/api/app_user/menu", menuAppUserRoutes)
app.use("/api/app_user/tables", tableAppUserRoutes)
app.use("/api/app_user/reservations", reservationAppUserRoutes)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

export default app
