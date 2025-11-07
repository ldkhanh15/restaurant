// Order Service - Tham khảo từ admin-web
import api from './axiosConfig';

export interface OrderItem {
  id: string;
  dish_id: string;
  dish_name: string;
  quantity: number;
  price: number;
  unit_price?: number; // Backend sometimes returns unit_price instead of price
  special_instructions?: string;
  status: "pending" | "preparing" | "ready" | "served" | "dining" | "waiting_payment";
  dish?: {
    name?: string;
    media_urls?: string | string[];
  };
}

export interface Order {
  id: string;
  order_number?: string; // Add order_number for better UX
  user_id?: string;
  customer_name?: string;
  customer_phone?: string;
  table_id?: string;
  table_number?: number;
  status: "pending" | "paid" | "dining" | "waiting_payment" | "cancelled";  // Backend actual statuses
  payment_status: "pending" | "paid" | "failed";  // Backend actual payment statuses
  payment_method?: "cash" | "card" | "transfer" | "momo" | "zalopay" | "vnpay";
  total_amount: number;
  subtotal?: number;
  discount_amount?: number;
  voucher_code?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  order_items?: OrderItem[];
  // Backend relations
  user?: {
    username?: string;
    email?: string;
    name?: string;
    phone?: string;
  };
  table?: {
    table_number?: string;
  };
}

export interface OrderListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  payment_status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OrderListResponse {
  data: Order[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

/**
 * Order Service - Tham khảo từ admin-web/src/services/orderService.ts
 */
export const orderService = {
  /**
   * Lấy danh sách orders với filters
   */
  list: async (params?: OrderListParams): Promise<OrderListResponse> => {
    const response = await api.get('/orders', { params });
    console.log('🔍 orderService.list unwrapped response:', response);
    // Interceptor đã unwrap response.data.data
    // response có thể là array hoặc { data: [...], pagination: {...} }
    return response as unknown as OrderListResponse;
  },

  /**
   * Lấy orders theo user ID
   */
  listByUser: async (userId: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get(`/orders/user/${userId}`, { params });
    // Interceptor đã unwrap
    return response as unknown as Order[];
  },

  /**
   * Lấy orders theo status
   */
  listByStatus: async (status: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get(`/orders/status/${status}`, { params });
    // Interceptor đã unwrap
    return response as unknown as Order[];
  },

  /**
   * Lấy order theo ID
   */
  getById: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    // Interceptor đã unwrap response.data.data, trả về Order trực tiếp
    return response as unknown as Order;
  },

  /**
   * Lấy chi tiết order với items (sử dụng route /orders/:id vì backend không có /details)
   */
  getDetails: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    // Interceptor đã unwrap response.data.data, trả về Order trực tiếp
    return response as unknown as Order;
  },

  /**
   * Tạo order mới
   */
  create: async (data: Partial<Order>) => {
    const response = await api.post('/orders', data);
    return response;
  },

  /**
   * Cập nhật order
   */
  update: async (id: string, data: Partial<Order>) => {
    const response = await api.put(`/orders/${id}`, data);
    return response;
  },

  /**
   * Xóa order
   */
  remove: async (id: string) => {
    const response = await api.delete(`/orders/${id}`);
    return response;
  },

  /**
   * Cập nhật status của order - SỬ DỤNG PATCH (đúng với backend)
   */
  updateStatus: async (id: string, status: Order['status']) => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response;
  },

  /**
   * Cập nhật payment status - Backend không có route riêng, dùng PUT /orders/:id
   */
  updatePaymentStatus: async (id: string, payment_status: Order['payment_status']) => {
    const response = await api.put(`/orders/${id}`, { payment_status });
    return response;
  },

  /**
   * Cập nhật status của order item
   */
  updateOrderItemStatus: async (orderId: string, itemId: string, status: OrderItem['status']) => {
    const response = await api.put(`/orders/${orderId}/items/${itemId}/status`, { status });
    return response;
  },

  /**
   * Thêm item vào order
   */
  addItem: async (
    orderId: string,
    item: { dish_id: string; quantity: number; special_instructions?: string }
  ) => {
    const response = await api.post(`/orders/${orderId}/items`, item);
    return response;
  },

  /**
   * Cập nhật item trong order
   */
  updateItem: async (
    orderId: string,
    itemId: string,
    data: { quantity?: number; special_instructions?: string }
  ) => {
    const response = await api.put(`/orders/${orderId}/items/${itemId}`, data);
    return response;
  },

  /**
   * Xóa item khỏi order
   */
  removeItem: async (orderId: string, itemId: string) => {
    const response = await api.delete(`/orders/${orderId}/items/${itemId}`);
    return response;
  },

  /**
   * Apply voucher vào order
   */
  applyVoucher: async (orderId: string, code: string) => {
    const response = await api.post(`/orders/${orderId}/apply-voucher`, { code });
    return response;
  },

  /**
   * Remove voucher khỏi order
   */
  removeVoucher: async (orderId: string) => {
    const response = await api.delete(`/orders/${orderId}/remove-voucher`);
    return response;
  },

  /**
   * Apply discount vào order
   */
  applyDiscount: async (orderId: string, amount: number) => {
    const response = await api.patch(`/orders/${orderId}/discount`, { amount });
    return response;
  },

  /**
   * Đổi bàn cho order
   */
  changeTable: async (orderId: string, newTableId: string) => {
    const response = await api.put(`/orders/${orderId}/change-table`, { table_id: newTableId });
    return response;
  },

  /**
   * Yêu cầu thanh toán
   */
  requestPayment: async (orderId: string, data: { method: string; amount: number }) => {
    const response = await api.post(`/orders/${orderId}/request-payment`, data);
    return response;
  },

  /**
   * Gộp orders
   */
  mergeOrders: async (orderId1: string, orderId2: string) => {
    const response = await api.post(`/orders/${orderId1}/merge`, { target_order_id: orderId2 });
    return response;
  },

  /**
   * Tách order
   */
  splitOrder: async (orderId: string, items: string[]) => {
    const response = await api.post(`/orders/${orderId}/split`, { items });
    return response;
  },

  /**
   * In hóa đơn
   */
  printInvoice: async (orderId: string) => {
    const response = await api.get(`/orders/${orderId}/invoice`);
    return response;
  },

  /**
   * Lấy bàn trống
   */
  getAvailableTables: async () => {
    const response = await api.get('/tables');
    return response;
  },

  /**
   * Lấy tất cả món ăn
   */
  getAllDishes: async () => {
    const response = await api.get('/dishes');
    return response;
  },
};

export default orderService;
