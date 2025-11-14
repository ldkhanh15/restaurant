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
  user_id?: string;
  reservation_id?: string;
  table_id?: string;
  table_group_id?: string;
  event_id?: string;
  voucher_id?: string;
  status:
    | "pending"
    | "dining"
    | "waiting_payment"
    | "preparing"
    | "ready"
    | "delivered"
    | "paid"
    | "cancelled";
  total_amount: number;
  voucher_discount_amount?: number;
  final_amount: number;
  event_fee?: number;
  deposit_amount?: number;
  customizations?: any;
  notes?: string;
  payment_status: "pending" | "paid" | "failed";
  payment_method?: "zalopay" | "momo" | "cash" | "vnpay";
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;

  // Relations (if included)
  user?: {
    id: string;
    username: string;
    email: string;
    phone?: string;
    full_name?: string;
  };
  table?: {
    id: string;
    table_number: string;
    capacity: number;
    status: string;
  };
  items?: OrderItem[];
  voucher?: Voucher;
}

export interface OrderItem {
  id: string;
  order_id?: string;
  dish_id?: string;
  quantity: number;
  price: number;
  customizations?: any;
  status: "pending" | "completed" | "preparing" | "ready" | "cancelled";
  special_instructions?: string;
  estimated_wait_time?: number;
  completed_at?: string;
  created_at: string;

  // Relation (if included)
  dish?: {
    id: string;
    name: string;
    price: number;
    media_urls?: string[];
  };
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
  user_id?: string;
  table_id?: string;
  table_group_id?: string;
  reservation_time: string; // ISO string (Date from backend)
  duration_minutes: number;
  num_people: number;
  preferences?: any;
  pre_order_items?: any;
  event_id?: string;
  event_fee?: number;
  status: "pending" | "confirmed" | "cancelled" | "no_show";
  timeout_minutes: number;
  deposit_amount?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;

  // Relations (if included)
  user?: {
    id: string;
    username: string;
    email: string;
    phone?: string;
    role: string;
    full_name?: string;
    preferences?: any;
    ranking: string;
    points: number;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
  };

  table?: {
    id: string;
    table_number: string;
    capacity: number;
    deposit: number;
    cancel_minutes: number;
    location?: string;
    status: string;
    panorama_urls?: string[];
    amenities?: string[];
    description?: string;
    created_at?: string;
    updated_at: string;
    deleted_at?: string | null;
  };

  event?: {
    id: string;
    name: string;
    description: string;
    price: number;
    inclusions?: string[];
    decorations?: string[];
    created_at: string;
    deleted_at?: string | null;
  } | null;

  payments?: {
    id: string;
    order_id?: string | null;
    reservation_id?: string;
    amount: number;
    method: string;
    status: string;
    transaction_id: string;
    created_at: string;
    updated_at: string;
  }[];
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
  user_id?: string;
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
    | "payment_requested"
    | "other";
  content: string;
  title?: string;
  data?: any;
  is_read: boolean;
  sent_at: string;
  status: "sent" | "failed";

  // Relation (if included)
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export interface NotificationFilters {
  user_id?: string;
  type?: string;
  is_read?: boolean;
  page?: number;
  limit?: number;
}

// ==================== CHAT TYPES ====================

export interface ChatSession {
  id: string;
  user_id?: string;
  is_authenticated: boolean;
  channel: "web" | "app" | "zalo";
  context?: any;
  start_time?: string;
  end_time?: string;
  status: "active" | "closed";
  handled_by: "bot" | "human";
  bot_enabled?: boolean;

  // Relation (if included)
  user?: {
    id: string;
    username: string;
    email: string;
    phone?: string;
    full_name?: string;
  };
}

export interface ChatMessage {
  id: string;
  session_id?: string;
  sender_type: "user" | "bot" | "human";
  sender_id?: string | null;
  message_text: string;
  timestamp?: string;
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
    removeVoucher: (id: string): Promise<ApiResponse<Order>> =>
      apiClient.delete(`/orders/${id}/voucher`),
    create: (data: {
      table_id?: string;
      table_group_id?: string;
      reservation_id?: string;
      items?: Array<{
        dish_id: string;
        quantity: number;
        price: number;
        customizations?: any;
      }>;
      voucher_code?: string;
      status?: string;
    }): Promise<ApiResponse<Order>> => apiClient.post("/orders", data),
    update: (
      id: string,
      data: {
        table_id?: string;
        table_group_id?: string;
        status?: string;
        payment_method?: string;
      }
    ): Promise<ApiResponse<Order>> => apiClient.patch(`/orders/${id}`, data),
    mergeOrders: (
      orderId1: string,
      orderId2: string
    ): Promise<ApiResponse<Order>> =>
      apiClient.post("/orders/merge", {
        order_id_1: orderId1,
        order_id_2: orderId2,
      }),
    requestSupport: (id: string): Promise<ApiResponse> =>
      apiClient.post(`/orders/${id}/support`),
    requestPayment: (
      id: string,
      data: { method: string; amount: number; client?: string }
    ): Promise<ApiResponse<{ redirect_url: string }>> =>
      apiClient.post(`/orders/${id}/payment/request`, data),
    requestCashPayment: (
      id: string,
      data?: { note?: string; pointsUsed?: number }
    ): Promise<
      ApiResponse<{
        message: string;
        vat_amount?: number;
        points_used?: number;
        final_payment_amount?: number;
      }>
    > => apiClient.post(`/orders/${id}/payment/cash`, data || {}),
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
    create: (data: {
      table_id?: string;
      table_group_id?: string;
      reservation_time: string;
      duration_minutes: number;
      num_people: number;
      preferences?: any;
      pre_order_items?: any;
      event_id?: string;
      notes?: string;
    }): Promise<ApiResponse<Reservation>> =>
      apiClient.post("/reservations", data),
    update: (
      id: string,
      data: {
        table_id?: string;
        table_group_id?: string;
        reservation_time?: string;
        duration_minutes?: number;
        num_people?: number;
        preferences?: any;
        pre_order_items?: any;
        event_id?: string | null;
        notes?: string;
      }
    ): Promise<ApiResponse<Reservation>> =>
      apiClient.patch(`/reservations/${id}`, data),
    updateStatus: (
      id: string,
      status: string
    ): Promise<ApiResponse<Reservation>> =>
      apiClient.patch(`/reservations/${id}/status`, { status }),
    checkIn: (id: string): Promise<ApiResponse<Reservation>> =>
      apiClient.post(`/reservations/${id}/checkin`),
    cancel: (id: string, reason: string): Promise<ApiResponse<Reservation>> =>
      apiClient.post(`/reservations/${id}/cancel`, { reason }),
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

  // ==================== EVENTS ====================
  events: {
    getAll: (): Promise<ApiResponse<any[]>> => apiClient.get("/events"),
    getById: (id: string): Promise<ApiResponse<any>> =>
      apiClient.get(`/events/${id}`),
    getActive: (): Promise<ApiResponse<any[]>> =>
      apiClient.get("/events/active"),
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
