"use client";

import apiClient from "@/lib/apiClient";

export const chatService = {
  // Chat Sessions
  getAllSessions: (params?: {
    page?: number;
    limit?: number;
    customer_name?: string;
    status?: string;
    sort_by?: "start_time" | "last_message";
    sort_order?: "ASC" | "DESC";
  }): Promise<ApiResponse<ChatSession[]>> =>
    apiClient.get<ApiResponse<ChatSession[]>>("/chat/sessions/all", { params }),

  listSessions: (params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<ChatSession[]>> =>
    apiClient.get<ApiResponse<ChatSession[]>>("/chat/sessions", { params }),

  getSession: (id: string): Promise<ApiResponse<ChatSession>> =>
    apiClient.get<ApiResponse<ChatSession>>(`/chat/sessions/${id}`),

  createSession: (data: {
    channel?: "web" | "app" | "zalo";
    context?: any;
    botEnabled?: boolean;
  }): Promise<ApiResponse<ChatSession>> =>
    apiClient.post<ApiResponse<ChatSession>>("/chat/session", data),

  enableBot: (id: string): Promise<ApiResponse<ChatSession>> =>
    apiClient.post<ApiResponse<ChatSession>>(`/chat/sessions/${id}/enable-bot`),

  disableBot: (id: string): Promise<ApiResponse<ChatSession>> =>
    apiClient.post<ApiResponse<ChatSession>>(
      `/chat/sessions/${id}/disable-bot`
    ),

  updateSession: (id: string, data: any): Promise<ApiResponse<ChatSession>> =>
    apiClient.put<ApiResponse<ChatSession>>(`/chat/sessions/${id}`, data),

  closeSession: (id: string): Promise<ApiResponse<ChatSession>> =>
    apiClient.post<ApiResponse<ChatSession>>(`/chat/sessions/${id}/close`),

  reopenSession: (id: string): Promise<ApiResponse<ChatSession>> =>
    apiClient.post<ApiResponse<ChatSession>>(`/chat/sessions/${id}/reopen`),

  // Chat Messages
  getMessages: (
    sessionId: string,
    params?: { page?: number; limit?: number }
  ): Promise<ApiResponse<ChatMessage[]>> =>
    apiClient.get<ApiResponse<ChatMessage[]>>(
      `/chat/sessions/${sessionId}/messages`,
      { params }
    ),

  sendMessage: (
    sessionId: string,
    data: { message_text: string; sender_type?: "user" | "bot" | "human" }
  ): Promise<ApiResponse<ChatMessage>> =>
    apiClient.post<ApiResponse<ChatMessage>>(
      `/chat/sessions/${sessionId}/messages`,
      data
    ),

  markMessagesRead: (
    sessionId: string,
    messageIds?: string[]
  ): Promise<ApiResponse<any>> =>
    apiClient.patch<ApiResponse<any>>(
      `/chat/sessions/${sessionId}/messages/read`,
      {
        messageIds,
      }
    ),

  // User Session Management
  getUserSession: (): Promise<ApiResponse<ChatSession>> =>
    apiClient.get<ApiResponse<ChatSession>>("/chat/user/session"),

  getActiveUserSession: (): Promise<ApiResponse<ChatSession>> =>
    apiClient.get<ApiResponse<ChatSession>>("/chat/user/session/active"),

  closeUserSession: (): Promise<ApiResponse<any>> =>
    apiClient.post<ApiResponse<any>>("/chat/user/session/close"),

  // AI Chatbot APIs
  chatWithBot: (data: {
    message: string;
    image?: string;
    session_id?: string;
    user_id?: string;
  }): Promise<ApiResponse<any>> =>
    apiClient.post<ApiResponse<any>>("/chat/messages/bot/chat", data),
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

export interface ApiResponse<T = any> {
  status: string;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
