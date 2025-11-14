"use client";

import apiClient from "./apiClient";

export const orderService = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get("/orders", { params }),
  listByUser: (userId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get(`/orders/user/${userId}`, { params }),
  listByStatus: (status: string, params?: { page?: number; limit?: number }) =>
    apiClient.get(`/orders/status/${status}`, { params }),
  getById: (id: string) => apiClient.get(`/orders/${id}`),
  getDetails: (id: string) => apiClient.get(`/orders/${id}/details`),
  create: (data: any) => apiClient.post("/orders", data),
  update: (id: string, data: any) => apiClient.put(`/orders/${id}`, data),
  remove: (id: string) => apiClient.delete(`/orders/${id}`),
  updateStatus: (id: string, status: string) =>
    apiClient.put(`/orders/${id}/status`, { status }),
  patchStatus: (id: string, status: string) =>
    apiClient.patch(`/orders/${id}/status`, { status }),
  getAllOrders: (params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => apiClient.get("/orders", { params }),
  updateOrderItemStatus: (orderId: string, itemId: string, status: string) =>
    apiClient.put(`/orders/${orderId}/items/${itemId}/status`, { status }),

  // ==================== CHAT INTEGRATION APIs ====================

  // API cho Chat: Lấy đơn hàng của user
  getMyOrdersForChat: (params?: { limit?: number }) =>
    apiClient.get("/orders/chat/my-orders", { params }),

  // API cho Chat: Lấy chi tiết đơn hàng
  getOrderDetailsForChat: (orderId: string) =>
    apiClient.get(`/orders/chat/${orderId}/details`),

  // API cho Chat: Tạo đơn hàng từ chat
  createOrderFromChat: (data: {
    items: { dish_id: string; quantity: number }[];
    table_id?: string;
    notes?: string;
  }) => apiClient.post("/orders/chat/create", data),

  // ==================== ENHANCED ORDER MANAGEMENT APIs ====================

  // Lấy bàn trống
  getAvailableTables: () => apiClient.get("/tables/available"),

  // Lấy tất cả món ăn
  getAllDishes: () => apiClient.get("/dishes"),

  // Đổi bàn
  changeTable: (orderId: string, newTableId: string) =>
    apiClient.put(`/orders/${orderId}/change-table`, { table_id: newTableId }),

  // Yêu cầu thanh toán
  requestPayment: (
    orderId: string,
    data: { method: string; amount: number; client?: string }
  ) => apiClient.post(`/orders/${orderId}/payment/request`, data),

  // Request payment retry (for failed payments)
  requestPaymentRetry: (
    orderId: string,
    method: "vnpay" | "cash",
    bankCode?: string
  ): Promise<{
    status: string;
    data: { redirect_url?: string; message: string };
  }> =>
    apiClient.post(`/orders/${orderId}/payment/retry`, { method, bankCode }),

  // Gộp đơn hàng
  mergeOrders: (orderId1: string, orderId2: string) =>
    apiClient.post(`/orders/${orderId1}/merge`, { target_order_id: orderId2 }),

  // Tách đơn hàng
  splitOrder: (orderId: string, items: string[]) =>
    apiClient.post(`/orders/${orderId}/split`, { items }),

  // In hóa đơn
  printInvoice: (orderId: string) =>
    apiClient.get(`/orders/${orderId}/invoice`),

  // Thêm món vào đơn hàng
  addItemToOrder: (
    orderId: string,
    data: { dish_id: string; quantity: number; special_instructions?: string }
  ) => apiClient.post(`/orders/${orderId}/items`, data),

  // Cập nhật món trong đơn hàng
  updateOrderItem: (
    orderId: string,
    itemId: string,
    data: { quantity: number; special_instructions?: string }
  ) => apiClient.put(`/orders/${orderId}/items/${itemId}`, data),

  // Xóa món khỏi đơn hàng
  removeOrderItem: (orderId: string, itemId: string) =>
    apiClient.delete(`/orders/${orderId}/items/${itemId}`),

  applyVoucher: (id: string, code: string) =>
    apiClient.post(`/orders/${id}/apply-voucher`, { code }),
  removeVoucher: (id: string) =>
    apiClient.delete(`/orders/${id}/remove-voucher`),
  applyDiscount: (id: string, amount: number) =>
    apiClient.patch(`/orders/${id}/discount`, { amount }),
  addItem: (id: string, item: { dish_id: string; quantity: number }) =>
    apiClient.post(`/orders/${id}/items`, item),
  updateItem: (
    orderId: string,
    itemId: string,
    payload: { quantity: number }
  ) => apiClient.patch(`/orders/${orderId}/items/${itemId}`, payload),
  removeItem: (orderId: string, itemId: string) =>
    apiClient.delete(`/orders/${orderId}/items/${itemId}`),
  cancelItem: (orderId: string, itemId: string) =>
    apiClient.delete(`/orders/${orderId}/items/${itemId}/cancel`),
  updateItemStatus: (
    orderId: string,
    itemId: string,
    status: "pending" | "completed"
  ) => apiClient.patch(`/orders/${orderId}/items/${itemId}/status`, { status }),
  updateItemStatusDetailed: (
    orderId: string,
    itemId: string,
    status: "pending" | "preparing" | "ready" | "served" | "cancelled"
  ) =>
    apiClient.patch(`/orders/${orderId}/items/${itemId}/status-detailed`, {
      status,
    }),
  summary: (id: string) => apiClient.get(`/orders/${id}/summary`),
  split: (id: string, item_ids: string[]) =>
    apiClient.post(`/orders/${id}/split`, { item_ids }),
  setPaymentMethod: (id: string, payment_method: string) =>
    apiClient.patch(`/orders/${id}/payment-method`, { payment_method }),
  completePayment: (id: string) =>
    apiClient.patch(`/orders/${id}/complete-payment`, {}),
  invoice: (id: string) => apiClient.get(`/orders/${id}/invoice`),
  createReview: (id: string, payload: any) =>
    apiClient.post(`/orders/${id}/review`, payload),
  createComplaint: (id: string, payload: any) =>
    apiClient.post(`/orders/${id}/complaint`, payload),
  printPreview: (id: string) => apiClient.get(`/orders/${id}/print-preview`),
  merge: (payload: { source_table_id: string; target_table_id: string }) =>
    apiClient.post(`/orders/merge`, payload),

  // New APIs
  getRevenueStats: (params?: {
    start_date?: string;
    end_date?: string;
    period?: string;
  }) => apiClient.get("/orders/stats/revenue", { params }),
  getOrdersByDateRange: (params: { start_date: string; end_date: string }) =>
    apiClient.get("/orders/date-range", { params }),

  // Excel Export APIs
  exportRevenue: (filters?: {
    start_date?: string;
    end_date?: string;
    status?: string;
    table_id?: string;
    user_id?: string;
  }) => apiClient.get("/orders/export/revenue", { params: filters }),

  getPopularDishesStats: (filters?: {
    start_date?: string;
    end_date?: string;
  }) => apiClient.get("/orders/stats/popular-dishes", { params: filters }),

  getTopCustomersStats: (filters?: {
    start_date?: string;
    end_date?: string;
  }) => apiClient.get("/orders/stats/top-customers", { params: filters }),
};

export type Order = {
  id: string;
};
