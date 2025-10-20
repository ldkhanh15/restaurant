"use client";

import apiClient from "./apiClient";

export const reservationService = {
  list: (params?: { page?: number; limit?: number }) =>
    apiClient.get("/reservations", { params }),
  getById: (id: string) => apiClient.get(`/reservations/${id}`),
  create: (data: any) => apiClient.post("/reservations", data),
  update: (id: string, data: any) => apiClient.put(`/reservations/${id}`, data),
  remove: (id: string) => apiClient.delete(`/reservations/${id}`),
  confirm: (id: string) => apiClient.patch(`/reservations/${id}/confirm`, {}),
  setEvent: (id: string, payload: { event_id?: string; event_fee?: number }) =>
    apiClient.patch(`/reservations/${id}/event`, payload),
  createOrder: (
    id: string,
    payload?: { items?: { dish_id: string; quantity: number }[] }
  ) => apiClient.post(`/reservations/${id}/create-order`, payload ?? {}),
  addItem: (id: string, payload: { dish_id: string; quantity: number }) =>
    apiClient.post(`/reservations/${id}/items`, payload),
  checkin: (id: string) => apiClient.post(`/reservations/${id}/checkin`, {}),

  // New APIs
  getAvailableTables: (params: {
    seats: number;
    date?: string;
    time?: string;
  }) => apiClient.get("/reservations/tables/available", { params }),
  getTableStatus: () => apiClient.get("/reservations/tables/status"),
  cancel: (id: string, reason?: string) =>
    apiClient.patch(`/reservations/${id}/cancel`, { reason }),
  processDepositPayment: (
    id: string,
    data: { amount: number; payment_method: string }
  ) => apiClient.post(`/reservations/${id}/deposit-payment`, data),
  getStats: (params?: { start_date?: string; end_date?: string }) =>
    apiClient.get("/reservations/stats/overview", { params }),
  getByDateRange: (params: { start_date: string; end_date: string }) =>
    apiClient.get("/reservations/date-range", { params }),
  getAllReservations: (params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => apiClient.get("/reservations", { params }),
  updateReservationStatus: (id: string, status: string) =>
    apiClient.put(`/reservations/${id}/status`, { status }),
  cancelReservation: (id: string, reason?: string) =>
    apiClient.patch(`/reservations/${id}/cancel`, { reason }),
  checkInReservation: (id: string) =>
    apiClient.post(`/reservations/${id}/checkin`, {}),

  // ==================== CHAT INTEGRATION APIs ====================

  // API cho Chat: Lấy đặt bàn của user
  getMyReservationsForChat: (params?: { limit?: number }) =>
    apiClient.get("/reservations/chat/my-reservations", { params }),

  // API cho Chat: Lấy chi tiết đặt bàn
  getReservationDetailsForChat: (reservationId: string) =>
    apiClient.get(`/reservations/chat/${reservationId}/details`),

  // API cho Chat: Tạo đặt bàn từ chat
  createReservationFromChat: (data: {
    table_id: string;
    reservation_time: string;
    num_people: number;
    preferences?: any;
    deposit_amount?: number;
  }) => apiClient.post("/reservations/chat/create", data),

  // API cho Chat: Lấy bàn trống (không cần đăng nhập)
  getAvailableTablesForChat: (params: {
    seats: number;
    date?: string;
    time?: string;
  }) => apiClient.get("/reservations/chat/available-tables", { params }),

  // ==================== ENHANCED RESERVATION MANAGEMENT APIs ====================

  // Lấy bàn trống (enhanced)
  getAvailableTables: () => apiClient.get("/tables/available"),

  // Lấy nhóm bàn trống
  getAvailableTableGroups: () => apiClient.get("/table-groups/available"),

  // Tạo đặt bàn (enhanced)
  createReservation: (data: {
    user_id?: string;
    table_id: string;
    table_group_id?: string;
    reservation_time: string;
    num_people: number;
    preferences?: any;
    deposit_amount?: number;
    notes?: string;
  }) => apiClient.post("/reservations", data),

  // Cập nhật đặt bàn (enhanced)
  updateReservation: (
    id: string,
    data: {
      user_id?: string;
      table_id?: string;
      table_group_id?: string;
      reservation_time?: string;
      num_people?: number;
      preferences?: any;
      deposit_amount?: number;
      notes?: string;
    }
  ) => apiClient.put(`/reservations/${id}`, data),

  // Xóa đặt bàn (enhanced)
  deleteReservation: (id: string) => apiClient.delete(`/reservations/${id}`),
};

export type Reservation = { id: string };
