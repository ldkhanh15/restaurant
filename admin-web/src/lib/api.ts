// Auto-generated API client from Swagger definitions
// Base URL: http://localhost:8000/api

export interface ApiResponse<T = any> {
  status: string;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==================== AUTH TYPES ====================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  username: string;
  role?: "customer" | "employee" | "admin";
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
}

// ==================== ORDER TYPES ====================

export interface Order {
  id: string;
  order_number: string;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "served"
    | "completed"
    | "cancelled";
  total_amount: number;
  table_id?: string;
  table_name?: string;
  customer_id?: string;
  customer_name?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  voucher?: Voucher;
  payment_status?: "pending" | "paid" | "failed" | "refunded";
  payment_method?: string;
  notes?: string;
}

export interface OrderItem {
  id: string;
  dish_id: string;
  dish_name: string;
  quantity: number;
  price: number;
  status: "pending" | "preparing" | "ready" | "served" | "cancelled";
  special_instructions?: string;
}

export interface OrderFilters {
  status?: string;
  table_id?: string;
  customer_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "ASC" | "DESC";
}

export interface OrderStats {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  completed_orders: number;
  average_order_value: number;
}

// ==================== RESERVATION TYPES ====================

export interface Reservation {
  id: string;
  user_id: string;
  table_id: string;
  table_group_id: string | null;
  reservation_time: string; // ISO string
  duration_minutes: number;
  num_people: number;
  preferences: JSON;
  pre_order_items: {
    dish_id: string;
    quantity: string; // chú ý: quantity đang là string trong response
  }[];
  event_id: string | null;
  event_fee: string | null;
  status:
    | "pending"
    | "confirmed"
    | "checked_in"
    | "completed"
    | "cancelled"
    | "no_show";
  timeout_minutes: number;
  deposit_amount: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  user: {
    id: string;
    username: string;
    email: string;
    phone: string | null;
    role: string;
    full_name: string | null;
    preferences: any | null;
    ranking: string;
    points: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };

  table: {
    id: string;
    table_number: string;
    capacity: number;
    deposit: number;
    cancel_minutes: number;
    location: string | null;
    status: string;
    panorama_urls: string[] | null;
    amenities: string[] | null;
    description: string | null;
    created_at: string | null;
    updated_at: string;
    deleted_at: string | null;
  };

  event: {
    id: string;
    name: string;
    description: string;
    price: string;
    inclusions: string[];
    decorations: string[];
    created_at: string;
    deleted_at: string | null;
  } | null;

  payments: [
    {
      id: "97ea316b-101e-4b9b-b461-a6df71401895";
      order_id: null;
      reservation_id: "1541078c-cd0b-4de7-9c66-3cee20497bb0";
      amount: "3000000.00";
      method: "vnpay";
      status: "completed";
      transaction_id: "RES_1541078c-cd0b-4de7-9c66-3cee20497bb0_1760855844265";
      created_at: "2025-10-19T06:37:24.000Z";
      updated_at: "2025-10-19T06:37:53.000Z";
    }
  ];
}
export interface ReservationDetailResponse {
  id: string;
  user_id: string;
  table_id: string;
  table_group_id: string | null;
  reservation_time: string;
  duration_minutes: number;
  num_people: number;
  preferences: {
    note?: string;
  } | null;
  pre_order_items: {
    dish_id: string;
    quantity: string;
  }[];
  event_id: string | null;
  event_fee: string | null;
  status: string;
  timeout_minutes: number;
  deposit_amount: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  user: {
    id: string;
    username: string;
    email: string;
    phone: string | null;
  };

  table: {
    id: string;
    table_number: string;
    capacity: number;
    status: string;
  };

  event: {
    id: string;
    name: string;
    description: string;
  } | null;

  orders: {
    id: string;
    user_id: string;
    reservation_id: string;
    table_id: string;
    table_group_id: string | null;
    event_id: string | null;
    voucher_id: string | null;
    status: string;
    total_amount: string;
    voucher_discount_amount: string;
    final_amount: string;
    event_fee: string;
    deposit_amount: string | null;
    customizations: any | null;
    notes: string | null;
    payment_status: string;
    payment_method: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    items: {
      id: string;
      order_id: string;
      dish_id: string;
      quantity: number;
      price: string;
      customizations: any | null;
      status: string;
      estimated_wait_time: string | null;
      completed_at: string | null;
      created_at: string;
      dish: {
        id: string;
        name: string;
        price: string;
        media_urls: string[];
      };
    }[];
  }[];

  payments: {
    id: string;
    order_id: string | null;
    reservation_id: string;
    amount: string;
    method: string;
    status: string;
    transaction_id: string;
    created_at: string;
    updated_at: string;
  }[];
}

export interface ReservationFilters {
  status?: string;
  table_id?: string;
  customer_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

// ==================== PAYMENT TYPES ====================

export interface Payment {
  id: string;
  order_id: string | null;
  reservation_id: string | null;
  amount: number; // backend trả dạng string số tiền -> giữ nguyên để không mất độ chính xác thập phân
  method: "cash" | "card" | "vnpay" | "bank_transfer"; // hiện tại có "vnpay"
  status: "pending" | "completed" | "failed" | "refunded";
  transaction_id: string;
  created_at: string;
  updated_at: string;

  // Nếu là thanh toán cho Order
  order?: {
    id: string;
    user_id: string;
    reservation_id: string | null;
    table_id: string;
    table_group_id: string | null;
    event_id: string | null;
    voucher_id: string | null;
    status: string;
    total_amount: string;
    voucher_discount_amount: string;
    final_amount: string;
    event_fee: string;
    deposit_amount: string;
    customizations: any | null;
    notes: string | null;
    payment_status: string;
    payment_method: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    user: {
      id: string;
      username: string;
      email: string;
      phone: string | null;
      role: string;
      full_name: string | null;
    };
    table: {
      id: string;
      table_number: string;
      capacity: number;
      deposit: number;
      status: string;
    };
  };

  // Nếu là thanh toán cho Reservation
  reservation?: {
    id: string;
    user_id: string;
    table_id: string;
    table_group_id: string | null;
    reservation_time: string;
    duration_minutes: number;
    num_people: number;
    preferences: any;
    event_id: string | null;
    event_fee: string;
    status: string;
    deposit_amount: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    user: {
      id: string;
      username: string;
      email: string;
      phone: string | null;
      role: string;
    };
    table: {
      id: string;
      table_number: string;
      capacity: number;
      deposit: number;
      status: string;
    };
  };
}


export interface PaymentFilters {
  status?: string;
  payment_method?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface PaymentStats {
  total_revenue: number;
  total_payments: number;
  pending_payments: number;
  completed_payments: number;
  revenue_by_method: Record<string, number>;
  daily_revenue: Array<{
    date: string;
    revenue: number;
  }>;
}

// ==================== VOUCHER TYPES ====================

export interface Voucher {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed_amount";
  value: number;
  expiry_date: string;
  max_uses: number;
  current_uses: number;
  min_order_value: number;
  active: boolean;
  created_at: string;
  deleted_at: string;
}
export interface VoucherFilters {
  is_active?: boolean;
  type?: string;
  page?: number;
  limit?: number;
}

// ==================== TABLE TYPES ====================

export interface Table {
  id: string;
  table_number: string;
  capacity: number;
  status: "available" | "occupied" | "reserved" | "maintenance";
  location?: string;
  created_at: string;
  updated_at: string;
}

// ==================== DISH TYPES ====================

export interface Dish {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  is_available: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

// ==================== NOTIFICATION TYPES ====================

export interface Notification {
  id: string;
  user_id: string | null;
  type:
    | "low_stock"
    | "reservation_confirm"
    | "promotion"
    | "order_created"
    | "order_updated"
    | "order_status_changed"
    | "reservation_created"
    | "reservation_updated"
    | "chat_message"
    | "support_request"
    | "payment_completed"
    | "other";
  title: string;
  content: string; // Đổi từ message -> content
  is_read: boolean;
  data?: {
    amount?: number;
    order_id?: string;
    table_id?: string;
    table_group_id?: string | null;
    // Có thể bổ sung thêm nếu có các type khác
    [key: string]: any;
  };
  sent_at: string; // Đổi từ created_at / updated_at -> sent_at
  status: string; // Ví dụ: "sent"
  user?: any | null; // Nếu có user object sau này thì có thể thay thế bằng type cụ thể
}


export interface NotificationFilters {
  user_id?: string;
  type?: string;
  is_read?: boolean;
  page?: number;
  limit?: number;
}

// ==================== API CLIENT ====================

import apiClient from "@/services/apiClient";

export const api = {
  // ==================== AUTH ====================
  auth: {
    login: (data: LoginRequest): Promise<ApiResponse<AuthResponse>> =>
      apiClient.post("/auth/login", data),
    signup: (data: SignupRequest): Promise<ApiResponse<AuthResponse>> =>
      apiClient.post("/auth/signup", data),
    logout: (): Promise<ApiResponse> => apiClient.post("/auth/logout"),
    refresh: (): Promise<ApiResponse<AuthResponse>> =>
      apiClient.post("/auth/refresh"),
  },

  // ==================== ORDERS ====================
  orders: {
    getAll: (filters?: OrderFilters): Promise<ApiResponse<Order[]>> =>
      apiClient.get("/orders", { params: filters }),
    getById: (id: string): Promise<ApiResponse<Order>> =>
      apiClient.get(`/orders/${id}`),
    getByTable: (tableId: string): Promise<ApiResponse<Order>> =>
      apiClient.get(`/orders/table/${tableId}`),
    updateStatus: (id: string, status: string): Promise<ApiResponse<Order>> =>
      apiClient.patch(`/orders/${id}/status`, { status }),
    addItem: (
      id: string,
      data: { dish_id: string; quantity: number; special_instructions?: string }
    ): Promise<ApiResponse<Order>> =>
      apiClient.post(`/orders/${id}/items`, data),
    updateItemQuantity: (
      itemId: string,
      quantity: number
    ): Promise<ApiResponse> =>
      apiClient.patch(`/orders/items/${itemId}/quantity`, { quantity }),
    updateItemStatus: (itemId: string, status: string): Promise<ApiResponse> =>
      apiClient.patch(`/orders/items/${itemId}/status`, { status }),
    deleteItem: (itemId: string): Promise<ApiResponse> =>
      apiClient.delete(`/orders/items/${itemId}`),
    applyVoucher: (id: string, code: string): Promise<ApiResponse<Order>> =>
      apiClient.post(`/orders/${id}/voucher`, { code }),
    mergeOrders: (
      orderId1: string,
      orderId2: string
    ): Promise<ApiResponse<Order>> =>
      apiClient.post("/orders/merge", {
        order_id_1: orderId1,
        order_id_2: orderId2,
      }),
    requestSupport: (id: string, message: string): Promise<ApiResponse> =>
      apiClient.post(`/orders/${id}/support`, { message }),
    requestPayment: (
      id: string,
      data: { method: string; amount: number }
    ): Promise<ApiResponse> =>
      apiClient.post(`/orders/${id}/payment/request`, data),
    getRevenueStats: (filters?: {
      start_date?: string;
      end_date?: string;
      period?: string;
    }): Promise<ApiResponse<OrderStats>> =>
      apiClient.get("/orders/stats/revenue", { params: filters }),
  },

  // ==================== RESERVATIONS ====================
  reservations: {
    getAll: (
      filters?: ReservationFilters
    ): Promise<ApiResponse<Reservation[]>> =>
      apiClient.get("/reservations", { params: filters }),
    getById: (id: string): Promise<ApiResponse<ReservationDetailResponse>> =>
      apiClient.get(`/reservations/${id}`),
    updateStatus: (
      id: string,
      status: string
    ): Promise<ApiResponse<Reservation>> =>
      apiClient.patch(`/reservations/${id}/status`, { status }),
    checkIn: (id: string): Promise<ApiResponse<Reservation>> =>
      apiClient.post(`/reservations/${id}/checkin`),
    delete: (id: string): Promise<ApiResponse<any>> =>
      apiClient.delete(`/reservations/${id}`),
  },

  // ==================== PAYMENTS ====================
  payments: {
    getAll: (filters?: PaymentFilters): Promise<ApiResponse<Payment[]>> =>
      apiClient.get("/payments", { params: filters }),
    getById: (id: string): Promise<ApiResponse<Payment>> =>
      apiClient.get(`/payments/${id}`),
    getRevenueStats: (filters?: {
      start_date?: string;
      end_date?: string;
    }): Promise<ApiResponse<PaymentStats>> =>
      apiClient.get("/payments/stats/revenue", { params: filters }),
    getOrderStats: (filters?: {
      start_date?: string;
      end_date?: string;
    }): Promise<ApiResponse> =>
      apiClient.get("/payments/stats/orders", { params: filters }),
    getReservationStats: (filters?: {
      start_date?: string;
      end_date?: string;
    }): Promise<ApiResponse> =>
      apiClient.get("/payments/stats/reservations", { params: filters }),
    getPaymentStats: (filters?: {
      start_date?: string;
      end_date?: string;
    }): Promise<ApiResponse> =>
      apiClient.get("/payments/stats/payments", { params: filters }),
    getTableStats: (filters?: {
      start_date?: string;
      end_date?: string;
    }): Promise<ApiResponse> =>
      apiClient.get("/payments/stats/tables", { params: filters }),
    getCustomerStats: (filters?: {
      start_date?: string;
      end_date?: string;
    }): Promise<ApiResponse> =>
      apiClient.get("/payments/stats/customers", { params: filters }),
    getDailyStats: (filters?: {
      start_date?: string;
      end_date?: string;
    }): Promise<ApiResponse> =>
      apiClient.get("/payments/stats/daily", { params: filters }),
    getMonthlyStats: (filters?: {
      start_date?: string;
      end_date?: string;
    }): Promise<ApiResponse> =>
      apiClient.get("/payments/stats/monthly", { params: filters }),
    getDishStats: (filters?: {
      start_date?: string;
      end_date?: string;
    }): Promise<ApiResponse> =>
      apiClient.get("/payments/stats/dishes", { params: filters }),
    getDashboardStats: (filters?: {
      start_date?: string;
      end_date?: string;
    }): Promise<ApiResponse> =>
      apiClient.get("/payments/stats/dashboard", { params: filters }),
  },

  // ==================== VOUCHERS ====================
  vouchers: {
    getAll: (filters?: VoucherFilters): Promise<ApiResponse<Voucher[]>> =>
      apiClient.get("/vouchers", { params: filters }),
    getActive: (): Promise<ApiResponse<Voucher[]>> =>
      apiClient.get("/vouchers/active"),
    getById: (id: string): Promise<ApiResponse<Voucher>> =>
      apiClient.get(`/vouchers/${id}`),
    create: (
      data: Omit<Voucher, "id" | "created_at" | "updated_at" | "used_count">
    ): Promise<ApiResponse<Voucher>> => apiClient.post("/vouchers", data),
    update: (
      id: string,
      data: Partial<Omit<Voucher, "id" | "created_at" | "updated_at">>
    ): Promise<ApiResponse<Voucher>> => apiClient.put(`/vouchers/${id}`, data),
    delete: (id: string): Promise<ApiResponse> =>
      apiClient.delete(`/vouchers/${id}`),
  },

  // ==================== TABLES ====================
  tables: {
    getAll: (): Promise<ApiResponse<Table[]>> => apiClient.get("/tables"),
    getAvailable: (): Promise<ApiResponse<Table[]>> =>
      apiClient.get("/tables/available"),
    getById: (id: string): Promise<ApiResponse<Table>> =>
      apiClient.get(`/tables/${id}`),
  },

  // ==================== DISHES ====================
  dishes: {
    getAll: (): Promise<ApiResponse<Dish[]>> => apiClient.get("/dishes"),
    getById: (id: string): Promise<ApiResponse<Dish>> =>
      apiClient.get(`/dishes/${id}`),
  },

  // ==================== NOTIFICATIONS ====================
  notifications: {
    getAll: (
      filters?: NotificationFilters
    ): Promise<ApiResponse<Notification[]>> =>
      apiClient.get("/notifications", { params: filters }),
    markAsRead: (id: string): Promise<ApiResponse> =>
      apiClient.patch(`/notifications/${id}/read`),
    markAllAsRead: (): Promise<ApiResponse> =>
      apiClient.patch("/notifications/read-all"),
    delete: (id: string): Promise<ApiResponse> =>
      apiClient.delete(`/notifications/${id}`),
  },
};

export default api;
