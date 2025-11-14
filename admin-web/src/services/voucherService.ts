"use client"

import apiClient from "./apiClient"

export const voucherService = {
    getAll: () => apiClient.get("/vouchers"),
    getById: (id: string) => apiClient.get(`/vouchers/${id}`),
    create: (data: any) => apiClient.post("/vouchers", data),
    update: (id: string, data: any) => apiClient.put(`/vouchers/${id}`, data),
    remove: (id: string) => apiClient.delete(`/vouchers/${id}`),
}



