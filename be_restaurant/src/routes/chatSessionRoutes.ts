import { Router } from "express"
import * as chatSessionController from "../controllers/chatSessionController"
import { authenticate, authorize } from "../middlewares/auth"
import { body } from "express-validator"
import { validate } from "../middlewares/validator"

const router = Router()

router.use(authenticate)

router.get("/", authorize("admin", "employee"), chatSessionController.getAllChatSessions)
router.get("/:id", chatSessionController.getChatSessionById)
router.post(
    "/",
    [body("device_id").optional().isString(), body("name").optional().isString(), validate],
    chatSessionController.createChatSession,
)
router.put("/:id", chatSessionController.updateChatSession)
router.delete("/:id", chatSessionController.deleteChatSession)

export default router
