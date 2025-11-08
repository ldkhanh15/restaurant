import apiClient from "../lib/apiClient"

export type Category = {
    id: string
    name: string
    description: string
    active: boolean
    created_at: string
    updated_at: string
    deleted_at: string | null
}

export const categoryService = {
    getAll: () => apiClient.get('/categories'),
    getById: (id: string) => apiClient.get(`/categories/${id}`),
}

export default categoryService