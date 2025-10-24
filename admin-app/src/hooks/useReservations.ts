import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { 
  getReservations, 
  createReservation, 
  updateReservationStatus, 
  deleteReservation,
  Reservation,
  CreateReservationRequest 
} from '../api/reservations';

// Simple Reservations Hook with API integration
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
      
      console.log('📅 Hook: Fetching reservations...');
      const response = await getReservations(params);
      
      const reservationsData = response.reservations || [];
      setReservations(reservationsData);
      setTotal(response.total || 0);
      console.log('✅ Hook: Reservations loaded successfully:', reservationsData.length);
      
      return {
        reservations: reservationsData,
        total: response.total || 0
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
      console.log('📅 Hook: Creating new reservation...');
      
      const newReservation = await createReservation(reservationData);
      
      // Add to local state
      setReservations(prev => [newReservation, ...prev]);
      
      Alert.alert('Thành công', 'Tạo đặt bàn mới thành công!');
      console.log('✅ Hook: Reservation created successfully');
      
      return newReservation;
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
      console.log('📅 Hook: Updating reservation status...');
      
      const updatedReservation = await updateReservationStatus(reservationId, status);
      
      // Update local state
      setReservations(prev => 
        prev.map(reservation => 
          reservation.id === reservationId ? updatedReservation : reservation
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
      console.log('📅 Hook: Deleting reservation...');
      
      await deleteReservation(reservationId);
      
      // Remove from local state
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