"use client";

import apiClient from "./apiClient";

export const chatService = {
  // Chat Sessions
  listSessions: (params?: { page?: number; limit?: number }) =>
    apiClient.get("/chat/sessions", { params }),
  getSession: (id: string) => apiClient.get(`/chat/sessions/${id}`),
  createSession: (data: { device_id?: string; name?: string }) =>
    apiClient.post("/chat/sessions", data),
  updateSession: (id: string, data: any) =>
    apiClient.put(`/chat/sessions/${id}`, data),
  deleteSession: (id: string) => apiClient.delete(`/chat/sessions/${id}`),

  // Chat Messages
  getMessages: (sessionId: string) =>
    apiClient.get(`/chat/messages/session/${sessionId}`),
  getMessage: (id: string) => apiClient.get(`/chat/messages/${id}`),
  createMessage: (data: {
    session_id: string;
    sender_type: "user" | "bot" | "human";
    message_text: string;
  }) => apiClient.post("/chat/messages", data),
  updateMessage: (id: string, data: any) =>
    apiClient.put(`/chat/messages/${id}`, data),
  deleteMessage: (id: string) => apiClient.delete(`/chat/messages/${id}`),

  // AI Chatbot APIs
  chatWithBot: (data: {
    message: string;
    image?: string;
    session_id?: string;
    user_id?: string;
  }) => apiClient.post("/chat/messages/bot/chat", data),

  createChatSession: (data: { device_id?: string; name?: string }) =>
    apiClient.post("/chat/messages/sessions", data),

  getChatHistory: (sessionId: string) =>
    apiClient.get(`/chat/messages/sessions/${sessionId}/history`),

  closeChatSession: (sessionId: string) =>
    apiClient.put(`/chat/messages/sessions/${sessionId}/close`, {}),

  getMenuRecommendations: (params?: { preferences?: string }) =>
    apiClient.get("/chat/messages/recommendations/menu", { params }),

  getRestaurantInfo: () => apiClient.get("/chat/messages/restaurant/info"),

  checkChatbotAvailability: () =>
    apiClient.get("/chat/messages/bot/availability"),
};

export type ChatSession = {
  id: string;
  user_id?: string;
  device_id?: string;
  name?: string;
  is_authenticated: boolean;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  session_id: string;
  sender_type: "user" | "bot" | "human";
  message_text: string;
  created_at: string;
  updated_at: string;
};
