import { Router } from "express"
import {
  // getAllOrders, // This is for admin, we'll use getOrdersByUser instead for the app user
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrdersByUser,
  getOrdersByStatus,
  getOrderDetails,
  updateOrderStatus,
  sendOrderToKitchen,
  processOrderPayment,
} from "../controllers/order_app_userController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

router.use(authenticate) // All routes below this require authentication

router.get("/", getOrdersByUser) // Get orders for the logged-in user
router.post("/", createOrder)

router.get("/status/:status", getOrdersByStatus)
router.get("/:id", getOrderById)
router.put("/:id", updateOrder)
router.patch("/:id/send-to-kitchen", sendOrderToKitchen)
router.patch("/:id/payment", processOrderPayment) // New route for processing payment
router.delete("/:id", deleteOrder)

export default router
