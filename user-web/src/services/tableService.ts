"use client"

import { get } from "http"
import apiClient from "../lib/apiClient"

export interface TableAttributes {
  id: string;
  table_number: string;
  capacity: number;
  deposit: number;
  cancel_minutes: number;
  location?: any;
  status: "available" | "occupied" | "cleaning" | "reserved";
  panorama_urls?: string[];
  amenities?: any;
  description?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}


export const tableService = {
  getAllNoPagination: () => apiClient.get<any>('/tables?all=true'),
  getById: (id: string) => apiClient.get<{ data: TableAttributes }>(`/tables/${id}`),
  getArea:() => apiClient.get<any>('/master/restaurant/'),
}