import type { Server } from "socket.io";
import ChatMessage from "../models/ChatMessage";
import ChatSession from "../models/ChatSession";
import { forwardToAdmin, forwardToCustomer, broadcastToAdmin } from "./index";

/**
 * Register Chat Socket Handlers
 * Implements namespace-based routing:
 * - Customer events → Admin namespace
 * - Admin events → Customer rooms
 */
export default function registerChatSocket(io: Server) {
  const adminNsp = io.of("/admin");
  const customerNsp = io.of("/customer");

  // ============================================
  // ADMIN NAMESPACE HANDLERS
  // ============================================
  adminNsp.on("connection", (socket) => {
    const userId = socket.data?.user?.id;
    const userRole = socket.data?.user?.role;

    if (!userId) {
      console.error("[Chat] /admin: Socket without user data");
      return;
    }

    console.log(`[Chat] /admin: Connected user=${userId} role=${userRole}`);

    // Join chat-specific rooms
    socket.on("chat:join_session", (sessionId: string) => {
      if (!sessionId) return;
      socket.join(`chat_session:${sessionId}`);
      console.log(`[Chat] /admin: ${userId} joined session:${sessionId}`);
    });

    socket.on("chat:leave_session", (sessionId: string) => {
      if (!sessionId) return;
      socket.leave(`chat_session:${sessionId}`);
      console.log(`[Chat] /admin: ${userId} left session:${sessionId}`);
    });

    // Admin sends message → save to DB → forward to customer
    socket.on(
      "chat:send_message",
      async (payload: {
        clientMessageId: string;
        sessionId: string;
        toUserId?: string;
        text?: string;
        attachments?: any[];
      }) => {
        try {
          if (!payload?.sessionId || !payload?.clientMessageId) {
            socket.emit("chat:message_ack", {
              clientMessageId: payload?.clientMessageId,
              status: "failed",
              error: "Missing sessionId or clientMessageId",
            });
            return;
          }

          // Verify session exists
          const session = await ChatSession.findByPk(payload.sessionId);
          if (!session) {
            socket.emit("chat:message_ack", {
              clientMessageId: payload.clientMessageId,
              status: "failed",
              error: "Session not found",
            });
            return;
          }

          // Save message to database
          const message = await ChatMessage.create({
            session_id: payload.sessionId,
            sender_type: "human",
            sender_id: userId,
            message_text: payload.text || "",
          });

          const messageData = {
            id: message.id,
            session_id: payload.sessionId,
            sender_type: "human",
            sender_id: userId,
            message_text: payload.text || "",
            timestamp: (message as any).timestamp || new Date().toISOString(),
            serverMessageId: message.id,
            clientMessageId: payload.clientMessageId,
            attachments: payload.attachments,
          };

          // ACK back to admin sender
          socket.emit("chat:message_ack", {
            clientMessageId: payload.clientMessageId,
            serverMessageId: message.id,
            status: "saved",
            timestamp: new Date().toISOString(),
          });

          // Broadcast to all admins (for admin panel UI)
          broadcastToAdmin(io, "admin:chat:new_message", {
            sessionId: payload.sessionId,
            message: messageData,
          });

          // Forward to specific customer if known
          const targetCustomerId =
            payload.toUserId || session?.getDataValue("user_id");
          if (targetCustomerId) {
            forwardToCustomer(
              io,
              targetCustomerId,
              "chat:new_message",
              messageData
            );
          }

          console.log(
            `[Chat] /admin: Message saved from ${userId} to session:${payload.sessionId}`
          );
        } catch (err) {
          console.error("[Chat] /admin: Error sending message:", err);
          socket.emit("chat:message_ack", {
            clientMessageId: payload?.clientMessageId,
            status: "failed",
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }
    );

    // Admin typing indicator
    socket.on(
      "chat:typing",
      (data: { sessionId: string; isTyping: boolean; toUserId?: string }) => {
        if (!data.sessionId) return;

        // Forward to customer if specified
        if (data.toUserId) {
          forwardToCustomer(io, data.toUserId, "chat:typing", {
            sessionId: data.sessionId,
            userId,
            isTyping: data.isTyping,
            isAdmin: true,
          });
        }

        // Broadcast to all admins in the session
        broadcastToAdmin(io, "admin:chat:typing", {
          sessionId: data.sessionId,
          userId,
          isTyping: data.isTyping,
          isAdmin: true,
        });

        // Also emit to session room
        adminNsp.to(`chat_session:${data.sessionId}`).emit("chat:typing", {
          sessionId: data.sessionId,
          userId,
          isTyping: data.isTyping,
          isAdmin: true,
        });
      }
    );

    // Admin marks messages as read
    socket.on(
      "chat:mark_read",
      (data: {
        sessionId: string;
        messageIds: string[];
        toUserId?: string;
      }) => {
        if (!data.sessionId || !data.messageIds?.length) return;

        const payload = {
          sessionId: data.sessionId,
          messageIds: data.messageIds,
          readBy: userId,
          readAt: new Date().toISOString(),
        };

        // Forward to customer if specified
        if (data.toUserId) {
          forwardToCustomer(io, data.toUserId, "chat:messages_read", payload);
        }

        // Broadcast to admins
        broadcastToAdmin(io, "admin:chat:messages_read", payload);
      }
    );
  });

  // ============================================
  // CUSTOMER NAMESPACE HANDLERS
  // ============================================
  customerNsp.on("connection", (socket) => {
    const userId = socket.data?.user?.id;
    const userRole = socket.data?.user?.role;

    // Only authenticated customers can send messages
    if (!userId || userRole !== "customer") {
      console.log(`[Chat] /customer: Anonymous connection socket=${socket.id}`);
      return;
    }

    console.log(`[Chat] /customer: Connected user=${userId}`);

    // Join chat-specific room for this customer
    socket.join(`customer_chat:${userId}`);

    // Customer sends message → save to DB → forward to admin
    socket.on(
      "chat:send_message",
      async (payload: {
        clientMessageId: string;
        sessionId: string;
        text?: string;
        attachments?: any[];
      }) => {
        try {
          if (!payload?.sessionId || !payload?.clientMessageId) {
            socket.emit("chat:message_ack", {
              clientMessageId: payload?.clientMessageId,
              status: "failed",
              error: "Missing sessionId or clientMessageId",
            });
            return;
          }

          // Verify session exists and belongs to customer
          const session = await ChatSession.findByPk(payload.sessionId);
          if (!session) {
            socket.emit("chat:message_ack", {
              clientMessageId: payload.clientMessageId,
              status: "failed",
              error: "Session not found",
            });
            return;
          }

          const sessionUserId = session.getDataValue("user_id");
          if (sessionUserId && sessionUserId !== userId) {
            socket.emit("chat:message_ack", {
              clientMessageId: payload.clientMessageId,
              status: "failed",
              error: "Unauthorized: Session does not belong to you",
            });
            return;
          }

          // Store sessionUserId for bot reply
          const sessionUser = sessionUserId || userId;

          // Save message to database
          const message = await ChatMessage.create({
            session_id: payload.sessionId,
            sender_type: "user",
            sender_id: userId,
            message_text: payload.text || "",
          });

          const messageData = {
            id: message.id,
            session_id: payload.sessionId,
            sender_type: "user",
            sender_id: userId,
            message_text: payload.text || "",
            timestamp: (message as any).timestamp || new Date().toISOString(),
            serverMessageId: message.id,
            clientMessageId: payload.clientMessageId,
            attachments: payload.attachments,
          };

          // ACK back to customer sender
          socket.emit("chat:message_ack", {
            clientMessageId: payload.clientMessageId,
            serverMessageId: message.id,
            status: "saved",
            timestamp: new Date().toISOString(),
          });

          // Forward to admin namespace (all admins receive customer messages)
          forwardToAdmin(io, "chat:new_message", {
            customer_id: userId,
            sessionId: payload.sessionId,
            message: messageData,
          });

          // Broadcast to all admins for admin panel
          broadcastToAdmin(io, "admin:chat:new_message", {
            sessionId: payload.sessionId,
            message: messageData,
          });

          // If chatbot is enabled, trigger bot reply
          if (session.getDataValue("bot_enabled")) {
            console.log(
              `[Chat] /customer: Bot enabled for session:${payload.sessionId}, triggering bot reply`
            );
            // Trigger bot reply - call chatbot API and save response
            (async () => {
              try {
                const axios = (await import("axios")).default;
                const { addMessage } = await import(
                  "../repositories/chatRepository"
                );
                const CHATBOT_URL =
                  process.env.CHATBOT_URL || "http://localhost:7860/api";

                // Get token from socket (stored during authentication)
                const token = (socket as any).token || null;

                // Log token status for debugging
                if (token) {
                  console.log(
                    `[Chat] /customer: Sending to chatbot with token (length=${
                      token.length
                    }), user_id=${userId || sessionUser || "anonymous"}`
                  );
                } else {
                  console.warn(
                    `[Chat] /customer: WARNING - No token available for chatbot API call, user_id=${
                      userId || sessionUser || "anonymous"
                    }`
                  );
                }

                const resp = await axios.post(
                  `${CHATBOT_URL}/generate`,
                  {
                    message: payload.text || "",
                    session_id: payload.sessionId,
                    user_id: userId || sessionUser || "anonymous",
                    token: token, // Pass token for authenticated API calls
                  },
                  { timeout: parseInt(process.env.CHATBOT_TIMEOUT || "10000") }
                );

                const botText: string = resp.data?.response || "";
                if (botText && botText.trim()) {
                  const botMsg = await addMessage({
                    sessionId: payload.sessionId,
                    senderType: "bot",
                    messageText: botText,
                    status: "sent",
                  });

                  const botMessageData = {
                    id: botMsg.id,
                    session_id: payload.sessionId,
                    sender_type: "bot",
                    sender_id: null,
                    message_text: botText,
                    timestamp:
                      (botMsg as any).timestamp || new Date().toISOString(),
                  };

                  // Emit bot message to all namespaces
                  forwardToAdmin(io, "chat:new_message", {
                    customer_id: sessionUser || "anonymous",
                    sessionId: payload.sessionId,
                    message: botMessageData,
                  });

                  broadcastToAdmin(io, "admin:chat:new_message", {
                    sessionId: payload.sessionId,
                    message: botMessageData,
                  });

                  // Emit to customer namespace
                  if (sessionUser) {
                    io.of("/customer")
                      .to(`customer_chat:${sessionUser}`)
                      .emit("chat:new_message", botMessageData);
                    io.of("/customer")
                      .to(`customer:${sessionUser}`)
                      .emit("chat:new_message", botMessageData);
                  }
                }
              } catch (botErr) {
                console.error("[Chat] Bot reply error:", botErr);
              }
            })();
          }

          console.log(
            `[Chat] /customer: Message saved from ${userId} in session:${payload.sessionId}`
          );
        } catch (err) {
          console.error("[Chat] /customer: Error sending message:", err);
          socket.emit("chat:message_ack", {
            clientMessageId: payload?.clientMessageId,
            status: "failed",
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }
    );

    // Customer typing indicator → forward to admin
    socket.on(
      "chat:typing",
      (data: { sessionId: string; isTyping: boolean }) => {
        if (!data.sessionId) return;

        // Forward to admin namespace
        forwardToAdmin(io, "chat:typing", {
          customer_id: userId,
          sessionId: data.sessionId,
          userId,
          isTyping: data.isTyping,
        });

        // Also broadcast to all admins
        broadcastToAdmin(io, "admin:chat:typing", {
          sessionId: data.sessionId,
          userId,
          isTyping: data.isTyping,
          isCustomer: true,
        });
      }
    );

    // Customer marks messages as read → forward to admin
    socket.on(
      "chat:mark_read",
      (data: { sessionId: string; messageIds: string[] }) => {
        if (!data.sessionId || !data.messageIds?.length) return;

        forwardToAdmin(io, "chat:messages_read", {
          customer_id: userId,
          sessionId: data.sessionId,
          messageIds: data.messageIds,
          readBy: userId,
        });
      }
    );

    // Customer joins a chat session
    socket.on("chat:join_session", (sessionId: string) => {
      if (!sessionId) return;
      socket.join(`chat_session:${sessionId}`);
      console.log(`[Chat] /customer: ${userId} joined session:${sessionId}`);

      forwardToAdmin(io, "chat:session_joined", {
        customer_id: userId,
        sessionId,
      });
    });

    // Customer leaves a chat session
    socket.on("chat:leave_session", (sessionId: string) => {
      if (!sessionId) return;
      socket.leave(`chat_session:${sessionId}`);
      console.log(`[Chat] /customer: ${userId} left session:${sessionId}`);
    });
  });
}

/**
 * Event Emitters (for use in services/controllers)
 */
export const chatEvents = {
  /**
   * Notify admins about new chat session
   */
  newChatSession: (io: Server, session: any) => {
    broadcastToAdmin(io, "admin:chat:session_new", {
      session,
      timestamp: new Date().toISOString(),
    });

    // Also notify customer if user_id exists
    if (session.user_id) {
      forwardToCustomer(io, session.user_id, "chat:session_new", {
        session,
      });
    }
  },

  /**
   * Notify about session status change
   */
  sessionStatusChanged: (
    io: Server,
    sessionId: string,
    status: string,
    userId?: string
  ) => {
    broadcastToAdmin(io, "admin:chat:session_status_changed", {
      sessionId,
      status,
    });

    if (userId) {
      forwardToCustomer(io, userId, "chat:session_status_changed", {
        sessionId,
        status,
      });
    }
  },

  /**
   * Notify about agent assignment
   */
  agentAssigned: (
    io: Server,
    sessionId: string,
    agentId: string,
    userId?: string
  ) => {
    broadcastToAdmin(io, "admin:chat:agent_assigned", {
      sessionId,
      agentId,
    });

    if (userId) {
      forwardToCustomer(io, userId, "chat:agent_assigned", {
        sessionId,
        agentId,
      });
    }
  },

  /**
   * Send bot message to customer
   */
  botMessage: (io: Server, customerId: string, message: any) => {
    forwardToCustomer(io, customerId, "chat:new_message", message);
    broadcastToAdmin(io, "admin:chat:new_message", {
      sessionId: message.session_id,
      message,
    });
  },
};
