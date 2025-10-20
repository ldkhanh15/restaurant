"use client"

import apiClient from "./apiClient"

export const supplierService = {
    getAll: () => apiClient.get("/suppliers"),
    getById: (id: string) => apiClient.get(`/suppliers/${id}`),
    create: (data: any) => apiClient.post("/suppliers", data),
    update: (id: string, data: any) => apiClient.put(`/suppliers/${id}`, data),
    remove: (id: string) => apiClient.delete(`/suppliers/${id}`),
}

export type Supplier = {
    id: string
    name: string | number
    contact: number | null
    created_at: string | null
    deleted_at?: string | null
}


