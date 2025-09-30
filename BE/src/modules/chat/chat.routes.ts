import { Router } from "express";
import { ChatController } from "./chat.controller";

const router = Router();

// Chat session routes
router.get("/sessions", ChatController.listSessions);
router.get("/sessions/:id", ChatController.getSession);
router.post("/sessions", ChatController.createSession);
router.put("/sessions/:id", ChatController.updateSession);
router.post("/sessions/:id/close", ChatController.closeSession);

// Chat message routes
router.get("/sessions/:id/messages", ChatController.getMessages);
router.post("/sessions/:id/messages", ChatController.addMessage);

export default router;
