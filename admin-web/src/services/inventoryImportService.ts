"use client"

import apiClient from "./apiClient"

export interface InventoryIngredient {
  id: string
  ingredient_id: string
  quantity: number
  total_price: number
  inventory_imports_id?: string
}

export interface InventoryImport {
  id: string
  reason?: string
  total_price: number
  employee_id?: string
  supplier_id?: string
  timestamp?: string
  ingredients?: InventoryIngredient[]
}

export const inventoryImportService = {
    getAll: (params?: any) => apiClient.get("/inventories",{ params }),
    getById: (id: string) => apiClient.get(`/inventories/${id}`),
    create: (data:any) => apiClient.post("/inventories", data),
    update: (id: string, data: any) => apiClient.put(`/inventories/${id}`, data),
    remove: (id: string) => apiClient.delete(`/inventories/${id}`),
    addIngredients: (data: { 
      inventory_imports_id: string, 
      ingredients: any
    }) => apiClient.post(`/inventories/ingredient`, data),
    updateInventoryIngredients: (
      id: string, 
      ingredients: Omit<InventoryIngredient, 'inventory_imports_id'>[]
    ) => apiClient.put(`/inventories/ingredient/${id}`, { ingredients }),
    getAllNoPaging: () => apiClient.get("/ingredients?all=true"),
}


