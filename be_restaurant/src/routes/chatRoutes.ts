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
  closeSessionById,
  reopenSessionById,
  markRead,
  getActiveUserSession,
} from "../controllers/chatController";
import { query } from "express-validator";
import { validate } from "../middlewares/validator";

const router = Router();

// Create new session
router.post("/session", authenticate, createSession);

// List sessions by current user
router.get("/sessions", authenticate, getSessions);

// Get active session for current user
router.get("/user/session/active", authenticate, getActiveUserSession);

// List all sessions by admin
router.get(
  "/sessions/all",
  authenticate,
  authorize("admin"),
  [
    query("page").optional().isString(),
    query("limit").optional().isString(),
    validate,
  ],
  getAllSessions
);

// Get messages in a session
router.get("/sessions/:id/messages", authenticate, getMessages);

// Post a new message
router.post("/sessions/:id/messages", authenticate, postMessage);

// Mark messages as read (all or specific IDs)
router.post("/sessions/:id/messages/read", authenticate, markRead);

// Enable/Disable chatbot mode
router.post("/sessions/:id/enable-bot", authenticate, enableBotMode);
router.post("/sessions/:id/disable-bot", authenticate, disableBotMode);

// Close/Reopen a session
router.post(
  "/sessions/:id/close",
  authenticate,
  authorize("admin"),
  closeSessionById
);
router.post(
  "/sessions/:id/reopen",
  authenticate,
  authorize("admin"),
  reopenSessionById
);

export default router;
