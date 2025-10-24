import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

interface Voucher {
  id: string;
  code: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order?: number;
  usage_limit?: number;
  usage_count?: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Mock data - will be replaced with API when available
const mockVouchers: Voucher[] = [
  {
    id: '1',
    code: 'WEEKEND20',
    name: 'Giảm giá cuối tuần',
    description: 'Giảm 20% cho tất cả món ăn vào cuối tuần',
    type: 'percentage',
    value: 20,
    min_order: 200000,
    usage_limit: 100,
    usage_count: 67,
    start_date: '2024-03-15',
    end_date: '2024-03-31',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    code: 'NEWUSER50',
    name: 'Khuyến mãi khách hàng mới',
    description: 'Giảm 50,000đ cho đơn hàng đầu tiên',
    type: 'fixed',
    value: 50000,
    min_order: 100000,
    usage_limit: 50,
    usage_count: 23,
    start_date: '2024-03-01',
    end_date: '2024-04-30',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const useVouchers = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>(mockVouchers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVouchers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎟️ Hook: Fetching vouchers (mock data)...');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setVouchers(mockVouchers);
      console.log('✅ Hook: Vouchers loaded successfully:', mockVouchers.length);
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
      
      console.log('🎟️ Hook: Creating voucher (mock):', data);
      
      const newVoucher: Voucher = {
        id: Math.random().toString(),
        code: data.code || '',
        name: data.name || '',
        description: data.description || '',
        type: data.type || 'percentage',
        value: data.value || 0,
        min_order: data.min_order,
        usage_limit: data.usage_limit,
        usage_count: 0,
        start_date: data.start_date || new Date().toISOString(),
        end_date: data.end_date || new Date().toISOString(),
        is_active: data.is_active !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setVouchers(prev => [newVoucher, ...prev]);
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
      
      console.log('🎟️ Hook: Updating voucher (mock):', id, data);
      
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
      
      console.log('🎟️ Hook: Deleting voucher (mock):', id);
      
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