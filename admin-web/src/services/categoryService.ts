"use client"

import apiClient from "./apiClient"

export const categoryService = {
    getAll: () => apiClient.get("/categories"),
    getById: (id: string) => apiClient.get(`/categories/${id}`),
    create: (data: any) => apiClient.post("/categories", data),
    update: (id: string, data: any) => apiClient.put(`/categories/${id}`, data),
    remove: (id: string) => apiClient.delete(`/categories/${id}`),
}

export type Category = {
    id: string
    name: string
    description: string | null
    active: boolean
    created_at: string | null
    deleted_at?: string | null
}


