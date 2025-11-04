import { useState, useCallback, useEffect } from 'react';
import orderService, { Order, OrderListParams } from '../api/orderService';
import { logger } from '../utils/logger';

export type OrderStatus = "pending" | "preparing" | "ready" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface UseOrdersReturn {
  orders: Order[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  refresh: () => Promise<void>;
  fetchOrders: (params?: OrderListParams) => Promise<void>;
  createOrder: (data: Partial<Order>) => Promise<Order>;
  updateStatus: (id: string, status: OrderStatus) => Promise<void>;
  updatePaymentStatus: (id: string, status: PaymentStatus) => Promise<void>;
  updateItemStatus: (orderId: string, itemId: string, status: string) => Promise<void>;
  getOrderById: (id: string) => Promise<Order | null>;
}

export const useOrders = (): UseOrdersReturn => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch orders với params (tham khảo admin-web)
  const fetchOrders = useCallback(async (params?: OrderListParams) => {
    try {
      setLoading(true);
      setError(null);
      
      logger.info('Fetching orders with params:', params);
      const response = await orderService.list(params);
      
      console.log('📦 Orders response type:', typeof response);
      console.log('📦 Response keys:', response ? Object.keys(response) : 'null');
      console.log('📦 Response.data exists?', !!response?.data);
      console.log('📦 Is response.data array?', Array.isArray(response?.data));
      console.log('📦 Response.data length:', response?.data?.length);
      console.log('📦 Response.pagination:', response?.pagination);
      
      // Interceptor đã unwrap response.data.data
      // response giờ là { data: [...], pagination: {...} }
      if (response?.data && Array.isArray(response.data)) {
        console.log('✅ Setting orders from response.data:', response.data.length, 'items');
        setOrders(response.data);
        setTotal(response.pagination?.total || 0);
        setPage(response.pagination?.page || 1);
        setTotalPages(response.pagination?.totalPages || 0);
        logger.info('Orders fetched successfully', { 
          count: response.data.length,
          total: response.pagination?.total 
        });
      } else if (Array.isArray(response)) {
        // Fallback: Direct array response
        console.log('✅ Setting orders from direct array:', response.length, 'items');
        setOrders(response);
        setTotal(response.length);
        setPage(1);
        setTotalPages(1);
        logger.info('Orders fetched successfully (direct array)', { 
          count: response.length 
        });
      } else {
        // Unexpected structure
        console.error('❌ Unexpected orders response type:', typeof response);
        console.error('❌ Response keys:', response ? Object.keys(response) : 'null');
        setOrders([]);
        logger.warn('Orders response structure unexpected', response);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Không thể tải danh sách đơn hàng';
      console.error('❌ Fetch orders error:', err.message);
      console.error('❌ Error stack:', err.stack);
      logger.error('Failed to fetch orders', err);
      setError(errorMessage);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new order
  const createOrder = useCallback(async (data: Partial<Order>): Promise<Order> => {
    try {
      setError(null);
      
      logger.info('Creating new order', data);
      const response = await orderService.create(data);
      const newOrder = response.data || response;
      
      // Add to local state
      setOrders(prev => [newOrder, ...prev]);
      setTotal(prev => prev + 1);
      
      logger.info('Order created successfully', { id: newOrder.id });
      return newOrder;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể tạo đơn hàng';
      logger.error('Failed to create order', err);
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Update order status (tham khảo admin-web)
  const updateStatus = useCallback(async (id: string, status: OrderStatus) => {
    try {
      setError(null);
      
      logger.info('Updating order status', { id, status });
      await orderService.updateStatus(id, status);
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === id ? { ...order, status } : order
      ));
      
      logger.info('Order status updated successfully', { id, status });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể cập nhật trạng thái đơn hàng';
      logger.error('Failed to update order status', err);
      setError(errorMessage);
      throw err; // Re-throw for component error handling
    }
  }, []);

  // Update payment status (tham khảo admin-web)
  const updatePaymentStatus = useCallback(async (id: string, paymentStatus: PaymentStatus) => {
    try {
      setError(null);
      
      logger.info('Updating payment status', { id, paymentStatus });
      await orderService.updatePaymentStatus(id, paymentStatus);
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === id ? { ...order, payment_status: paymentStatus } : order
      ));
      
      logger.info('Payment status updated successfully', { id, paymentStatus });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể cập nhật trạng thái thanh toán';
      logger.error('Failed to update payment status', err);
      setError(errorMessage);
      throw err; // Re-throw for component error handling
    }
  }, []);

  // Update order item status (mới thêm, tham khảo admin-web)
  const updateItemStatus = useCallback(async (orderId: string, itemId: string, status: string) => {
    try {
      setError(null);
      
      logger.info('Updating order item status', { orderId, itemId, status });
      await orderService.updateOrderItemStatus(orderId, itemId, status as any);
      
      // Update local state
      setOrders(prev => prev.map(order => {
        if (order.id === orderId && order.items) {
          return {
            ...order,
            items: order.items.map(item =>
              item.id === itemId ? { ...item, status: status as any } : item
            )
          };
        }
        return order;
      }));
      
      logger.info('Order item status updated successfully', { orderId, itemId, status });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể cập nhật trạng thái món ăn';
      logger.error('Failed to update order item status', err);
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Get order by ID (mới thêm, tham khảo admin-web)
  const getOrderById = useCallback(async (id: string): Promise<Order | null> => {
    try {
      logger.info('Fetching order by ID', { id });
      const order = await orderService.getDetails(id);
      logger.info('Order fetched successfully', { id });
      return order;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể tải đơn hàng';
      logger.error('Failed to fetch order', err);
      setError(errorMessage);
      return null;
    }
  }, []);

  // Refresh orders
  const refresh = useCallback(async () => {
    await fetchOrders();
  }, [fetchOrders]);

  // Initial load
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    total,
    page,
    totalPages,
    refresh,
    fetchOrders,
    createOrder,
    updateStatus,
    updatePaymentStatus,
    updateItemStatus,
    getOrderById,
  };
};