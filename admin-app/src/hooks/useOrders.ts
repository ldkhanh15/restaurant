import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { 
  getOrders, 
  getOrderById, 
  createOrder, 
  updateOrderStatus,
  updateOrderItemStatus,
  deleteOrder,
  Order,
  OrdersResponse,
  OrderFilters as ApiOrderFilters 
} from '../api/orders';

interface OrderFilters {
  date?: string;
  status?: "pending" | "preparing" | "ready" | "delivered" | "cancelled";
  user_id?: number;
  table_id?: number;
  page?: number;
  limit?: number;
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
  });

  const fetchOrders = useCallback(async (filters?: OrderFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📋 Hook: Fetching orders with filters:', filters);
      const response = await getOrders(filters as ApiOrderFilters);
      
      const ordersData = response.orders || [];
      
      setOrders(ordersData);
      setPagination({
        total: response.total || 0,
        totalPages: Math.ceil((response.total || 0) / (filters?.limit || 10)),
        currentPage: filters?.page || 1,
      });
      console.log('✅ Hook: Orders loaded successfully:', ordersData.length);
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi tải danh sách đơn hàng';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
      console.error('❌ Hook: Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (orderId: number, status: "pending" | "preparing" | "ready" | "delivered" | "cancelled"): Promise<Order> => {
    try {
      console.log('🔄 Hook: Updating order status:', orderId, status);
      const updatedOrder = await updateOrderStatus(orderId, status);
      
      setOrders(prev => prev.map(order => 
        order.id === orderId ? updatedOrder : order
      ));
      console.log('✅ Hook: Order status updated successfully');
      return updatedOrder;
    } catch (err: any) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái đơn hàng');
      console.error('❌ Hook: Error updating order status:', err);
      throw err;
    }
  }, []);

  const updatePaymentStatus = useCallback(async (orderId: string, payment_status: string) => {
    try {
      console.log('💳 Hook: Updating payment status:', orderId, payment_status);
      // API client chưa có endpoint riêng cho payment status
      // Tạm thời log và thông báo
      console.warn('⚠️ Payment status update not implemented in API');
      Alert.alert('Thông báo', 'Chức năng cập nhật trạng thái thanh toán đang phát triển');
    } catch (err: any) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái thanh toán');
      console.error('❌ Hook: Error updating payment status:', err);
      throw err;
    }
  }, []);

  const updateOrderItemStatus = useCallback(async (itemId: number, status: string) => {
    try {
      console.log('🍽️ Hook: Updating item status:', itemId, status);
      await updateOrderItemStatus(itemId, status as 'pending' | 'preparing' | 'ready' | 'served');
      
      // Refresh orders để cập nhật item status
      await fetchOrders();
      console.log('✅ Hook: Order item status updated successfully');
    } catch (err: any) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái món');
      console.error('❌ Hook: Error updating order item status:', err);
      throw err;
    }
  }, [fetchOrders]);

  const createNewOrder = useCallback(async (orderData: Partial<Order>) => {
    try {
      console.log('➕ Hook: Creating order:', orderData);
      const newOrder = await createOrder(orderData);
      
      await fetchOrders(); // Refresh danh sách
      console.log('✅ Hook: Order created successfully');
      return newOrder;
    } catch (err: any) {
      Alert.alert('Lỗi', 'Không thể tạo đơn hàng mới');
      console.error('❌ Hook: Error creating order:', err);
      throw err;
    }
  }, [fetchOrders]);

  const getOrder = useCallback(async (id: number) => {
    try {
      console.log('🔍 Hook: Fetching order by ID:', id);
      const order = await getOrderById(id);
      
      console.log('✅ Hook: Order details loaded');
      return order;
    } catch (err: any) {
      Alert.alert('Lỗi', 'Không thể tải chi tiết đơn hàng');
      console.error('❌ Hook: Error fetching order details:', err);
      throw err;
    }
  }, []);

  const addItemToOrder = useCallback(async (orderId: number, dishId: number, quantity: number, price: number) => {
    try {
      console.log('🍽️ Hook: Adding item to order:', { orderId, dishId, quantity, price });
      // TODO: Implement addOrderItem API function
      console.warn('Add order item not implemented yet');
      Alert.alert('Thông báo', 'Tính năng thêm món vào đơn hàng sẽ sớm có');
    } catch (err: any) {
      Alert.alert('Lỗi', 'Không thể thêm món vào đơn hàng');
      console.error('❌ Hook: Error adding item to order:', err);
      throw err;
    }
  }, []);

  const refresh = useCallback(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    pagination,
    fetchOrders,
    updateStatus,
    updatePaymentStatus,
    updateOrderItemStatus,
    createNewOrder,
    getOrder,
    addItemToOrder,
    refresh: fetchOrders
  };
};