// services/tableService.ts
"use client"

import apiClient from "./apiClient"

export const tableService = {
  getAllNoPagination: () => apiClient.get<any>('/tables?all=true'),
  getArea:() => apiClient.get<any>('/master/restaurant/'),
}