"use client";

import apiClient from "./apiClient";

// ==================== LUỒNG CHO NGƯỜI ĐÃ ĐĂNG NHẬP ====================

export const authenticatedChatService = {
  // Chat với AI Bot (đã đăng nhập) - Lưu vào DB
  chatWithBot: (data: {
    message: string;
    image?: string;
    session_id?: string;
  }) => apiClient.post("/chat/auth/chat", data),

  // Tạo chat session (đã đăng nhập)
  createSession: (data: { device_id?: string; name?: string }) =>
    apiClient.post("/chat/auth/sessions", data),

  // Lấy lịch sử chat (đã đăng nhập)
  getChatHistory: (sessionId: string) =>
    apiClient.get(`/chat/auth/sessions/${sessionId}/history`),

  // Lấy gợi ý món ăn (cần đăng nhập)
  getMenuRecommendations: (params?: { preferences?: string }) =>
    apiClient.get("/chat/recommendations/menu", { params }),
};

// ==================== LUỒNG CHO KHÁCH CHƯA ĐĂNG NHẬP ====================

export const guestChatService = {
  // Chat với AI Bot (chưa đăng nhập) - Chỉ call AI, không lưu DB
  chatWithBot: (data: {
    message: string;
    image?: string;
    session_id?: string;
  }) => apiClient.post("/chat/guest/chat", data),

  // Tạo guest session (chưa đăng nhập)
  createSession: (data: { device_id?: string; name?: string }) =>
    apiClient.post("/chat/guest/sessions", data),
};

// ==================== APIS CHUNG ====================

export const commonChatService = {
  // Thông tin nhà hàng (không cần đăng nhập)
  getRestaurantInfo: () => apiClient.get("/chat/restaurant/info"),

  // Kiểm tra chatbot có sẵn sàng (không cần đăng nhập)
  checkAvailability: () => apiClient.get("/chat/bot/availability"),

  // Đóng chat session
  closeSession: (sessionId: string) =>
    apiClient.put(`/chat/sessions/${sessionId}/close`, {}),
};

// ==================== HELPER FUNCTIONS ====================

// Kiểm tra xem user có đăng nhập không
export const isUserAuthenticated = (): boolean => {
  // Implement logic to check if user is authenticated
  // This could check localStorage, cookies, or auth context
  return !!localStorage.getItem("auth_token");
};

// Lấy service phù hợp dựa trên trạng thái đăng nhập
export const getChatService = () => {
  return isUserAuthenticated() ? authenticatedChatService : guestChatService;
};

// Chat service chính - tự động chọn luồng phù hợp
export const chatFlowService = {
  // Chat với AI Bot - tự động chọn luồng
  chatWithBot: (data: {
    message: string;
    image?: string;
    session_id?: string;
  }) => {
    const service = getChatService();
    return service.chatWithBot(data);
  },

  // Tạo session - tự động chọn luồng
  createSession: (data: { device_id?: string; name?: string }) => {
    const service = getChatService();
    return service.createSession(data);
  },

  // Lấy lịch sử chat (chỉ cho người đã đăng nhập)
  getChatHistory: (sessionId: string) => {
    if (!isUserAuthenticated()) {
      throw new Error("User must be authenticated to access chat history");
    }
    return authenticatedChatService.getChatHistory(sessionId);
  },

  // Lấy gợi ý món ăn (chỉ cho người đã đăng nhập)
  getMenuRecommendations: (params?: { preferences?: string }) => {
    if (!isUserAuthenticated()) {
      throw new Error("User must be authenticated to get menu recommendations");
    }
    return authenticatedChatService.getMenuRecommendations(params);
  },

  // Các API chung
  ...commonChatService,
};

export default chatFlowService;
