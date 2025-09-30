import { Router } from "express"
import * as chatSessionController from "../controllers/chatSessionController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

router.use(authenticate)

router.get("/", authorize("admin", "employee"), chatSessionController.getAllChatSessions)
router.get("/:id", chatSessionController.getChatSessionById)
router.post("/", chatSessionController.createChatSession)
router.put("/:id", chatSessionController.updateChatSession)
router.delete("/:id", chatSessionController.deleteChatSession)

export default router
