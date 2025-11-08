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

  getActive: async (): Promise<{ status: string; data: Event[] }> => {
    const response = await apiClient.get<any>(`/events`, {
      params: { all: true },
    });

    const payload = response ?? {};
    const rawEvents: Event[] = Array.isArray(payload?.data?.data)
      ? (payload.data.data as Event[])
      : Array.isArray(payload?.data)
      ? (payload.data as Event[])
      : Array.isArray(payload?.items)
      ? (payload.items as Event[])
      : Array.isArray(payload)
      ? (payload as Event[])
      : [];

    const now = new Date();
    const activeEvents = rawEvents.filter((event) => {
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);
      return now >= startDate && now <= endDate;
    });

    const sortedEvents = activeEvents.sort(
      (a, b) =>
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );

    return { status: payload?.status ?? "success", data: sortedEvents };
  },
};
