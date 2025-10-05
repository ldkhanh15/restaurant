import { Router } from "express"
import * as chatMessageController from "../controllers/chatMessageController"
import { authenticate } from "../middlewares/auth"
import { body, param } from "express-validator"
import { validate } from "../middlewares/validator"

const router = Router()

router.use(authenticate)

router.get("/session/:sessionId", chatMessageController.getMessagesBySession)
router.get("/:id", chatMessageController.getChatMessageById)
router.post(
    "/",
    [
        body("session_id").isUUID().withMessage("session_id is required"),
        body("sender_type").isIn(["user", "bot", "human"]).withMessage("invalid sender_type"),
        body("message_text").isLength({ min: 1 }).withMessage("message required"),
        validate,
    ],
    chatMessageController.createChatMessage,
)
router.put("/:id", chatMessageController.updateChatMessage)
router.delete("/:id", chatMessageController.deleteChatMessage)

export default router
