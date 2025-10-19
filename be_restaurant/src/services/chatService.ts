import axios from "axios";
import type { Server } from "socket.io";
import {
  createSession,
  getSessionsByUser,
  getMessagesBySession,
  addMessage,
  setBotEnabled,
  getSessionById,
  getAllSessions,
} from "../repositories/chatRepository";

const CHATBOT_URL = process.env.CHATBOT_URL || "http://localhost:7860/api";

export const createChatSession = async (
  userId: string | undefined,
  channel: "web" | "app" | "zalo" = "web",
  context: any = {},
  botEnabled = true
) => {
  return createSession({ userId, channel, context, botEnabled });
};

export const listUserSessions = async (userId: string) => {
  return getSessionsByUser(userId);
};

export const listAllSessions = async () => {
  return getAllSessions();
};

export const listMessages = async (sessionId: string) => {
  return getMessagesBySession(sessionId);
};

export const enableBot = async (sessionId: string) => {
  return setBotEnabled(sessionId, true);
};

export const disableBot = async (sessionId: string) => {
  return setBotEnabled(sessionId, false);
};

export const sendMessage = async (
  io: Server,
  sessionId: string,
  senderType: "user" | "bot" | "human",
  messageText: string,
  userId?: string
) => {
  // Persist message
  const saved = await addMessage({ sessionId, senderType, messageText });
  // Emit realtime event
  io.of("/chat").to(`session_${sessionId}`).emit("message:new", saved);

  // If chatbot enabled and message from user, request bot reply
  const session = await getSessionById(sessionId);
  if (
    session &&
    session.get("bot_enabled") &&
    senderType === "user" &&
    messageText &&
    messageText.trim().length > 0
  ) {
    try {
      const resp = await axios.post(
        `${CHATBOT_URL}/generate`,
        {
          message: messageText,
          session_id: sessionId,
          user_id: userId || (session.get("user_id") as string) || "anonymous",
        },
        { timeout: 10000 }
      );
      const botText: string = resp.data?.response || "";
      if (botText && botText.trim()) {
        const botMsg = await addMessage({
          sessionId,
          senderType: "bot",
          messageText: botText,
        });
        io.of("/chat").to(`session_${sessionId}`).emit("message:new", botMsg);
      }
    } catch (err) {
      // Swallow chatbot errors, still return user message
    }
  }

  return saved;
};
