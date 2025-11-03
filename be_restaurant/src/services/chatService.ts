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
  closeSession as repoCloseSession,
  reopenSession as repoReopenSession,
  getOrCreateUserSession,
  getActiveUserSession,
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

// Get or create session for user - ensures only one active session per user
export const getUserSession = async (userId: string) => {
  return getOrCreateUserSession(userId);
};

// Get active session for user
export const getActiveSession = async (userId: string) => {
  return getActiveUserSession(userId);
};

export const listUserSessions = async (
  userId: string,
  page: number = 1,
  limit: number = 10
) => {
  return getSessionsByUser(userId, page, limit);
};

export const listAllSessions = async (
  page: number,
  limit: number,
  filters?: {
    customer_name?: string;
    status?: string;
    sort_by?: "start_time" | "last_message";
    sort_order?: "ASC" | "DESC";
  }
) => {
  return getAllSessions({
    page,
    limit,
    ...(filters || {}),
  });
};

export const listMessages = async (
  sessionId: string,
  page: number = 1,
  limit: number = 50
) => {
  return getMessagesBySession(sessionId, page, limit);
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
  userId?: string,
  token?: string
) => {
  // Persist message
  const saved = await addMessage({
    sessionId,
    senderType,
    messageText,
    senderId: userId,
  });

  // Get session to get user_id for customer notification
  const session = await getSessionById(sessionId);
  const sessionUserId = session?.get("user_id") as string | undefined;

  // Format message data for WebSocket
  const messageData = {
    id: saved.id,
    session_id: sessionId,
    sender_type: senderType,
    sender_id: userId || null,
    message_text: messageText,
    timestamp: (saved as any).timestamp || new Date().toISOString(),
  };

  // Emit to chat namespace (legacy support)
  io.of("/chat").to(`session_${sessionId}`).emit("messageReceived", saved);
  io.of("/chat")
    .to(`session_${sessionId}`)
    .emit("chat:new_message", messageData);

  // Emit to admin namespace (for admin panel)
  io.of("/admin").emit("admin:chat:new_message", {
    sessionId,
    message: messageData,
  });

  // Emit to customer namespace (for user web/app)
  if (sessionUserId) {
    io.of("/customer")
      .to(`customer_chat:${sessionUserId}`)
      .emit("chat:new_message", messageData);
    io.to(`customer:${sessionUserId}`).emit("chat:new_message", messageData);
  }

  // If chatbot enabled and message from user, request bot reply
  if (
    session &&
    session.get("bot_enabled") &&
    senderType === "user" &&
    messageText &&
    messageText.trim().length > 0
  ) {
    try {
      // Use token passed as parameter (from controller or socket)

      const resp = await axios.post(
        `${CHATBOT_URL}/generate`,
        {
          message: messageText,
          session_id: sessionId,
          user_id: userId || sessionUserId || "anonymous",
          token: token, // Pass token for authenticated API calls
        },
        { timeout: 10000 }
      );
      const botText: string = resp.data?.response || "";
      if (botText && botText.trim()) {
        const botMsg = await addMessage({
          sessionId,
          senderType: "bot",
          messageText: botText,
          status: "sent",
        });

        const botMessageData = {
          id: botMsg.id,
          session_id: sessionId,
          sender_type: "bot",
          sender_id: null,
          message_text: botText,
          timestamp: (botMsg as any).timestamp || new Date().toISOString(),
        };

        // Emit bot message to all namespaces
        io.of("/chat")
          .to(`session_${sessionId}`)
          .emit("messageReceived", botMsg);
        io.of("/chat")
          .to(`session_${sessionId}`)
          .emit("chat:new_message", botMessageData);

        // Emit to admin namespace
        io.of("/admin").emit("admin:chat:new_message", {
          sessionId,
          message: botMessageData,
        });

        // Emit to customer namespace
        if (sessionUserId) {
          io.of("/customer")
            .to(`customer_chat:${sessionUserId}`)
            .emit("chat:new_message", botMessageData);
          io.to(`customer:${sessionUserId}`).emit(
            "chat:new_message",
            botMessageData
          );
        }
      }
    } catch (err) {
      // Swallow chatbot errors, still return user message
      console.error("Chatbot error:", err);
    }
  }

  return saved;
};

export const closeChatSession = async (sessionId: string) => {
  return repoCloseSession(sessionId);
};

export const reopenChatSession = async (sessionId: string) => {
  return repoReopenSession(sessionId);
};

export const markMessagesAsRead = async (
  sessionId: string,
  messageIds?: string[]
) => {
  const { markMessagesRead } = await import("../repositories/chatRepository");
  return markMessagesRead(sessionId, messageIds);
};
