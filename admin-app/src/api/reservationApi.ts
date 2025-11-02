import api from './axiosConfig';

// Types
export interface Reservation {
  id: string;
  user_id: string;
  table_id: string;
  table_group_id?: string;
  reservation_time: string;
  num_people: number;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  preferences?: any;
  deposit_amount?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateReservationData {
  user_id?: string;
  table_id: string;
  table_group_id?: string;
  reservation_time: string;
  num_people: number;
  preferences?: any;
  deposit_amount?: number;
  notes?: string;
}

export interface UpdateReservationData {
  user_id?: string;
  table_id?: string;
  table_group_id?: string;
  reservation_time?: string;
  num_people?: number;
  preferences?: any;
  deposit_amount?: number;
  notes?: string;
}

export interface ReservationFilters {
  page?: number;
  limit?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface TableAvailability {
  seats: number;
  date?: string;
  time?: string;
}

const reservationAPI = {
  // Basic CRUD
  list: (params?: ReservationFilters) => 
    api.get('/reservations', { params }),
  
  getById: (id: string) => 
    api.get(`/reservations/${id}`),
  
  create: (data: CreateReservationData) => 
    api.post('/reservations', data),
  
  update: (id: string, data: UpdateReservationData) => 
    api.put(`/reservations/${id}`, data),
  
  remove: (id: string) => 
    api.delete(`/reservations/${id}`),

  // Status management
  confirm: (id: string) => 
    api.patch(`/reservations/${id}/confirm`, {}),
  
  cancel: (id: string, reason?: string) => 
    api.patch(`/reservations/${id}/cancel`, { reason }),
  
  checkin: (id: string) => 
    api.post(`/reservations/${id}/checkin`, {}),
  
  updateStatus: (id: string, status: string) => 
    api.put(`/reservations/${id}/status`, { status }),

  // Event management
  setEvent: (id: string, payload: { event_id?: string; event_fee?: number }) => 
    api.patch(`/reservations/${id}/event`, payload),

  // Order management
  createOrder: (id: string, payload?: { items?: { dish_id: string; quantity: number }[] }) => 
    api.post(`/reservations/${id}/create-order`, payload ?? {}),
  
  addItem: (id: string, payload: { dish_id: string; quantity: number }) => 
    api.post(`/reservations/${id}/items`, payload),

  // Payment
  processDepositPayment: (id: string, data: { amount: number; payment_method: string }) => 
    api.post(`/reservations/${id}/deposit-payment`, data),

  // Table management
  getAvailableTables: (params?: TableAvailability) => 
    api.get('/tables/available', { params }),
  
  getTableStatus: () => 
    api.get('/reservations/tables/status'),
  
  getAvailableTableGroups: () => 
    api.get('/table-groups/available'),

  // Statistics & Reports
  getStats: (params?: { start_date?: string; end_date?: string }) => 
    api.get('/reservations/stats/overview', { params }),
  
  getByDateRange: (params: { start_date: string; end_date: string }) => 
    api.get('/reservations/date-range', { params }),
};

export default reservationAPI;
