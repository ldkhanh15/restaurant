"use client";

import { useCallback, useEffect, useState } from "react";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { useAuth } from "@/lib/auth";

interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string | null;
  content: string;
  type: "text" | "image" | "file";
  timestamp: Date;
  status: "sent" | "delivered" | "read";
}

interface UseChatWebSocketReturn {
  isConnected: boolean;
  sendMessage: (
    sessionId: string,
    message: string,
    type?: "text" | "image" | "file"
  ) => string | undefined;
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
  joinSession: (sessionId: string) => void;
  leaveSession: (sessionId: string) => void;
  startTyping: (sessionId: string) => void;
  stopTyping: (sessionId: string) => void;
  markMessagesAsRead: (sessionId: string, messageIds: string[]) => void;
  removeListeners: () => void;
}

export function useChatWebSocket(): UseChatWebSocketReturn {
  const { socket, isConnected } = useWebSocket();
  const { user } = useAuth();

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
        socket.on("chat:new_message", (data: any) => {
          callback({
            id: data.id || data.serverMessageId,
            sessionId: data.session_id || data.sessionId,
            senderId: data.sender_id || null,
            content: data.message_text || data.text,
            type: data.messageType || "text",
            timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
            status: "delivered",
          });
        });
      }
    },
    [socket]
  );

  // Typing indicators
  const onTypingStart = useCallback(
    (callback: (data: { userId: string; sessionId: string }) => void) => {
      if (socket) {
        socket.on("chat:typing", (data: any) => {
          if (data.isTyping) {
            callback({
              userId: data.userId || "admin",
              sessionId: data.sessionId,
            });
          }
        });
      }
    },
    [socket]
  );

  const onTypingEnd = useCallback(
    (callback: (data: { userId: string; sessionId: string }) => void) => {
      if (socket) {
        socket.on("chat:typing", (data: any) => {
          if (!data.isTyping) {
            callback({
              userId: data.userId || "admin",
              sessionId: data.sessionId,
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
        socket.on("chat:messages_read", (data: any) => {
          callback({
            userId: data.readBy || data.userId,
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
          messageIds: messageIds,
        });
      }
    },
    [socket, isConnected, user?.id]
  );

  // Cleanup function
  const removeListeners = useCallback(() => {
    if (socket) {
      socket.removeAllListeners("chat:new_message");
      socket.removeAllListeners("chat:typing");
      socket.removeAllListeners("chat:messages_read");
      socket.removeAllListeners("chat:message_ack");
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
    onMessageReceived,
    onTypingStart,
    onTypingEnd,
    onMessagesRead,
    joinSession,
    leaveSession,
    startTyping,
    stopTyping,
    markMessagesAsRead,
    removeListeners,
  };
}
