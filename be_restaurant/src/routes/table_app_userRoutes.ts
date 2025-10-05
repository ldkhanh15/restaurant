import { Router } from "express"
import { getTables_app_user, getAvailableTables_app_user } from "../controllers/table_app_userController"

const router = Router()

router.get("/", getTables_app_user)
router.get("/available", getAvailableTables_app_user)

export default router
