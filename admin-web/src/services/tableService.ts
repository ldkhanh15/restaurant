"use client"

import apiClient from "./apiClient"

export const tableService = {
    getAll: (params?: any) => apiClient.get("/tables", { params }),
    getById: (id: string) => apiClient.get(`/tables/${id}`),
    getByStatus: (status: string) => apiClient.get(`/tables/status/${status}`),
    create: (data: any) => apiClient.post("/tables", data),
    update: (id: string, data: any) => apiClient.put(`/tables/${id}`, data),
    remove: (id: string) => apiClient.delete(`/tables/${id}`),
    getAllNoPaging: () => apiClient.get("/tables?all=true",),


    getAllTableGroup:() => apiClient.get("/tables/table-group"),
    getTableGroupById:(id:string) => apiClient.get(`/tables/table-group/${id}`),
    createGroup: (data: any) => apiClient.post("/tables/table-group", data),
    updateGroup: (id: string, data: any) => apiClient.put(`/tables/table-group/${id}`, data),
    removeGroup: (id: string) => apiClient.delete(`/tables/table-group/${id}`)
}


export interface Table {
  id: string
  table_number: string
  capacity: number
  deposit: number
  cancel_minutes: number
  location?: any
  status: "available" | "occupied" | "cleaning" | "reserved"
  panorama_urls?: any
  amenities?: any
  description?: string
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}

export interface TableGroup {
    id: string
    group_name: string
    table_ids: string[]
    total_capacity: number
    deposit: number
    cancel_minutes: number
    status: "available" | "occupied" | "cleaning" | "reserved"
    created_at?: Date
    updated_at?: Date
    deleted_at?: Date | null
}
