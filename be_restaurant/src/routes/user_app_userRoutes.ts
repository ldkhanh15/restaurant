import { Router } from "express"
import { getAllUsers, getUserById, updateUser, deleteUser } from "../controllers/userController"
import { getMe, updateMe } from "../controllers/user_app_userController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

router.use(authenticate) // All routes below require login

// Routes cho người dùng tự quản lý thông tin
router.get("/me", getMe)
router.put("/me", updateMe)

// GET / - If admin, return all users; otherwise return current user
router.get("/", async (req, res, next) => {
	try {
		const user = req.user
		if (!user) return next(new (require("../middlewares/errorHandler")).AppError("Authentication required", 401))

		if (user.role === "admin") {
			// delegate to controller for admin listing
			return (await import("../controllers/userController")).getAllUsers(req, res, next)
		}

		// non-admin: return current user's data
		return (await import("../controllers/user_app_userController")).getMe(req, res, next)
	} catch (err) {
		next(err)
	}
})

// Admin-only management routes
router.get("/:id", authorize("admin"), getUserById) // Chỉ admin mới được xem thông tin người dùng khác
router.put("/:id", authorize("admin"), updateUser) // Chỉ admin mới được sửa thông tin người dùng khác
router.delete("/:id", authorize("admin"), deleteUser)

export default router
