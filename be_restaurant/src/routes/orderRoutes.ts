import { Router } from "express"
import { getAllOrders, getOrderById, createOrder, updateOrder, deleteOrder } from "../controllers/orderController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

router.get("/", authenticate, authorize("admin", "employee"), getAllOrders)
router.get("/:id", authenticate, getOrderById)
router.post("/", authenticate, createOrder)
router.put("/:id", authenticate, updateOrder)
router.delete("/:id", authenticate, authorize("admin"), deleteOrder)

export default router
