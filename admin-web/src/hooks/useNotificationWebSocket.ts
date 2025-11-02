"use client";

import { useCallback, useEffect } from "react";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { useAuthStore } from "@/store/authStore";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: Date;
  createdBy: string;
  metadata?: any;
}

interface NotificationReadStatus {
  notificationIds: string[];
  readAt: Date;
  readBy: string;
}

interface UseNotificationWebSocketReturn {
  isConnected: boolean;
  broadcastNotification: (data: {
    title: string;
    message: string;
    type: string;
    targetUserIds?: string[];
    metadata?: any;
  }) => void;
  markNotificationsAsRead: (notificationIds: string[]) => void;
  onNewNotification: (callback: (notification: Notification) => void) => void;
  onNotificationOrder: (callback: (notification: Notification) => void) => void;
  onNotificationReservation: (
    callback: (notification: Notification) => void
  ) => void;
  onNotificationChat: (callback: (notification: Notification) => void) => void;
  onNotificationsMarkedRead: (
    callback: (status: NotificationReadStatus) => void
  ) => void;
  removeListeners: () => void;
}

export function useNotificationWebSocket(): UseNotificationWebSocketReturn {
  const { adminSocket, customerSocket, isConnected } = useWebSocket();
  const { user } = useAuthStore();

  const socket =
    user?.role === "admin" || user?.role === "staff"
      ? adminSocket
      : customerSocket;

  // Admin-only function to broadcast notifications
  const broadcastNotification = useCallback(
    (data: {
      title: string;
      message: string;
      type: string;
      targetUserIds?: string[];
      metadata?: any;
    }) => {
      if (
        socket &&
        isConnected &&
        (user?.role === "admin" || user?.role === "staff")
      ) {
        socket.emit("notification:broadcast", data);
      }
    },
    [socket, isConnected, user?.role]
  );

  // Mark notifications as read
  const markNotificationsAsRead = useCallback(
    (notificationIds: string[]) => {
      if (socket && isConnected) {
        socket.emit("notification:mark_read", { notificationIds });
      }
    },
    [socket, isConnected]
  );

  // Event listeners
  const onNewNotification = useCallback(
    (callback: (notification: Notification) => void) => {
      if (socket) {
        socket.on("notification:new", callback);
        socket.on("newNotification", callback);
      }
    },
    [socket]
  );

  const onNotificationOrder = useCallback(
    (callback: (notification: Notification) => void) => {
      if (socket) {
        socket.on("notification:order", callback);
        socket.on("orderNotification", callback);
      }
    },
    [socket]
  );

  const onNotificationReservation = useCallback(
    (callback: (notification: Notification) => void) => {
      if (socket) {
        socket.on("notification:reservation", callback);
        socket.on("reservationNotification", callback);
      }
    },
    [socket]
  );

  const onNotificationChat = useCallback(
    (callback: (notification: Notification) => void) => {
      if (socket) {
        socket.on("notification:chat", callback);
        socket.on("chatNotification", callback);
      }
    },
    [socket]
  );

  const onNotificationsMarkedRead = useCallback(
    (callback: (status: NotificationReadStatus) => void) => {
      if (socket) {
        socket.on("notification:marked_read", callback);
      }
    },
    [socket]
  );

  // Error handling
  useEffect(() => {
    if (socket) {
      socket.on("notification:error", (error: { message: string }) => {
        console.error("Notification error:", error.message);
        // You might want to add toast notification or other error handling here
      });
    }
  }, [socket]);

  // Cleanup function
  const removeListeners = useCallback(() => {
    if (socket) {
      socket.removeAllListeners("notification:new");
      socket.removeAllListeners("notification:order");
      socket.removeAllListeners("notification:reservation");
      socket.removeAllListeners("notification:chat");
      socket.removeAllListeners("notification:marked_read");
      socket.removeAllListeners("notification:error");
      // Legacy
      socket.removeAllListeners("newNotification");
      socket.removeAllListeners("orderNotification");
      socket.removeAllListeners("reservationNotification");
      socket.removeAllListeners("chatNotification");
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
    broadcastNotification,
    markNotificationsAsRead,
    onNewNotification,
    onNotificationOrder,
    onNotificationReservation,
    onNotificationChat,
    onNotificationsMarkedRead,
    removeListeners,
  };
}
