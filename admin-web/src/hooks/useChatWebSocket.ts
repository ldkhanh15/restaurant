"use client";

import { useCallback, useEffect, useState } from "react";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { useAuthStore } from "@/store/authStore";

interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  content: string;
  type: "text" | "image" | "file";
  timestamp: Date;
  status: "sent" | "delivered" | "read";
}

interface ChatSession {
  id: string;
  customerId: string;
  status: "active" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

interface UseChatWebSocketReturn {
  isConnected: boolean;
  sessions: ChatSession[];
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  sendMessage: (
    sessionId: string,
    message: string,
    type?: "text" | "image" | "file"
  ) => void;
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
  onSessionNew: (callback: (session: any) => void) => void;
  onSessionStatusChanged: (
    callback: (data: { sessionId: string; status: string }) => void
  ) => void;
  onAgentAssigned: (
    callback: (data: { sessionId: string; agentId: string }) => void
  ) => void;
  onMessageEdit: (
    callback: (data: {
      sessionId: string;
      messageId: string;
      text: string;
    }) => void
  ) => void;
  onMessageDelete: (
    callback: (data: { sessionId: string; messageId: string }) => void
  ) => void;
  joinSession: (sessionId: string) => void;
  leaveSession: (sessionId: string) => void;
  startTyping: (sessionId: string) => void;
  stopTyping: (sessionId: string) => void;
  markMessagesAsRead: (sessionId: string, messageIds: string[]) => void;
  removeListeners: () => void;
}

export function useChatWebSocket(): UseChatWebSocketReturn {
  const { adminSocket, customerSocket, isConnected } = useWebSocket();
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const socket =
    user?.role === "admin" || user?.role === "staff"
      ? adminSocket
      : customerSocket;

  // Send message
  const sendMessage = useCallback(
    (
      sessionId: string,
      message: string,
      type: "text" | "image" | "file" = "text"
    ) => {
      if (socket && isConnected) {
        const clientMessageId = `${Date.now()}-${Math.random()}`;
        socket.emit("chat:send_message", {
          clientMessageId,
          sessionId,
          text: message,
          messageType: type,
          // Admin can optionally specify toUserId to forward to specific customer
        });
        return clientMessageId;
      }
      return undefined;
    },
    [socket, isConnected]
  );

  // Message received handler
  const onMessageReceived = useCallback(
    (callback: (message: ChatMessage) => void) => {
      if (socket) {
        // Listen to new message events from backend
        socket.on("chat:new_message", (data: any) => {
          callback({
            id: data.id || data.serverMessageId,
            sessionId: data.session_id || data.sessionId,
            senderId: data.sender_id || data.fromUserId || null,
            content: data.message_text || data.text,
            type: data.messageType || "text",
            timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
            status: "delivered",
          });
        });

        // Listen to admin-specific broadcast events
        socket.on("admin:chat:new_message", (data: any) => {
          if (data.message) {
            callback({
              id: data.message.id || data.message.serverMessageId,
              sessionId: data.sessionId || data.message.session_id,
              senderId:
                data.message.sender_id || data.message.fromUserId || null,
              content: data.message.message_text || data.message.text,
              type: data.message.messageType || "text",
              timestamp: data.message.timestamp
                ? new Date(data.message.timestamp)
                : new Date(),
              status: "delivered",
            });
          }
        });

        // Listen to customer events forwarded to admin
        socket.on("customer:chat:new_message", (data: any) => {
          if (data.message) {
            callback({
              id: data.message.id || data.message.serverMessageId,
              sessionId: data.sessionId || data.message.session_id,
              senderId: data.message.sender_id || data.customer_id || null,
              content: data.message.message_text || data.message.text,
              type: data.message.messageType || "text",
              timestamp: data.message.timestamp
                ? new Date(data.message.timestamp)
                : new Date(),
              status: "delivered",
            });
          }
        });
      }
    },
    [socket]
  );

  // Typing indicators
  const onTypingStart = useCallback(
    (
      callback: (data: {
        userId: string;
        sessionId: string;
        isAdmin?: boolean;
        isCustomer?: boolean;
      }) => void
    ) => {
      if (socket) {
        socket.on("chat:typing", (data: any) => {
          if (data.isTyping) {
            callback({
              userId: data.userId,
              sessionId: data.sessionId,
              isAdmin: data.isAdmin || false,
              isCustomer: data.isCustomer || false,
            });
          }
        });
        socket.on("admin:chat:typing", (data: any) => {
          if (data.isTyping) {
            callback({
              userId: data.userId,
              sessionId: data.sessionId,
              isAdmin: data.isAdmin || false,
              isCustomer: data.isCustomer || false,
            });
          }
        });
        socket.on("customer:chat:typing", (data: any) => {
          if (data.isTyping) {
            callback({
              userId: data.userId || data.customer_id,
              sessionId: data.sessionId,
              isAdmin: false,
              isCustomer: true,
            });
          }
        });
      }
    },
    [socket]
  );

  const onTypingEnd = useCallback(
    (
      callback: (data: {
        userId: string;
        sessionId: string;
        isAdmin?: boolean;
        isCustomer?: boolean;
      }) => void
    ) => {
      if (socket) {
        socket.on("chat:typing", (data: any) => {
          if (!data.isTyping) {
            callback({
              userId: data.userId,
              sessionId: data.sessionId,
              isAdmin: data.isAdmin || false,
              isCustomer: data.isCustomer || false,
            });
          }
        });
        socket.on("admin:chat:typing", (data: any) => {
          if (!data.isTyping) {
            callback({
              userId: data.userId,
              sessionId: data.sessionId,
              isAdmin: data.isAdmin || false,
              isCustomer: data.isCustomer || false,
            });
          }
        });
        socket.on("customer:chat:typing", (data: any) => {
          if (!data.isTyping) {
            callback({
              userId: data.userId || data.customer_id,
              sessionId: data.sessionId,
              isAdmin: false,
              isCustomer: true,
            });
          }
        });
      }
    },
    [socket]
  );

  // Read receipts
  const onMessagesRead = useCallback(
    (
      callback: (data: {
        userId: string;
        sessionId: string;
        messageIds: string[];
      }) => void
    ) => {
      if (socket) {
        socket.on("chat:messages_read", callback);
      }
    },
    [socket]
  );

  // Session management
  const joinSession = useCallback(
    (sessionId: string) => {
      if (socket && isConnected) {
        socket.emit("chat:join_session", sessionId);
      }
    },
    [socket, isConnected]
  );

  const leaveSession = useCallback(
    (sessionId: string) => {
      if (socket && isConnected) {
        socket.emit("chat:leave_session", sessionId);
      }
    },
    [socket, isConnected]
  );

  // Typing indicators
  const startTyping = useCallback(
    (sessionId: string) => {
      if (socket && isConnected) {
        socket.emit("chat:typing", {
          sessionId,
          isTyping: true,
          toUserId: undefined, // Will be determined by backend
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
          toUserId: undefined,
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
          messageIds: messageIds,
        });
      }
    },
    [socket, isConnected, user?.id]
  );

  // Session events
  const onSessionNew = useCallback(
    (callback: (session: any) => void) => {
      if (socket) {
        socket.on("chat:session_new", callback);
        socket.on("admin:chat:session_new", callback);
      }
    },
    [socket]
  );

  const onSessionStatusChanged = useCallback(
    (callback: (data: { sessionId: string; status: string }) => void) => {
      if (socket) {
        socket.on("chat:session_status_changed", callback);
        socket.on("admin:chat:session_status_changed", callback);
      }
    },
    [socket]
  );

  const onAgentAssigned = useCallback(
    (callback: (data: { sessionId: string; agentId: string }) => void) => {
      if (socket) {
        socket.on("chat:agent_assigned", callback);
        socket.on("admin:chat:agent_assigned", callback);
      }
    },
    [socket]
  );

  // Message edit/delete
  const onMessageEdit = useCallback(
    (
      callback: (data: {
        sessionId: string;
        messageId: string;
        text: string;
      }) => void
    ) => {
      if (socket) {
        socket.on("chat:message_edit", callback);
      }
    },
    [socket]
  );

  const onMessageDelete = useCallback(
    (callback: (data: { sessionId: string; messageId: string }) => void) => {
      if (socket) {
        socket.on("chat:message_delete", callback);
      }
    },
    [socket]
  );

  // Cleanup function
  const removeListeners = useCallback(() => {
    if (socket) {
      socket.removeAllListeners("chat:new_message");
      socket.removeAllListeners("chat:message_received");
      socket.removeAllListeners("admin:chat:new_message");
      socket.removeAllListeners("chat:typing");
      socket.removeAllListeners("chat:typing_ended");
      socket.removeAllListeners("chat:message_read");
      socket.removeAllListeners("chat:messages_read");
      socket.removeAllListeners("chat:session_start");
      socket.removeAllListeners("chat:session_close");
      socket.removeAllListeners("chat:message_edit");
      socket.removeAllListeners("chat:message_delete");
      socket.removeAllListeners("chat:session_new");
      socket.removeAllListeners("admin:chat:session_new");
      socket.removeAllListeners("chat:session_status_changed");
      socket.removeAllListeners("admin:chat:session_status_changed");
      socket.removeAllListeners("chat:agent_assigned");
      socket.removeAllListeners("admin:chat:agent_assigned");
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
    sessions,
    setSessions,
    messages,
    setMessages,
    sendMessage,
    onMessageReceived,
    onTypingStart,
    onTypingEnd,
    onMessagesRead,
    onSessionNew,
    onSessionStatusChanged,
    onAgentAssigned,
    onMessageEdit,
    onMessageDelete,
    joinSession,
    leaveSession,
    startTyping,
    stopTyping,
    markMessagesAsRead,
    removeListeners,
  };
}
