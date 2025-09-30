import { Router } from "express"
import * as notificationController from "../controllers/notificationController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

router.use(authenticate)

router.get("/", notificationController.getAllNotifications)
router.get("/unread", notificationController.getUnreadNotifications)
router.get("/:id", notificationController.getNotificationById)
router.post("/", authorize("admin"), notificationController.createNotification)
router.put("/:id", notificationController.updateNotification)
router.delete("/:id", notificationController.deleteNotification)

export default router
