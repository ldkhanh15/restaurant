import { Router } from "express"
import * as eventController from "../controllers/eventController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

router.get("/", eventController.getAllEvents)
router.get("/:id", eventController.getEventById)
router.post("/", eventController.createEvent)
router.put("/:id", eventController.updateEvent)
router.delete("/:id", eventController.deleteEvent)

// router.use(authenticate)

// router.post("/", authorize("admin"), eventController.createEvent)
// router.put("/:id", authorize("admin"), eventController.updateEvent)
// router.delete("/:id", authorize("admin"), eventController.deleteEvent)

export default router
