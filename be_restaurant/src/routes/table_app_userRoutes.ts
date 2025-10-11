import { Router } from "express"
import {
  getTables_app_user,
  getAvailableTables_app_user,
  updateTableStatus_app_user,
} from "../controllers/table_app_userController"
import { authenticate } from "../middlewares/auth"

const router = Router()

router.get("/", getTables_app_user)
router.get("/available", getAvailableTables_app_user)
router.put("/:id/status", authenticate, updateTableStatus_app_user)

export default router
