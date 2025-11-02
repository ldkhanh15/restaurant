import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, getBaseURL, API_CONFIG } from '../config/appConfig';
import { clearAuthData, triggerLogout } from '../utils/authUtils';

// Base configuration - FIXED: Sử dụng getBaseURL() thay vì hardcode
const BASE_URL = getBaseURL();
const TIMEOUT = API_CONFIG.TIMEOUT;

// API Response interface
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
}

// Auth interfaces
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  role?: 'admin' | 'employee' | 'customer';
}

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    username: string;
    full_name: string;
    role: string;
    created_at: string;
  };
  token: string;
  expires_in: number;
}

// User interfaces
export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: string;
  avatar?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

// Order interfaces
export interface Order {
  id: number;
  user_id: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  // cspell:disable-next-line - Vietnamese payment methods
  payment_method: 'cash' | 'card' | 'transfer' | 'momo' | 'zalopay';
  total_amount: number;
  table_id?: number;
  voucher_id?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  dish_id: number;
  quantity: number;
  price: number;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  customizations?: string;
  created_at: string;
}

// Employee interfaces
export interface Employee {
  id: number;
  user_id: number;
  position: string;
  department: string;
  hire_date: string;
  salary: number;
  status: 'active' | 'inactive' | 'terminated';
  created_at: string;
  updated_at: string;
  user?: User;
}

// Payment interfaces
export interface Payment {
  id: number;
  order_id?: number;
  reservation_id?: number;
  amount: number;
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_id?: string;
  created_at: string;
  updated_at: string;
}

// Notification interfaces
export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_read: boolean;
  created_at: string;
}

class SwaggerAPIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      async (config) => {
        try {
          const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }

          // Debug logging
          if (__DEV__) {
            console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
            if (token) {
              console.log(`🔑 Token: ${token.substring(0, 20)}...`);
            }
          }
        } catch (error) {
          console.error('❌ Error getting token:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle auth errors
    this.client.interceptors.response.use(
      (response) => {
        if (__DEV__) {
          console.log(`✅ API Success: ${response.config.url}`);
        }
        return response;
      },
      async (error: AxiosError) => {
        if (__DEV__) {
          console.error('❌ API Error:', {
            status: error.response?.status,
            data: error.response?.data,
            url: error.config?.url,
          });
        }

        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          console.log('🔑 401 Unauthorized - Token expired or invalid');
          await clearAuthData();
          triggerLogout();
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  auth = {
    login: async (data: LoginRequest): Promise<AxiosResponse<ApiResponse<AuthResponse>>> => {
      return this.client.post('/auth/login', data);
    },

    signup: async (data: SignupRequest): Promise<AxiosResponse<ApiResponse<AuthResponse>>> => {
      return this.client.post('/auth/signup', data);
    },

    validateToken: async (): Promise<AxiosResponse<ApiResponse<{ valid: boolean }>>> => {
      return this.client.get('/auth/validate');
    },
  };

  // Users endpoints
  users = {
    list: async (params?: { page?: number; limit?: number; role?: string }): Promise<AxiosResponse<ApiResponse<{ items: User[]; total: number }>>> => {
      return this.client.get('/users', { params });
    },

    getById: async (id: number): Promise<AxiosResponse<ApiResponse<User>>> => {
      return this.client.get(`/users/${id}`);
    },

    create: async (data: Partial<User>): Promise<AxiosResponse<ApiResponse<User>>> => {
      return this.client.post('/users', data);
    },

    update: async (id: number, data: Partial<User>): Promise<AxiosResponse<ApiResponse<User>>> => {
      return this.client.put(`/users/${id}`, data);
    },

    delete: async (id: number): Promise<AxiosResponse<ApiResponse<{ deleted: boolean }>>> => {
      return this.client.delete(`/users/${id}`);
    },
  };

  // Orders endpoints
  orders = {
    list: async (params?: { 
      page?: number; 
      limit?: number; 
      status?: string; 
      user_id?: number;
      table_id?: number;
    }): Promise<AxiosResponse<ApiResponse<{ items: Order[]; total: number }>>> => {
      return this.client.get('/orders', { params });
    },

    getById: async (id: number): Promise<AxiosResponse<ApiResponse<Order>>> => {
      return this.client.get(`/orders/${id}`);
    },

    create: async (data: Partial<Order>): Promise<AxiosResponse<ApiResponse<Order>>> => {
      return this.client.post('/orders', data);
    },

    updateStatus: async (id: number, status: string): Promise<AxiosResponse<ApiResponse<Order>>> => {
      return this.client.patch(`/orders/${id}/status`, { status });
    },

    addItem: async (id: number, item: Partial<OrderItem>): Promise<AxiosResponse<ApiResponse<OrderItem>>> => {
      return this.client.post(`/orders/${id}/items`, item);
    },

    updateItem: async (itemId: number, data: Partial<OrderItem>): Promise<AxiosResponse<ApiResponse<OrderItem>>> => {
      return this.client.put(`/orders/items/${itemId}`, data);
    },

    deleteItem: async (itemId: number): Promise<AxiosResponse<ApiResponse<{ deleted: boolean }>>> => {
      return this.client.delete(`/orders/items/${itemId}`);
    },
  };

  // Employees endpoints
  employees = {
    list: async (params?: { 
      page?: number; 
      limit?: number; 
      position?: string;
      department?: string;
      status?: string;
    }): Promise<AxiosResponse<ApiResponse<{ items: Employee[]; total: number }>>> => {
      return this.client.get('/employees', { params });
    },

    getById: async (id: number): Promise<AxiosResponse<ApiResponse<Employee>>> => {
      return this.client.get(`/employees/${id}`);
    },

    create: async (data: Partial<Employee>): Promise<AxiosResponse<ApiResponse<Employee>>> => {
      return this.client.post('/employees', data);
    },

    update: async (id: number, data: Partial<Employee>): Promise<AxiosResponse<ApiResponse<Employee>>> => {
      return this.client.put(`/employees/${id}`, data);
    },

    delete: async (id: number): Promise<AxiosResponse<ApiResponse<{ deleted: boolean }>>> => {
      return this.client.delete(`/employees/${id}`);
    },
  };

  // Payments endpoints
  payments = {
    list: async (params?: { 
      page?: number; 
      limit?: number; 
      payment_method?: string;
      payment_status?: string;
      start_date?: string;
      end_date?: string;
    }): Promise<AxiosResponse<ApiResponse<{ items: Payment[]; total: number }>>> => {
      return this.client.get('/payments', { params });
    },

    getById: async (id: number): Promise<AxiosResponse<ApiResponse<Payment>>> => {
      return this.client.get(`/payments/${id}`);
    },

    create: async (data: Partial<Payment>): Promise<AxiosResponse<ApiResponse<Payment>>> => {
      return this.client.post('/payments', data);
    },

    updateStatus: async (id: number, status: string): Promise<AxiosResponse<ApiResponse<Payment>>> => {
      return this.client.patch(`/payments/${id}/status`, { status });
    },

    // Dashboard stats endpoints
    stats: {
      dashboard: async (params?: { start_date?: string; end_date?: string }): Promise<AxiosResponse<ApiResponse<any>>> => {
        return this.client.get('/payments/stats/dashboard', { params });
      },

      daily: async (params?: { start_date?: string; end_date?: string }): Promise<AxiosResponse<ApiResponse<any[]>>> => {
        return this.client.get('/payments/stats/daily', { params });
      },

      monthly: async (params?: { start_date?: string; end_date?: string }): Promise<AxiosResponse<ApiResponse<any[]>>> => {
        return this.client.get('/payments/stats/monthly', { params });
      },

      dishes: async (params?: { start_date?: string; end_date?: string }): Promise<AxiosResponse<ApiResponse<any[]>>> => {
        return this.client.get('/payments/stats/dishes', { params });
      },
    },
  };

  // Dashboard endpoints
  dashboard = {
    stats: async (): Promise<AxiosResponse<ApiResponse<any>>> => {
      return this.client.get('/dashboard/stats');
    },

    revenue: async (params?: { year?: number }): Promise<AxiosResponse<ApiResponse<any[]>>> => {
      return this.client.get('/dashboard/revenue', { params });
    },

    orders: {
      daily: async (params?: { date?: string }): Promise<AxiosResponse<ApiResponse<any[]>>> => {
        return this.client.get('/dashboard/orders/daily', { params });
      },

      recent: async (params?: { limit?: number }): Promise<AxiosResponse<ApiResponse<any[]>>> => {
        return this.client.get('/dashboard/orders/recent', { params });
      },

      hourlyRevenue: async (params?: { date?: string }): Promise<AxiosResponse<ApiResponse<any[]>>> => {
        return this.client.get('/dashboard/orders/hourly-revenue', { params });
      },
    },

    dishes: {
      popular: async (params?: { limit?: number }): Promise<AxiosResponse<ApiResponse<any[]>>> => {
        return this.client.get('/dashboard/dishes/popular', { params });
      },
    },
  };

  // Notifications endpoints
  notifications = {
    list: async (params?: { 
      page?: number; 
      limit?: number; 
      type?: string;
      is_read?: boolean;
    }): Promise<AxiosResponse<ApiResponse<{ items: Notification[]; total: number }>>> => {
      return this.client.get('/notifications', { params });
    },

    getById: async (id: number): Promise<AxiosResponse<ApiResponse<Notification>>> => {
      return this.client.get(`/notifications/${id}`);
    },

    markAsRead: async (id: number): Promise<AxiosResponse<ApiResponse<Notification>>> => {
      return this.client.patch(`/notifications/${id}/read`);
    },

    markAllAsRead: async (): Promise<AxiosResponse<ApiResponse<{ updated: number }>>> => {
      return this.client.patch('/notifications/read-all');
    },

    getUnreadCount: async (): Promise<AxiosResponse<ApiResponse<{ count: number }>>> => {
      return this.client.get('/notifications/unread/count');
    },
  };

  // Health check
  health = {
    check: async (): Promise<AxiosResponse<{ status: string; timestamp: string }>> => {
      return this.client.get('/health');
    },
  };

  // Raw client access for custom requests
  getClient(): AxiosInstance {
    return this.client;
  }
}

// Create singleton instance
const swaggerClient = new SwaggerAPIClient();

export default swaggerClient;

// Export for easy importing
export { swaggerClient };

// Note: Types are already exported above with their interface declarations