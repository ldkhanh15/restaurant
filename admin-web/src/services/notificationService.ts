"use client";

import apiClient from "./apiClient";

export const notificationService = {
  // Get all notifications
  list: (params?: { page?: number; limit?: number }) =>
    apiClient.get("/notifications", { params }),

  // Get unread notifications
  getUnread: () => apiClient.get("/notifications/unread"),

  // Get single notification
  getById: (id: string) => apiClient.get(`/notifications/${id}`),

  // Create notification (Admin only)
  create: (data: {
    type: string;
    title: string;
    content: string;
    data?: any;
  }) => apiClient.post("/notifications", data),

  // Update notification
  update: (id: string, data: any) =>
    apiClient.put(`/notifications/${id}`, data),

  // Delete notification
  remove: (id: string) => apiClient.delete(`/notifications/${id}`),

  // Mark notification as read
  markAsRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),

  // Mark all notifications as read
  markAllAsRead: () => apiClient.patch("/notifications/read-all"),

  // Get all notifications with pagination
  getAllNotifications: (params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => apiClient.get("/notifications", { params }),

  // Delete notification
  deleteNotification: (id: string) => apiClient.delete(`/notifications/${id}`),
};

export type Notification = {
  id: string;
  type:
    | "order_created"
    | "order_updated"
    | "order_status_changed"
    | "reservation_created"
    | "reservation_updated"
    | "chat_message"
    | "support_request"
    | "payment_completed";
  title: string;
  content: string;
  data?: {
    order_id?: string;
    table_id?: string;
    amount?: number;
    reservation_id?: string;
    session_id?: string;
    [key: string]: any;
  };
  is_read: boolean;
  sent_at: string;
  status: "sent" | "delivered" | "failed";
  user_id?: string;
  created_at?: string;
  updated_at?: string;
};
