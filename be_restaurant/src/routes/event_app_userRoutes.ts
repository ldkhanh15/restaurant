import { Router } from "express"
import * as eventAppUserController from "../controllers/event_app_userController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

router.get("/", eventAppUserController.getAllEvents)
router.get("/upcoming", eventAppUserController.getUpcomingEvents)
router.get("/past", eventAppUserController.getPastEvents) // Route mới để lấy sự kiện đã qua
router.get("/:id", eventAppUserController.getEventById)

router.use(authenticate)

router.post("/", authorize("admin"), eventAppUserController.createEvent)
router.put("/:id", authorize("admin"), eventAppUserController.updateEvent)
router.delete("/:id", authorize("admin"), eventAppUserController.deleteEvent)

export default router
