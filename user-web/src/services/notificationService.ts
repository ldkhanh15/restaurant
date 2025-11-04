"use client";

import apiClient from "@/lib/apiClient";

export interface Notification {
  id: string;
  user_id?: string;
  type:
    | "low_stock"
    | "reservation_confirm"
    | "promotion"
    | "order_created"
    | "order_updated"
    | "order_status_changed"
    | "reservation_created"
    | "reservation_updated"
    | "chat_message"
    | "support_request"
    | "payment_completed"
    | "other";
  title?: string;
  content: string;
  data?: any;
  is_read: boolean;
  sent_at?: string;
  status: "sent" | "failed";
  created_at?: string;
  updated_at?: string;
}

export interface NotificationListResponse {
  data: Notification[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const notificationService = {
  // Get all notifications for current user (with filters)
  getAll: (params?: {
    page?: number;
    limit?: number;
    type?: string;
    is_read?: boolean;
  }): Promise<{ status: string; data: NotificationListResponse }> =>
    apiClient.get("/notifications", { params }),

  // Get unread notifications
  getUnread: (): Promise<{
    status: string;
    data: Notification[];
  }> => apiClient.get("/notifications/unread/list"),

  // Get unread count
  getUnreadCount: (): Promise<{
    status: string;
    data: { count: number };
  }> => apiClient.get("/notifications/unread/count"),

  // Get single notification
  getById: (id: string): Promise<{
    status: string;
    data: Notification;
  }> => apiClient.get(`/notifications/${id}`),

  // Mark notification as read
  markAsRead: (id: string): Promise<{
    status: string;
    data: Notification;
  }> => apiClient.patch(`/notifications/${id}/read`),

  // Mark all notifications as read
  markAllAsRead: (): Promise<{
    status: string;
    data: { affected_count: number };
  }> => apiClient.patch("/notifications/read-all"),

  // Delete notification
  delete: (id: string): Promise<{
    status: string;
    message: string;
  }> => apiClient.delete(`/notifications/${id}`),

  // Update notification (if needed)
  update: (
    id: string,
    data: { title?: string; content?: string; is_read?: boolean }
  ): Promise<{
    status: string;
    data: Notification;
  }> => apiClient.put(`/notifications/${id}`, data),
};

