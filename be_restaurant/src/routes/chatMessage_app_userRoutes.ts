import { Router } from "express"
import * as chatMessageController from "../controllers/chatMessage_app_userController"
import { authenticateOptional } from "../middlewares/auth"

const router = Router()

router.use(authenticateOptional)

router.get("/session/:sessionId", chatMessageController.getMessagesBySession)
router.get("/:id", chatMessageController.getChatMessageById)
router.post("/", chatMessageController.createChatMessage)
router.put("/:id", chatMessageController.updateChatMessage)
router.delete("/:id", chatMessageController.deleteChatMessage)

export default router
