import apiClient from "@/lib/apiClient";

export interface Table {
  id: string;
  table_number: string;
  capacity: number;
  deposit: number;
  cancel_minutes: number;
  location?: {
    area?: string;
    floor?: number;
    coordinates?: {
      x: number;
      y: number;
    };
  };
  status: "available" | "occupied" | "cleaning" | "reserved";
  panorama_urls?: string[];
  amenities?: string[];
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface TableListResponse {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  items: Table[];
}

export const tableService = {
  getAll: (params?: {
    all?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
  }): Promise<{
    status: string;
    data: Table[] | TableListResponse;
    count?: number;
  }> => apiClient.get(`/tables`, { params }),

  getById: (id: string): Promise<{ status: string; data: Table }> =>
    apiClient.get(`/tables/${id}`),

  search: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    capacity?: number;
    search?: string;
  }): Promise<{ status: string; data: TableListResponse }> =>
    apiClient.get(`/tables/search`, { params }),

  getByStatus: (
    status: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<{ status: string; data: TableListResponse }> =>
    apiClient.get(`/tables/status/${status}`, { params }),
};
