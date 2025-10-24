import api from './axiosConfig';

export interface OrderItem {
  id: number;
  dish_id: number;
  dish_name: string;
  quantity: number;
  price: number;
  customizations?: string;
  status: "pending" | "preparing" | "ready" | "served";
  duration_seconds?: number;
}

export interface Order {
  id: number;
  user_id: number;
  customer_name: string;
  customer_phone: string;
  status: "pending" | "preparing" | "ready" | "delivered" | "cancelled";
  payment_status: "pending" | "paid" | "failed" | "refunded";
  payment_method: "cash" | "card" | "transfer" | "momo" | "zalopay";
  total_amount: number;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
  table_number?: number;
  notes?: string;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: string;
  payment_status?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

// Real API functions for orders
export const getOrders = async (filters?: OrderFilters): Promise<OrdersResponse> => {
  try {
    const response = await api.get('/orders', { params: filters });
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Lỗi khi tải danh sách đơn hàng';
    throw new Error(errorMessage);
  }
};

export const getOrderById = async (id: number): Promise<Order> => {
  try {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Lỗi khi tải đơn hàng';
    throw new Error(errorMessage);
  }
};

export const updateOrderStatus = async (
  orderId: number, 
  status: Order['status']
): Promise<Order> => {
  try {
    const response = await api.put(`/orders/${orderId}/status`, { status });
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Lỗi khi cập nhật trạng thái đơn hàng';
    throw new Error(errorMessage);
  }
};

export const updatePaymentStatus = async (
  orderId: number, 
  payment_status: Order['payment_status']
): Promise<Order> => {
  try {
    const response = await api.put(`/orders/${orderId}/payment-status`, { payment_status });
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Lỗi khi cập nhật trạng thái thanh toán';
    throw new Error(errorMessage);
  }
};

export const updateOrderItemStatus = async (
  orderId: number,
  itemId: number,
  status: OrderItem['status']
): Promise<Order> => {
  try {
    const response = await api.put(`/orders/${orderId}/items/${itemId}/status`, { status });
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Lỗi khi cập nhật trạng thái món ăn';
    throw new Error(errorMessage);
  }
};

export const createOrder = async (orderData: Partial<Order>): Promise<Order> => {
  try {
    const response = await api.post('/orders', orderData);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Lỗi khi tạo đơn hàng';
    throw new Error(errorMessage);
  }
};

export const deleteOrder = async (orderId: number): Promise<void> => {
  try {
    await api.delete(`/orders/${orderId}`);
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Lỗi khi xóa đơn hàng';
    throw new Error(errorMessage);
  }
};