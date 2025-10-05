import { Router } from "express"
import { getMenuItems_app_user } from "../controllers/menu_app_userController"

const router = Router()

router.get("/", getMenuItems_app_user)

export default router
