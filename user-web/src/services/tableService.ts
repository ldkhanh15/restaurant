"use client";

import apiClient from "@/lib/apiClient";

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

export interface TableQRCodeResponse {
  table_id: string;
  table_number: string;
  qr_code_url: string;
}

export const tableService = {
  getAllNoPagination: () => apiClient.get<any>("/tables?all=true"),
  getById: (id: string) =>
    apiClient.get<{ status: string; data: TableAttributes }>(`/tables/${id}`),
  getArea: () => apiClient.get<any>("/master/restaurant/"),
  getQRCode: (id: string) =>
    apiClient.get<{ status: string; data: TableQRCodeResponse }>(
      `/tables/${id}/qr-code`
    ),
};
