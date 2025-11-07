import { Router } from "express"
import { 
  getDashboardStats, 
  getRevenueStats, 
  getDailyOrdersStats, 
  getPopularDishes, 
  getRecentOrders,
  getHourlyRevenueStats,
  getPeakHoursStats
} from "../controllers/dashboardController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

// Tất cả dashboard endpoints đều cần authentication và admin/employee role
router.use(authenticate)
router.use(authorize("admin", "employee"))

// Dashboard statistics endpoints
router.get("/stats", getDashboardStats)
router.get("/revenue", getRevenueStats)
router.get("/orders/daily", getDailyOrdersStats)
router.get("/orders/recent", getRecentOrders)
router.get("/orders/hourly-revenue", getHourlyRevenueStats)
router.get("/orders/peak-hours", getPeakHoursStats)
router.get("/dishes/popular", getPopularDishes)

export default router