"use client";

import { useCallback, useEffect } from "react";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { useSocketStore, type Notification } from "@/store/socketStore";

interface UseNotificationSocketReturn {
  isConnected: boolean;
  markNotificationsAsRead: (notificationIds: string[]) => void;
  markAllAsRead: () => void;
  // Getters from store
  getNotifications: () => Notification[];
  getUnreadCount: () => number;
  // Event listeners
  onNewNotification: (callback: (notification: Notification) => void) => void;
  onNotificationUpdate: (
    callback: (data: {
      notifications: { id: string; is_read: boolean }[];
    }) => void
  ) => void;
  onNotificationOrder: (callback: (notification: Notification) => void) => void;
  onNotificationReservation: (
    callback: (notification: Notification) => void
  ) => void;
  onNotificationChat: (callback: (notification: Notification) => void) => void;
  onNotificationBroadcast: (
    callback: (notification: Notification) => void
  ) => void;
  onNotificationError: (callback: (error: { message: string }) => void) => void;
  removeListeners: () => void;
}

export function useNotificationSocket(): UseNotificationSocketReturn {
  const { socket, isConnected } = useWebSocket();
  const {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
  } = useSocketStore();

  // Mark notifications as read
  const markNotificationsAsRead = useCallback(
    (notificationIds: string[]) => {
      if (socket && isConnected) {
        socket.emit("notification:mark_read", { notificationIds });
        // Optimistically update UI (will be confirmed by server)
        notificationIds.forEach((id) => markAsRead(id));
      }
    },
    [socket, isConnected, markAsRead]
  );

  // Mark all notifications as read
  const markAllAsReadSocket = useCallback(() => {
    if (socket && isConnected) {
      socket.emit("notification:mark_all_read");
      // Optimistically update UI
      markAllAsRead();
    }
  }, [socket, isConnected, markAllAsRead]);

  // Helper to create notification from socket data
  const createNotification = (data: any): Notification => {
    return {
      id: data.id || `notif-${Date.now()}`,
      user_id: data.user_id || data.userId || "",
      title: data.title || "",
      message: data.message || data.content || "",
      type: data.type || "other",
      read: data.is_read !== undefined ? data.is_read : data.read || false,
      created_at:
        data.created_at ||
        data.sent_at ||
        data.createdAt ||
        data.timestamp ||
        new Date().toISOString(),
      metadata: data.data || data.metadata || data.meta || {},
    };
  };

  // Event listeners - Customer namespace events
  const onNewNotification = useCallback(
    (callback: (notification: Notification) => void) => {
      if (socket) {
        socket.on("notification:new", (data: any) => {
          const notification = createNotification(data);
          addNotification(notification);
          callback(notification);
        });
      }
    },
    [socket, addNotification]
  );

  const onNotificationOrder = useCallback(
    (callback: (notification: Notification) => void) => {
      if (socket) {
        // Backend may not have separate event, but we can listen to admin:notification:order if forwarded
        // For now, filter from general notification:new
        socket.on("notification:new", (data: any) => {
          if (data.type === "order" || data.metadata?.module === "order") {
            const notification = createNotification(data);
            addNotification(notification);
            callback(notification);
          }
        });
      }
    },
    [socket, addNotification]
  );

  const onNotificationReservation = useCallback(
    (callback: (notification: Notification) => void) => {
      if (socket) {
        socket.on("notification:new", (data: any) => {
          if (
            data.type === "reservation" ||
            data.metadata?.module === "reservation"
          ) {
            const notification = createNotification(data);
            addNotification(notification);
            callback(notification);
          }
        });
      }
    },
    [socket, addNotification]
  );

  const onNotificationChat = useCallback(
    (callback: (notification: Notification) => void) => {
      if (socket) {
        socket.on("notification:new", (data: any) => {
          if (data.type === "chat" || data.metadata?.module === "chat") {
            const notification = createNotification(data);
            addNotification(notification);
            callback(notification);
          }
        });
      }
    },
    [socket, addNotification]
  );

  const onNotificationBroadcast = useCallback(
    (callback: (notification: Notification) => void) => {
      if (socket) {
        socket.on("notification:broadcast", (data: any) => {
          const notification = createNotification(data);
          addNotification(notification);
          callback(notification);
        });
      }
    },
    [socket, addNotification]
  );

  // Listen to notification updates (from mark as read)
  const onNotificationUpdate = useCallback(
    (
      callback: (data: {
        notifications: { id: string; is_read: boolean }[];
      }) => void
    ) => {
      if (socket) {
        socket.on("notification:update", (data: any) => {
          // Update store
          if (data.notifications) {
            data.notifications.forEach(
              (n: { id: string; is_read: boolean }) => {
                if (n.is_read) {
                  markAsRead(n.id);
                }
              }
            );
          } else if (data.id) {
            // Single notification update
            if (data.is_read) {
              markAsRead(data.id);
            }
          }
          callback(data);
        });

        // Listen to mark all read confirmation
        socket.on("notification:mark_all_read", (data: any) => {
          markAllAsRead();
          callback({ notifications: [] });
        });
      }
    },
    [socket, markAsRead, markAllAsRead]
  );

  // Listen to errors
  const onNotificationError = useCallback(
    (callback: (error: { message: string }) => void) => {
      if (socket) {
        socket.on("notification:error", (error: any) => {
          console.error("[Notification] Socket error:", error);
          callback(error);
        });
      }
    },
    [socket]
  );

  // Store getters
  const getNotifications = useCallback(() => {
    return notifications;
  }, [notifications]);

  const getUnreadCount = useCallback(() => {
    return unreadCount;
  }, [unreadCount]);

  // Cleanup function
  const removeListeners = useCallback(() => {
    if (socket) {
      socket.removeAllListeners("notification:new");
      socket.removeAllListeners("notification:broadcast");
      socket.removeAllListeners("notification:update");
      socket.removeAllListeners("notification:mark_all_read");
      socket.removeAllListeners("notification:error");
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
    markNotificationsAsRead,
    markAllAsRead: markAllAsReadSocket,
    getNotifications,
    getUnreadCount,
    onNewNotification,
    onNotificationUpdate,
    onNotificationOrder,
    onNotificationReservation,
    onNotificationChat,
    onNotificationBroadcast,
    onNotificationError,
    removeListeners,
  };
}
