import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import {
  createSession,
  disableBotMode,
  enableBotMode,
  getMessages,
  getSessions,
  postMessage,
} from "../controllers/chatController";

const router = Router();

// Create new session
router.post("/session", authenticate, createSession);

// List sessions by current user
router.get("/sessions", authenticate, getSessions);

// Get messages in a session
router.get("/sessions/:id/messages", authenticate, getMessages);

// Post a new message
router.post("/sessions/:id/messages", authenticate, postMessage);

// Enable/Disable chatbot mode
router.post("/sessions/:id/enable-bot", authenticate, enableBotMode);
router.post("/sessions/:id/disable-bot", authenticate, disableBotMode);

export default router;
