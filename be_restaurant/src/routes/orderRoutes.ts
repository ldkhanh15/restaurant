import { Router } from "express"
import { getAllOrders, getOrderById, createOrder, updateOrder, deleteOrder, getOrdersByUser, getOrdersByStatus, getOrderDetails, updateOrderStatus } from "../controllers/orderController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

router.get("/", authenticate, authorize("admin", "employee"), getAllOrders)
router.get("/user/:userId", authenticate, getOrdersByUser)
router.get("/status/:status", authenticate, getOrdersByStatus)
router.get("/:id/details", authenticate, getOrderDetails)
router.get("/:id", authenticate, getOrderById)
router.post("/", authenticate, createOrder)
router.put("/:id/status", authenticate, updateOrderStatus)
router.put("/:id", authenticate, updateOrder)
router.delete("/:id", authenticate, authorize("admin"), deleteOrder)

export default router
