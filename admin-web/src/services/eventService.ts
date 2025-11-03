"use client"

import apiClient from "./apiClient"

export const eventService = {
    getAll: () => apiClient.get("/events"),
    getById: (id: string) => apiClient.get(`/events/${id}`),
    create: (data: any) => apiClient.post("/events", data),
    update: (id: string, data: any) => apiClient.put(`/events/${id}`, data),
    remove: (id: string) => apiClient.delete(`/events/${id}`),
    getAllNoPaging: () => apiClient.get("/events?all=true"),
}

export type Event = {
    id: string
    name: string
    description?: string
    price?: number
    inclusions?: any
    decorations?: any
    created_at?: Date
    deleted_at?: Date | null
}


