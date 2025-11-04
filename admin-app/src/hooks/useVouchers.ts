import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import voucherAPI from '../api/voucherApi';

interface Voucher {
  id: string;
  code: string;
  name?: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  value: number | string;
  min_order_value?: number;
  max_uses?: number;
  current_uses?: number;
  expiry_date?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useVouchers = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVouchers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎟️ Hook: Fetching vouchers from API...');
      
      const response: any = await voucherAPI.getAll();
      
      // Handle response - unwrapped by interceptor
      const voucherData = Array.isArray(response) ? response : (response?.data || []);
      setVouchers(voucherData);
      
      console.log('✅ Hook: Vouchers loaded successfully:', voucherData.length);
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi tải danh sách voucher';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
      console.error('❌ Hook: Error fetching vouchers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createVoucher = useCallback(async (data: Partial<Voucher>) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎟️ Hook: Creating voucher:', data);
      
      const newVoucher: any = await voucherAPI.create({
        code: data.code || '',
        discount_type: data.discount_type || 'percentage',
        value: data.value || 0,
        min_order_value: data.min_order_value,
        max_uses: data.max_uses || 100,
        active: data.active !== false,
        expiry_date: data.expiry_date,
      });
      
      setVouchers(prev => [newVoucher as Voucher, ...prev]);
      Alert.alert('Thành công', 'Tạo voucher thành công!');
      console.log('✅ Hook: Voucher created successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi tạo voucher';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
      console.error('❌ Hook: Error creating voucher:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateVoucher = useCallback(async (id: string, data: Partial<Voucher>) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎟️ Hook: Updating voucher:', id, data);
      
      await voucherAPI.update(id, data);
      
      setVouchers(prev => prev.map(voucher => 
        voucher.id === id 
          ? { ...voucher, ...data, updated_at: new Date().toISOString() }
          : voucher
      ));
      
      Alert.alert('Thành công', 'Cập nhật voucher thành công!');
      console.log('✅ Hook: Voucher updated successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi cập nhật voucher';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
      console.error('❌ Hook: Error updating voucher:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteVoucher = useCallback(async (id: string) => {
    try {
      setLoading(true);
      
      console.log('🎟️ Hook: Deleting voucher:', id);
      
      await voucherAPI.remove(id);
      
      setVouchers(prev => prev.filter(voucher => voucher.id !== id));
      Alert.alert('Thành công', 'Xóa voucher thành công!');
      console.log('✅ Hook: Voucher deleted successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi xóa voucher';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
      console.error('❌ Hook: Error deleting voucher:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  return {
    vouchers,
    loading,
    error,
    fetchVouchers,
    createVoucher,
    updateVoucher,
    deleteVoucher,
    refresh
  };
};