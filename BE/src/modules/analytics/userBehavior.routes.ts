import { Router } from "express";
import { UserBehaviorController } from "./userBehavior.controller";

const router = Router();

router.get("/", UserBehaviorController.list);
router.post("/", UserBehaviorController.logBehavior);
router.get("/user/:userId", UserBehaviorController.getUserBehavior);
router.get("/analytics/actions", UserBehaviorController.getActionAnalytics);

export default router;
