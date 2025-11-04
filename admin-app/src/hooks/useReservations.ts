import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import reservationAPI from '../api/reservationApi';

// Types
export interface Reservation {
  id: string;
  user_id: string;
  user_name?: string;
  user_phone?: string;
  user_email?: string;
  table_id: string;
  table_number?: string;
  reservation_time: string;
  num_people: number;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  preferences?: any;
  deposit_amount?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateReservationRequest {
  user_id?: string;
  table_id: string;
  reservation_time: string;
  num_people: number;
  notes?: string;
  preferences?: any;
  deposit_amount?: number;
  duration_minutes?: number;
  status?: string;
}

// Reservations Hook with Real API integration
export const useReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchReservations = useCallback(async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    date?: string;
    search?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📅 Hook: Fetching reservations from API...', params);
      
      const response: any = await reservationAPI.list(params);
      
      // Handle response structure: response might be { data: [...], total: X } or just [...]
      if (Array.isArray(response)) {
        setReservations(response);
        setTotal(response.length);
      } else if (response && response.data) {
        setReservations(response.data);
        setTotal(response.total || response.data.length);
      } else {
        setReservations([]);
        setTotal(0);
      }
      
      console.log('✅ Hook: Reservations loaded successfully');
      
      return {
        reservations: Array.isArray(response) ? response : (response?.data || []),
        total: response?.total || (Array.isArray(response) ? response.length : 0)
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi tải danh sách đặt bàn';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
      console.error('❌ Hook: Error fetching reservations:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createNewReservation = useCallback(async (reservationData: CreateReservationRequest) => {
    try {
      setLoading(true);
      console.log('📅 Hook: Creating new reservation...', reservationData);
      
      const newReservation: any = await reservationAPI.create(reservationData);
      
      setReservations(prev => [newReservation as Reservation, ...prev]);
      
      Alert.alert('Thành công', 'Tạo đặt bàn mới thành công!');
      console.log('✅ Hook: Reservation created successfully');
      
      return newReservation as Reservation;
    } catch (err: any) {
      const errorMessage = err.message || 'Không thể tạo đặt bàn mới';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
      console.error('❌ Hook: Error creating reservation:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (reservationId: string, status: Reservation['status']) => {
    try {
      setLoading(true);
      console.log('📅 Hook: Updating reservation status...', { reservationId, status });
      
      const updatedReservation = await reservationAPI.updateStatus(reservationId, status);
      
      setReservations(prev => 
        prev.map(reservation => 
          reservation.id === reservationId 
            ? { ...reservation, ...updatedReservation, status, updated_at: new Date().toISOString() }
            : reservation
        )
      );
      
      Alert.alert('Thành công', 'Cập nhật trạng thái thành công!');
      console.log('✅ Hook: Reservation status updated successfully');
      
      return updatedReservation;
    } catch (err: any) {
      const errorMessage = err.message || 'Không thể cập nhật trạng thái';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
      console.error('❌ Hook: Error updating reservation status:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteReservationById = useCallback(async (reservationId: string) => {
    try {
      setLoading(true);
      console.log('📅 Hook: Deleting reservation...', reservationId);
      
      await reservationAPI.remove(reservationId);
      
      setReservations(prev => prev.filter(reservation => reservation.id !== reservationId));
      
      Alert.alert('Thành công', 'Xóa đặt bàn thành công!');
      console.log('✅ Hook: Reservation deleted successfully');
    } catch (err: any) {
      const errorMessage = err.message || 'Không thể xóa đặt bàn';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
      console.error('❌ Hook: Error deleting reservation:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchReservations();
  }, [fetchReservations]);

  return {
    reservations,
    loading,
    error,
    total,
    fetchReservations,
    createNewReservation,
    updateStatus,
    deleteReservationById,
    refresh,
  };
};