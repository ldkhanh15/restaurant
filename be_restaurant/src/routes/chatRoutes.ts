import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth";
import {
  createSession,
  disableBotMode,
  enableBotMode,
  getMessages,
  getSessions,
  postMessage,
  getAllSessions,
} from "../controllers/chatController";

const router = Router();

// Create new session
router.post("/session", authenticate, createSession);

// List sessions by current user
router.get("/sessions", authenticate, getSessions);

// List all sessions by admin
router.get("/sessions/all", authorize("admin"), getAllSessions);


// Get messages in a session
router.get("/sessions/:id/messages", authenticate, getMessages);

// Post a new message
router.post("/sessions/:id/messages", authenticate, postMessage);

// Enable/Disable chatbot mode
router.post("/sessions/:id/enable-bot", authenticate, enableBotMode);
router.post("/sessions/:id/disable-bot", authenticate, disableBotMode);

export default router;
