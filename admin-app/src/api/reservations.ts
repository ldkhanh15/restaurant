import api from './axiosConfig';

// Reservations API
export interface Reservation {
  id: string;
  user_id?: string;
  table_id?: string;
  reservation_time: string;
  duration_minutes: number;
  num_people: number;
  preferences?: {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    notes?: string;
    specialRequests?: string;
  };
  status: 'pending' | 'confirmed' | 'cancelled' | 'no_show';
  timeout_minutes: number;
  confirmation_sent: boolean;
  deposit_amount?: number;
  created_at: string;
  updated_at?: string;
  
  // Computed properties for UI compatibility
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  date?: string;
  time?: string;
  partySize?: number;
  tableNumber?: string;
  notes?: string;
  specialRequests?: string;
}

export interface Table {
  id: string; // UUID in backend
  table_number: string; // B01, B02, VIP01 etc
  capacity: number;
  deposit: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
}

export interface CreateReservationRequest {
  user_id?: string;
  table_id?: string;
  reservation_time: string; // ISO datetime string
  num_people: number;
  duration_minutes?: number;
  preferences?: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    notes?: string;
    specialRequests?: string;
  };
  status?: 'pending' | 'confirmed' | 'cancelled' | 'no_show';
}

export interface ReservationsResponse {
  reservations: Reservation[];
  total: number;
  page: number;
  limit: number;
}

export interface TablesResponse {
  tables: Table[];
  total: number;
}

// Reservations API
export const getReservations = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  date?: string;
  search?: string;
}): Promise<ReservationsResponse> => {
  try {
    console.log('🔄 Fetching reservations with params:', params);
    console.log('🔗 API Base URL:', api.defaults.baseURL);
    const response = await api.get('/reservations', { params });
    console.log('✅ Reservations API response:', response.data);
    console.log('📊 Reservations count:', response.data?.reservations?.length || 0);
    return response.data;
  } catch (error: any) {
    console.error('❌ Reservations API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url
    });
    throw new Error(error.response?.data?.message || 'Không thể tải danh sách đặt bàn');
  }
};

export const getReservationById = async (id: string): Promise<Reservation> => {
  try {
    const response = await api.get(`/reservations/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Không thể tải thông tin đặt bàn');
  }
};

export const createReservation = async (data: CreateReservationRequest): Promise<Reservation> => {
  try {
    console.log('🔄 Creating reservation...');
    const response = await api.post('/reservations', data);
    console.log('✅ Reservation created successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.log('❌ Error creating reservation:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Không thể tạo đặt bàn');
  }
};

export const updateReservation = async (id: string, data: Partial<CreateReservationRequest>): Promise<Reservation> => {
  try {
    console.log('🔄 Updating reservation...');
    const response = await api.put(`/reservations/${id}`, data);
    console.log('✅ Reservation updated successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.log('❌ Error updating reservation:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Không thể cập nhật đặt bàn');
  }
};

export const updateReservationStatus = async (id: string, status: Reservation['status']): Promise<Reservation> => {
  try {
    console.log('🔄 Updating reservation status...');
    const response = await api.patch(`/reservations/${id}/status`, { status });
    console.log('✅ Reservation status updated successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.log('❌ Error updating reservation status:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Không thể cập nhật trạng thái đặt bàn');
  }
};

export const deleteReservation = async (id: string): Promise<void> => {
  try {
    console.log('🔄 Deleting reservation...');
    await api.delete(`/reservations/${id}`);
    console.log('✅ Reservation deleted successfully');
  } catch (error: any) {
    console.log('❌ Error deleting reservation:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Không thể xóa đặt bàn');
  }
};

// Tables API
export const getTables = async (params?: {
  status?: string;
}): Promise<TablesResponse> => {
  try {
    console.log('🔄 Fetching tables with params:', params);
    console.log('🔗 API Base URL:', api.defaults.baseURL);
    const response = await api.get('/tables', { params });
    console.log('✅ Tables API response:', response.data);
    console.log('🏪 Tables count:', response.data?.tables?.length || 0);
    return response.data;
  } catch (error: any) {
    console.error('❌ Tables API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url
    });
    throw new Error(error.response?.data?.message || 'Không thể tải danh sách bàn');
  }
};

export const getTableById = async (id: string): Promise<Table> => {
  try {
    const response = await api.get(`/tables/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Không thể tải thông tin bàn');
  }
};

export const updateTableStatus = async (id: string, status: Table['status']): Promise<Table> => {
  try {
    console.log('🔄 Updating table status...');
    const response = await api.patch(`/tables/${id}/status`, { status });
    console.log('✅ Table status updated successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.log('❌ Error updating table status:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Không thể cập nhật trạng thái bàn');
  }
};