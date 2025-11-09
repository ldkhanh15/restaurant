import apiClient from "@/lib/apiClient";

export interface Event {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  fee?: number;
  active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventListResponse {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  items: Event[];
}

export const eventService = {
  getAll: (params?: {
    all?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
  }): Promise<{
    status: string;
    data: Event[] | EventListResponse;
    count?: number;
  }> => apiClient.get(`/events`, { params }),

  getById: (id: string): Promise<{ status: string; data: Event }> =>
    apiClient.get(`/events/${id}`),

  getActive: async (): Promise<{ status: string; data: Event[] }> =>
    apiClient.get<any>(`/events`, {
      params: { all: true },
    })
};
