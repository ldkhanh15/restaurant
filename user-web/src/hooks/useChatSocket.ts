"use client";

import { useCallback, useEffect } from "react";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { useAuth } from "@/lib/auth";
import {
  useSocketStore,
  type ChatMessage,
  type ChatSession,
} from "@/store/socketStore";

interface UseChatSocketReturn {
  isConnected: boolean;
  sendMessage: (
    sessionId: string,
    message: string,
    type?: "text" | "image" | "file"
  ) => string | undefined;
  joinSession: (sessionId: string) => void;
  leaveSession: (sessionId: string) => void;
  startTyping: (sessionId: string) => void;
  stopTyping: (sessionId: string) => void;
  markMessagesAsRead: (sessionId: string, messageIds: string[]) => void;
  // Getters from store
  getMessages: (sessionId: string) => ChatMessage[];
  getSessions: () => ChatSession[];
  getCurrentSession: () => ChatSession | null;
  // Listeners
  onMessageReceived: (callback: (message: ChatMessage) => void) => void;
  onTypingStart: (
    callback: (data: { userId: string; sessionId: string }) => void
  ) => void;
  onTypingEnd: (
    callback: (data: { userId: string; sessionId: string }) => void
  ) => void;
  onMessagesRead: (
    callback: (data: {
      userId: string;
      sessionId: string;
      messageIds: string[];
    }) => void
  ) => void;
  onSessionNew: (callback: (session: ChatSession) => void) => void;
  onSessionStatusChanged: (
    callback: (data: { sessionId: string; status: string }) => void
  ) => void;
  onMessageAck: (
    callback: (data: {
      clientMessageId: string;
      status: string;
      serverMessageId?: string;
      error?: string;
    }) => void
  ) => void;
  removeListeners: () => void;
}

export function useChatSocket(): UseChatSocketReturn {
  const { socket, isConnected } = useWebSocket();
  const { user } = useAuth();
  const {
    messages,
    sessions,
    currentSessionId,
    addMessage,
    setMessages,
    addSession,
    updateSession,
    setTyping,
    setCurrentSession,
  } = useSocketStore();

  // Send message
  const sendMessage = useCallback(
    (
      sessionId: string,
      message: string,
      type: "text" | "image" | "file" = "text"
    ) => {
      if (socket && isConnected && user?.id) {
        const clientMessageId = `msg-${Date.now()}-${Math.random()}`;
        socket.emit("chat:send_message", {
          clientMessageId,
          sessionId,
          text: message,
          attachments: type !== "text" ? [] : undefined,
        });
        return clientMessageId;
      }
      return undefined;
    },
    [socket, isConnected, user?.id]
  );

  // Session management
  const joinSession = useCallback(
    (sessionId: string) => {
      if (socket && isConnected) {
        socket.emit("chat:join_session", sessionId);
        setCurrentSession(sessionId);
        console.log(`[Chat] Joined session: ${sessionId}`);
      }
    },
    [socket, isConnected, setCurrentSession]
  );

  const leaveSession = useCallback(
    (sessionId: string) => {
      if (socket && isConnected) {
        socket.emit("chat:leave_session", sessionId);
        if (currentSessionId === sessionId) {
          setCurrentSession(null);
        }
        console.log(`[Chat] Left session: ${sessionId}`);
      }
    },
    [socket, isConnected, currentSessionId, setCurrentSession]
  );

  // Typing indicators
  const startTyping = useCallback(
    (sessionId: string) => {
      if (socket && isConnected) {
        socket.emit("chat:typing", {
          sessionId,
          isTyping: true,
        });
      }
    },
    [socket, isConnected]
  );

  const stopTyping = useCallback(
    (sessionId: string) => {
      if (socket && isConnected) {
        socket.emit("chat:typing", {
          sessionId,
          isTyping: false,
        });
      }
    },
    [socket, isConnected]
  );

  // Mark messages as read
  const markMessagesAsRead = useCallback(
    (sessionId: string, messageIds: string[]) => {
      if (socket && isConnected && user?.id) {
        socket.emit("chat:mark_read", {
          sessionId,
          messageIds,
        });
      }
    },
    [socket, isConnected, user?.id]
  );

  // Event listeners
  const onMessageReceived = useCallback(
    (callback: (message: ChatMessage) => void) => {
      if (socket) {
        const handler = (data: any) => {
          const message: ChatMessage = {
            id: data.id || data.serverMessageId || `msg-${Date.now()}`,
            session_id: data.session_id || data.sessionId,
            sender_type: data.sender_type || (data.sender_id ? "user" : "bot"),
            sender_id: data.sender_id || null,
            message_text: data.message_text || data.text || "",
            timestamp: data.timestamp || new Date().toISOString(),
            serverMessageId: data.serverMessageId || data.id,
            clientMessageId: data.clientMessageId,
            attachments: data.attachments || [],
          };

          // Update store
          addMessage(message.session_id, message);

          // Call user callback
          callback(message);
        };

        // Listen to customer namespace events
        socket.on("chat:new_message", handler);
      }
    },
    [socket, addMessage]
  );

  const onTypingStart = useCallback(
    (callback: (data: { userId: string; sessionId: string }) => void) => {
      if (socket) {
        socket.on("chat:typing", (data: any) => {
          if (data.isTyping) {
            const userId = data.userId || (data.isAdmin ? "admin" : "customer");
            setTyping(data.sessionId, userId, true);
            callback({
              userId,
              sessionId: data.sessionId,
            });
          }
        });
      }
    },
    [socket, setTyping]
  );

  const onTypingEnd = useCallback(
    (callback: (data: { userId: string; sessionId: string }) => void) => {
      if (socket) {
        socket.on("chat:typing", (data: any) => {
          if (!data.isTyping) {
            const userId = data.userId || (data.isAdmin ? "admin" : "customer");
            setTyping(data.sessionId, userId, false);
            callback({
              userId,
              sessionId: data.sessionId,
            });
          }
        });
      }
    },
    [socket, setTyping]
  );

  const onMessagesRead = useCallback(
    (
      callback: (data: {
        userId: string;
        sessionId: string;
        messageIds: string[];
      }) => void
    ) => {
      if (socket) {
        socket.on("chat:messages_read", (data: any) => {
          callback({
            userId: data.readBy || data.userId || "admin",
            sessionId: data.sessionId,
            messageIds: Array.isArray(data.messageIds)
              ? data.messageIds
              : [data.messageId || data.messageIds],
          });
        });
      }
    },
    [socket]
  );

  const onSessionNew = useCallback(
    (callback: (session: ChatSession) => void) => {
      if (socket) {
        socket.on("chat:session_new", (data: any) => {
          const session: ChatSession = {
            id: data.id || data.session_id,
            user_id: data.user_id,
            status: data.status || "active",
            bot_enabled: data.bot_enabled !== false,
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.updated_at || new Date().toISOString(),
          };
          addSession(session);
          callback(session);
        });
      }
    },
    [socket, addSession]
  );

  const onSessionStatusChanged = useCallback(
    (callback: (data: { sessionId: string; status: string }) => void) => {
      if (socket) {
        socket.on("chat:session_status_changed", (data: any) => {
          updateSession(data.sessionId || data.session_id, {
            status: data.status,
          });
          callback({
            sessionId: data.sessionId || data.session_id,
            status: data.status,
          });
        });
      }
    },
    [socket, updateSession]
  );

  const onMessageAck = useCallback(
    (
      callback: (data: {
        clientMessageId: string;
        status: string;
        serverMessageId?: string;
        error?: string;
      }) => void
    ) => {
      if (socket) {
        socket.on("chat:message_ack", (data: any) => {
          callback({
            clientMessageId: data.clientMessageId,
            status: data.status,
            serverMessageId: data.serverMessageId,
            error: data.error,
          });
        });
      }
    },
    [socket]
  );

  // Store getters
  const getMessages = useCallback(
    (sessionId: string) => {
      return messages[sessionId] || [];
    },
    [messages]
  );

  const getSessions = useCallback(() => {
    return sessions;
  }, [sessions]);

  const getCurrentSession = useCallback(() => {
    if (!currentSessionId) return null;
    return sessions.find((s) => s.id === currentSessionId) || null;
  }, [currentSessionId, sessions]);

  // Cleanup function
  const removeListeners = useCallback(() => {
    if (socket) {
      socket.removeAllListeners("chat:new_message");
      socket.removeAllListeners("chat:typing");
      socket.removeAllListeners("chat:messages_read");
      socket.removeAllListeners("chat:message_ack");
      socket.removeAllListeners("chat:session_new");
      socket.removeAllListeners("chat:session_status_changed");
      socket.removeAllListeners("chat:agent_assigned");
    }
  }, [socket]);

  // Clean up listeners on unmount
  useEffect(() => {
    return () => {
      removeListeners();
    };
  }, [removeListeners]);

  return {
    isConnected,
    sendMessage,
    joinSession,
    leaveSession,
    startTyping,
    stopTyping,
    markMessagesAsRead,
    getMessages,
    getSessions,
    getCurrentSession,
    onMessageReceived,
    onTypingStart,
    onTypingEnd,
    onMessagesRead,
    onSessionNew,
    onSessionStatusChanged,
    onMessageAck,
    removeListeners,
  };
}
