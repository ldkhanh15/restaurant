import { Router } from "express"
import { getAllUsers, getUserById, updateUser, deleteUser } from "../controllers/userController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

router.get("/", authenticate, authorize("admin"), getAllUsers)
router.get("/:id", authenticate, getUserById)
router.put("/:id", authenticate, updateUser)
router.delete("/:id", authenticate, authorize("admin"), deleteUser)

export default router
