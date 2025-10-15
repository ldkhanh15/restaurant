"use client"

import apiClient from "./apiClient"

export const ingredientService = {
    getAll: () => apiClient.get("/ingredients"),
    getById: (id: string) => apiClient.get(`/ingredients/${id}`),
    create: (data: any) => apiClient.post("/ingredients", data),
    update: (id: string, data: any) => apiClient.put(`/ingredients/${id}`, data),
    remove: (id: string) => apiClient.delete(`/ingredients/${id}`),
    getAllNoPaging: () => apiClient.get("/ingredients?all=true"),
}

export type Ingredient = {
    id: string
    name: string
    unit: string
    barcode?: string
    rfid?: string
    min_stock_level: number
    current_stock: number
    created_at?: string
    updated_at?: string
    deleted_at?: string | null
}


