"use client"

import apiClient from "./apiClient"

export const dishService = {
    getAll: (params?: any) => apiClient.get("/dishes",{ params }),
    getById: (id: string) => apiClient.get(`/dishes/${id}`),
    create: (data: any) => apiClient.post("/dishes", data),
    update: (id: string, data: any) => apiClient.put(`/dishes/${id}`, data),
    remove: (id: string) => apiClient.delete(`/dishes/${id}`),
    getDishesByCategoryId: (id: string) => apiClient.get(`/dishes/category/${id}`),
    importIngredients:(data:any) => apiClient.post('dishes/ingredients',data),
   
}

export type Dish = {
    id: string
    name: string
    description: string
    price: number
    category_id: string
    media_urls: any
    is_best_seller: boolean
    seasonal: boolean
    active: boolean
    created_at:string
    updated_at:string
    deleted_at: string| null
}


