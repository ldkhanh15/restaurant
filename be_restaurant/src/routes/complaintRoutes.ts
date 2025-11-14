import { Router } from "express";
import * as complaintController from "../controllers/complaintController";
import { body } from "express-validator";
import { validate } from "../middlewares/validator";
import { authenticate, authorize } from "../middlewares/auth";

const router = Router();

// router.use(authenticate)

router.get("/", complaintController.getAllComplaints);
router.get(
  "/:id",
  authorize("admin", "employee"),
  complaintController.getComplaintById
);
router.post(
  "/",
  [
    body("description").notEmpty().withMessage("description is required"),
    body("order_id")
      .optional({ nullable: true })
      .isString()
      .withMessage("order_id must be UUID"),
    body("order_item_id")
      .optional({ nullable: true })
      .isString()
      .withMessage("order_item_id must be UUID"),
    validate,
  ],
  complaintController.createComplaint
);
router.put(
  "/:id",
  // authorize("admin", "employee"),
  [
    body("status")
      .optional()
      .isIn(["pending", "approved", "rejected"])
      .withMessage("invalid status"),
    validate,
  ],
  complaintController.updateComplaint
);
router.delete("/:id", authorize("admin"), complaintController.deleteComplaint);

export default router;
