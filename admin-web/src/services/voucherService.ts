"use client"

import apiClient from "./apiClient"

export const voucherService = {
    getAll: () => apiClient.get("/vouchers"),
    getById: (id: string) => apiClient.get(`/vouchers/${id}`),
    create: (data: any) => apiClient.post("/vouchers", data),
    update: (id: string, data: any) => apiClient.put(`/vouchers/${id}`, data),
    remove: (id: string) => apiClient.delete(`/vouchers/${id}`),
}

export type Voucher = {
    id: string
    code: string
    discount_type: "percentage" | "fixed"
    value: string | number
    min_order_value: number | null
    current_uses: number
    max_uses: number
    active: boolean
    created_at: string | null
    expiry_date?: string | null
    deleted_at?: string | null
}


