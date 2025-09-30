import { Router } from "express";
import { ComplaintController } from "./complaint.controller";

const router = Router();

router.get("/", ComplaintController.list);
router.get("/:id", ComplaintController.get);
router.post("/", ComplaintController.create);
router.put("/:id", ComplaintController.update);
router.put("/:id/status", ComplaintController.updateStatus);
router.put("/:id/assign", ComplaintController.assign);
router.post("/:id/response", ComplaintController.addResponse);
router.get("/user/:userId", ComplaintController.getUserComplaints);

export default router;
