import { Router } from "express"
import * as chatSessionController from "../controllers/chatSession_app_userController"
import { authenticateOptional } from "../middlewares/auth"

const router = Router()

router.use(authenticateOptional)

router.get("/", chatSessionController.getAllChatSessions)
router.get("/:id", chatSessionController.getChatSessionById)
router.post("/", chatSessionController.createChatSession)
router.put("/:id", chatSessionController.updateChatSession)
router.delete("/:id", chatSessionController.deleteChatSession)

export default router
