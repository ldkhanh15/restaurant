import apiClient from "../lib/apiClient"

export type Dish = {
    id: string
    name: string
    description: string
    price: number
    category_id: string
    media_urls: string[]
    is_best_seller: boolean
    seasonal: boolean
    active: boolean
    created_at: string
    updated_at: string
    deleted_at: string | null
}

export const dishService = {
    getAll: (params: any) => apiClient.get('/dishes', { params }),
    getById: (id: string) => apiClient.get(`/dishes/${id}`),
    search: (query: string) => apiClient.get(`/dishes/search?q=${query}`),
    getByCategory: (categoryId: string) => apiClient.get(`/dishes/category/${categoryId}`),
}

export default dishService
