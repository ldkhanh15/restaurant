import { Router } from "express"
import * as notificationAppUserController from "../controllers/notification_app_userController"
import { authenticate } from "../middlewares/auth"

const router = Router()

// Tất cả các route bên dưới đều yêu cầu người dùng phải đăng nhập
router.use(authenticate)

// Lấy danh sách thông báo của người dùng (có phân trang)
router.get("/", notificationAppUserController.getUserNotifications)
// Lấy số lượng thông báo chưa đọc
router.get("/unread-count", notificationAppUserController.getUnreadCount)
// Đánh dấu tất cả là đã đọc
router.post("/read-all", notificationAppUserController.markAllNotificationsAsRead)
// Đánh dấu một thông báo là đã đọc
router.put("/:id/read", notificationAppUserController.markNotificationAsRead)
// Xóa một thông báo
router.delete("/:id", notificationAppUserController.deleteNotificationForUser)

export default router
