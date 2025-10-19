"use client";

import apiClient from "./apiClient";

export const paymentService = {
  // VNPay flows
  vnpayCreate: (payload: { order_id: string; bankCode?: string }) =>
    apiClient.post("/payments/vnpay/create", payload),
  vnpayReturn: (params: Record<string, any>) =>
    apiClient.get("/payments/vnpay/return", { params }),
  vnpayIpn: (payload: any) => apiClient.post("/payments/vnpay/ipn", payload),
  vnpayDepositOrder: (payload: {
    order_id: string;
    amount: number;
    bankCode?: string;
  }) => apiClient.post("/payments/vnpay/deposit/order", payload),
  vnpayDepositReservation: (payload: {
    reservation_id: string;
    amount: number;
    bankCode?: string;
  }) => apiClient.post("/payments/vnpay/deposit/reservation", payload),
  // Payments CRUD
  list: () => apiClient.get("/payments"),
  search: (params?: Record<string, any>) =>
    apiClient.get("/payments/search", { params }),
  getById: (id: string) => apiClient.get(`/payments/${id}`),
  create: (data: any) => apiClient.post("/payments", data),
  update: (id: string, data: any) => apiClient.put(`/payments/${id}`, data),
  remove: (id: string) => apiClient.delete(`/payments/${id}`),
};

export type Payment = {
  id: string;
  amount: number;
  method: "cash" | "credit_card" | "momo" | "vnpay" | "zalopay" | "card" | "qr";
  status: "pending" | "completed" | "failed";
  order_id?: string;
  reservation_id?: string;
};
