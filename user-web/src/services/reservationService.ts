import apiClient from "@/lib/apiClient";

export interface Reservation {
  id: string;
  user_id?: string;
  customer_id?: string;
  table_id?: string;
  table_group_id?: string;
  reservation_time: string;
  duration_minutes?: number;
  num_people: number;
  preferences?: any;
  event_id?: string;
  event_fee?: number;
  deposit_amount?: number;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  timeout_minutes?: number;
  confirmation_sent?: boolean;
  pre_order_items?: Array<{
    dish_id: string;
    quantity: number;
    dish?: {
      id: string;
      name: string;
      price: number;
      media_urls: string[];
      description?: string;
    };
  }>;
  created_at: string;
  updated_at: string;
  user?: any;
  table?: any;
  table_group?: any;
  event?: any;
  orders?: any[];
  payments?: any[];
}

export interface CreateReservationData {
  table_id: string;
  reservation_time: string;
  duration_minutes?: number;
  num_people: number;
  preferences?: any;
  event_id?: string;
  pre_order_items?: Array<{
    dish_id: string;
    quantity: number;
  }>;
}

export interface UpdateReservationData {
  table_id?: string;
  reservation_time?: string;
  duration_minutes?: number;
  num_people?: number;
  preferences?: any;
  event_id?: string;
  pre_order_items?: Array<{
    dish_id: string;
    quantity: number;
  }>;
}

export interface ReservationListResponse {
  data: Reservation[];
  pagination: {
    total_items: number;
    total_pages: number;
    current_page: number;
    page_size: number;
  };
}

export const reservationService = {
  // Get my reservations (user-specific)
  getMyReservations: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    date?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<{ status: string; data: ReservationListResponse }> =>
    apiClient.get("/reservations/my-reservations", { params }),

  // Get single reservation by ID
  getReservationById: (
    reservationId: string
  ): Promise<{ status: string; data: Reservation }> =>
    apiClient.get(`/reservations/${reservationId}`),

  // Create new reservation
  createReservation: (
    data: CreateReservationData
  ): Promise<{
    status: string;
    data: {
      reservation: Reservation;
      requires_payment?: boolean;
      payment_url?: { url: string; txnRef?: string };
      deposit_amount?: number;
    };
  }> => apiClient.post("/reservations", data),

  // Update reservation
  updateReservation: (
    reservationId: string,
    data: UpdateReservationData
  ): Promise<{ status: string; data: Reservation }> =>
    apiClient.patch(`/reservations/${reservationId}`, data),

  // Cancel reservation
  cancelReservation: (
    reservationId: string,
    reason?: string
  ): Promise<{ status: string; data: Reservation }> =>
    apiClient.post(`/reservations/${reservationId}/cancel`, { reason }),

  // Check-in reservation
  checkInReservation: (
    reservationId: string
  ): Promise<{
    status: string;
    data: { reservation: Reservation; order: any };
  }> => apiClient.post(`/reservations/${reservationId}/checkin`),

  // Reservation dish management
  addDishToReservation: (
    reservationId: string,
    dishId: string,
    quantity: number
  ): Promise<{ status: string; data: Reservation }> =>
    apiClient.post(`/reservations/${reservationId}/dishes`, {
      dish_id: dishId,
      quantity,
    }),

  updateDishQuantity: (
    reservationId: string,
    dishId: string,
    quantity: number
  ): Promise<{ status: string; data: Reservation }> =>
    apiClient.patch(`/reservations/${reservationId}/dishes/${dishId}`, {
      quantity,
    }),

  removeDishFromReservation: (
    reservationId: string,
    dishId: string
  ): Promise<{ status: string; data: Reservation }> =>
    apiClient.delete(`/reservations/${reservationId}/dishes/${dishId}`),
};
