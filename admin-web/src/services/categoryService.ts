"use client"

import apiClient from "./apiClient"

export const categoryService = {
    getAll: () => apiClient.get("/categories"),
    getById: (id: string) => apiClient.get(`/categories/${id}`),
    create: (data: any) => apiClient.post("/categories", data),
    update: (id: string, data: any) => apiClient.put(`/categories/${id}`, data),
    remove: (id: string) => apiClient.delete(`/categories/${id}`),
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


