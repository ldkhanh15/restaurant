import { Router } from "express"
import * as complaintController from "../controllers/complaintController"
import { authenticate, authorize } from "../middlewares/auth"

const router = Router()

router.use(authenticate)

router.get("/", authorize("admin", "employee"), complaintController.getAllComplaints)
router.get("/:id", authorize("admin", "employee"), complaintController.getComplaintById)
router.post("/", complaintController.createComplaint)
router.put("/:id", authorize("admin", "employee"), complaintController.updateComplaint)
router.delete("/:id", authorize("admin"), complaintController.deleteComplaint)

export default router
