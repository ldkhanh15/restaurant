import apiClient from "@/lib/apiClient";

export interface Order {
  id: string;
  user_id?: string;
  customer_id?: string;
  table_id?: string;
  table_group_id?: string;
  reservation_id?: string;
  status:
    | "pending"
    | "dining"
    | "paid"
    | "waiting_payment"
    | "cancelled"
    | "preparing"
    | "ready"
    | "delivered";
  payment_status: "pending" | "paid" | "failed";
  payment_method?: string;
  total_amount: number;
  final_amount: number;
  voucher_id?: string;
  voucher_discount_amount?: number;
  event_fee?: number;
  deposit_amount?: number;
  created_at: string;
  updated_at: string;
  user?: any;
  table?: any;
  reservation?: any;
  voucher?: any;
  items?: OrderItem[];
  payments?: any[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  dish_id: string;
  quantity: number;
  price: number;
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled";
  customizations?: any;
  dish?: {
    id: string;
    name: string;
    price: number;
    media_urls: string[];
    description?: string;
  };
}

export interface CreateOrderData {
  table_id?: string;
  table_group_id?: string;
  reservation_id?: string;
  items: Array<{
    dish_id: string;
    quantity: number;
    price: number;
    customizations?: any;
  }>;
  voucher_code?: string;
  status?: string;
}

export interface UpdateOrderData {
  table_id?: string;
  table_group_id?: string;
  status?: string;
  payment_method?: string;
}

export interface OrderListResponse {
  data: Order[];
  pagination: {
    total_items: number;
    total_pages: number;
    current_page: number;
    page_size: number;
  };
}

export const orderService = {
  // Get my orders (user-specific)
  getMyOrders: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    date?: string;
  }): Promise<{ status: string; data: OrderListResponse }> =>
    apiClient.get("/orders/my-orders", { params }),

  // Get single order by ID
  getOrderById: (orderId: string): Promise<{ status: string; data: Order }> =>
    apiClient.get(`/orders/${orderId}`),

  // Create new order
  createOrder: (
    data: CreateOrderData
  ): Promise<{ status: string; data: Order }> =>
    apiClient.post("/orders", data),

  // Update order
  updateOrder: (
    orderId: string,
    data: UpdateOrderData
  ): Promise<{ status: string; data: Order }> =>
    apiClient.put(`/orders/${orderId}`, data),

  // Add item to order
  addItemToOrder: (
    orderId: string,
    data: { dish_id: string; quantity: number }
  ): Promise<{ status: string; data: Order }> =>
    apiClient.post(`/orders/${orderId}/items`, data),

  // Update item quantity
  updateItemQuantity: (
    itemId: string,
    quantity: number
  ): Promise<{ status: string; data: OrderItem }> =>
    apiClient.patch(`/orders/items/${itemId}/quantity`, { quantity }),

  // Delete item (set quantity to 0)
  deleteItem: (itemId: string): Promise<{ status: string; data: Order }> =>
    apiClient.delete(`/orders/items/${itemId}`),

  // Apply voucher
  applyVoucher: (
    orderId: string,
    code: string
  ): Promise<{ status: string; data: Order }> =>
    apiClient.post(`/orders/${orderId}/voucher`, { code }),

  // Remove voucher
  removeVoucher: (orderId: string): Promise<{ status: string; data: Order }> =>
    apiClient.delete(`/orders/${orderId}/voucher`),

  // Request support
  requestSupport: (
    orderId: string
  ): Promise<{ status: string; data: { message: string } }> =>
    apiClient.post(`/orders/${orderId}/support`),

  // Request payment
  requestPayment: (
    orderId: string,
    client?: "admin" | "user"
  ): Promise<{
    status: string;
    data: { redirect_url: string };
  }> =>
    apiClient.post(`/orders/${orderId}/payment/request`, {
      client: client || "user",
    }),
};
