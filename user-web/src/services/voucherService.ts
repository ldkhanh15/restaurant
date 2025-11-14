"use client";

import apiClient from "./apiClient";

export const voucherService = {
  getActiveVouchers: () => apiClient.get("/vouchers/active"),
  getById: (id: string) => apiClient.get(`/vouchers/${id}`),
};
