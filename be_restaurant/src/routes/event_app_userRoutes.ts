import { Router } from "express"
import * as eventAppUserController from "../controllers/event_app_userController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

router.get("/", eventAppUserController.getAllEvents)
router.get("/upcoming", eventAppUserController.getUpcomingEvents)
router.get("/past", eventAppUserController.getPastEvents) // Route mới để lấy sự kiện đã qua
router.get("/:id", eventAppUserController.getEventById)

// Nested event bookings routes: GET listings for an event (admin) and POST create booking (authenticated users)
router.get("/:eventId/bookings", authorize("admin"), eventAppUserController.getEventBookingsForEvent)
router.post("/:eventId/bookings", authenticate, eventAppUserController.createEventBookingForEvent)

router.use(authenticate)

router.post("/", authorize("admin"), eventAppUserController.createEvent)
router.put("/:id", authorize("admin"), eventAppUserController.updateEvent)
router.delete("/:id", authorize("admin"), eventAppUserController.deleteEvent)

export default router
