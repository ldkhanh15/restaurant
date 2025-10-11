import { Router } from "express"
import { getAllUsers, getUserById, updateUser, deleteUser } from "../controllers/userController"
import { getMe, updateMe } from "../controllers/user_app_userController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

router.use(authenticate) // Tất cả các route bên dưới đều yêu cầu đăng nhập

// Routes cho người dùng tự quản lý thông tin
router.get("/me", getMe)
router.put("/me", updateMe)

// Routes cho admin quản lý người dùng
router.get("/", authorize("admin"), getAllUsers)
router.get("/:id", authorize("admin"), getUserById) // Chỉ admin mới được xem thông tin người dùng khác
router.put("/:id", authorize("admin"), updateUser) // Chỉ admin mới được sửa thông tin người dùng khác
router.delete("/:id", authorize("admin"), deleteUser)

export default router
