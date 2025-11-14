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

export interface AvailableTimeSlot {
  start: string;
  end: string;
}

export interface TableWithTimeSlots extends TableAttributes {
  available_time_slots?: AvailableTimeSlot[];
}

export const tableService = {
  getAll: (params?: any) => apiClient.get<any>("/tables", { params }),
  getAllNoPagination: () => apiClient.get<any>("/tables?all=true"),
  getAvailableForReservation: (params?: {
    num_people?: number;
    date?: string;
    duration_minutes?: number;
  }) =>
    apiClient.get<{ status: string; data: TableWithTimeSlots[] }>(
      "/tables/available",
      { params }
    ),
  getAvailableTimeSlots: (
    tableId: string,
    params?: { date?: string; duration_minutes?: number }
  ) =>
    apiClient.get<{
      status: string;
      data: {
        table_id: string;
        date: string;
        duration_minutes: number;
        available_time_slots: AvailableTimeSlot[];
      };
    }>(`/tables/${tableId}/available-time-slots`, { params }),
  getById: (id: string) =>
    apiClient.get<{ status: string; data: TableAttributes }>(`/tables/${id}`),
  getArea: () => apiClient.get<any>("/master/restaurant/"),
  getQRCode: (id: string) =>
    apiClient.get<{ status: string; data: TableQRCodeResponse }>(
      `/tables/${id}/qr-code`
    ),
};
