"use client";

import apiClient from "./apiClient";

export const chatService = {
  // Chat Sessions
  getAllSessions: (params?: {
    page?: number;
    limit?: number;
    customer_name?: string;
    status?: string;
    sort_by?: "start_time" | "last_message";
    sort_order?: "ASC" | "DESC";
  }) => apiClient.get("/chat/sessions/all", { params }),
  listSessions: (params?: { page?: number; limit?: number }) =>
    apiClient.get("/chat/sessions", { params }),
  getSession: (id: string) => apiClient.get(`/chat/sessions/${id}`),
  createSession: (data: {
    channel?: "web" | "app" | "zalo";
    context?: any;
    botEnabled?: boolean;
  }) => apiClient.post("/chat/session", data),
  enableBot: (id: string) => apiClient.post(`/chat/sessions/${id}/enable-bot`),
  disableBot: (id: string) =>
    apiClient.post(`/chat/sessions/${id}/disable-bot`),
  updateSession: (id: string, data: any) =>
    apiClient.put(`/chat/sessions/${id}`, data),
  closeSession: (id: string) => apiClient.post(`/chat/sessions/${id}/close`),
  reopenSession: (id: string) => apiClient.post(`/chat/sessions/${id}/reopen`),

  // Chat Messages
  getMessages: (
    sessionId: string,
    params?: { page?: number; limit?: number }
  ) => apiClient.get(`/chat/sessions/${sessionId}/messages`, { params }),
  sendMessage: (
    sessionId: string,
    data: { message_text: string; sender_type?: "user" | "bot" | "human" }
  ) => apiClient.post(`/chat/sessions/${sessionId}/messages`, data),
  markMessagesRead: (sessionId: string, messageIds?: string[]) =>
    apiClient.patch(`/chat/sessions/${sessionId}/messages/read`, {
      messageIds,
    }),

  // User Session Management
  getUserSession: () => apiClient.get("/chat/user/session"),
  getActiveUserSession: () => apiClient.get("/chat/user/session/active"),
  closeUserSession: () => apiClient.post("/chat/user/session/close"),

  // AI Chatbot APIs
  chatWithBot: (data: {
    message: string;
    image?: string;
    session_id?: string;
    user_id?: string;
  }) => apiClient.post("/chat/messages/bot/chat", data),
};

export type ChatSession = {
  id: string;
  user_id?: string;
  is_authenticated: boolean;
  channel: "web" | "app" | "zalo";
  context?: any;
  start_time?: string;
  end_time?: string;
  status: "active" | "closed";
  handled_by: "bot" | "human";
  bot_enabled?: boolean;
  user?: {
    id: string;
    username: string;
    full_name?: string;
    email?: string;
    phone?: string;
  };
};

export type ChatMessage = {
  id: string;
  session_id?: string;
  sender_type: "user" | "bot" | "human";
  sender_id?: string | null;
  message_text: string;
  timestamp: string;
};
