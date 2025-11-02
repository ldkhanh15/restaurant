import api from './axiosConfig';
import { logger } from '../utils/logger';

export interface DashboardStats {
  totalCustomers: number;
  todayOrders: number;
  monthlyRevenue: number;
  todayReservations: number;
  totalDishes: number;
  growthRate: number;
}

export interface RevenueStats {
  month: string;
  revenue: number;
}

export interface DailyOrderStats {
  date: string;
  orderCount: number;
}

export interface HourlyRevenueStats {
  hour: string;
  revenue: number;
}

export interface PopularDish {
  id: string;
  name: string;
  totalOrdered: number;
  revenue: number;
}

export interface RecentOrder {
  id: string;
  user_id: string;
  table_id?: string;
  status: string;
  total_amount: number;
  created_at: string;
  user?: {
    username: string;
    email: string;
  };
  table?: {
    table_number: string;
  };
}

export class DashboardAPI {
  private baseURL = '/dashboard'; // FIXED: Loại bỏ /api prefix

  // Get dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      logger.api.request('GET /api/dashboard/stats');
      
      const response: any = await api.get(`${this.baseURL}/stats`);
      
      logger.api.response('GET /api/dashboard/stats', {
        status: 200
      });

      // Interceptor đã unwrap response.data.data -> response là object trực tiếp
      return response as DashboardStats;
    } catch (error: any) {
      logger.api.error('GET /api/dashboard/stats failed', error);
      throw new Error(error.response?.data?.message || 'Không thể tải thống kê dashboard');
    }
  }

  // Get revenue statistics
  async getRevenueStats(year?: number): Promise<RevenueStats[]> {
    try {
      const params = year ? { year } : {};
      logger.api.request('GET /api/dashboard/revenue', params);
      
      const response = await api.get(`${this.baseURL}/revenue`, { params });
      
      logger.api.response('GET /api/dashboard/revenue', {
        status: 200,
        count: Array.isArray(response) ? response.length : 0
      });

      // Interceptor đã unwrap response.data.data -> response là array trực tiếp
      return Array.isArray(response) ? response : [];
    } catch (error: any) {
      logger.api.error('GET /api/dashboard/revenue failed', error);
      throw new Error(error.response?.data?.message || 'Không thể tải thống kê doanh thu');
    }
  }

  // Get daily orders statistics
  async getDailyOrdersStats(): Promise<DailyOrderStats[]> {
    try {
      logger.api.request('GET /api/dashboard/orders/daily');
      
      const response = await api.get(`${this.baseURL}/orders/daily`);
      
      logger.api.response('GET /api/dashboard/orders/daily', {
        status: 200,
        count: Array.isArray(response) ? response.length : 0
      });

      return Array.isArray(response) ? response : [];
    } catch (error: any) {
      logger.api.error('GET /api/dashboard/orders/daily failed', error);
      throw new Error(error.response?.data?.message || 'Không thể tải thống kê đơn hàng hàng ngày');
    }
  }

  // Get hourly revenue statistics
  async getHourlyRevenueStats(): Promise<HourlyRevenueStats[]> {
    try {
      logger.api.request('GET /api/dashboard/orders/hourly-revenue');
      
      const response = await api.get(`${this.baseURL}/orders/hourly-revenue`);
      
      logger.api.response('GET /api/dashboard/orders/hourly-revenue', {
        status: 200,
        count: Array.isArray(response) ? response.length : 0
      });

      return Array.isArray(response) ? response : [];
    } catch (error: any) {
      logger.api.error('GET /api/dashboard/orders/hourly-revenue failed', error);
      throw new Error(error.response?.data?.message || 'Không thể tải thống kê doanh thu theo giờ');
    }
  }

  // Get popular dishes
  async getPopularDishes(): Promise<PopularDish[]> {
    try {
      logger.api.request('GET /api/dashboard/dishes/popular');
      
      const response = await api.get(`${this.baseURL}/dishes/popular`);
      
      logger.api.response('GET /api/dashboard/dishes/popular', {
        status: 200,
        count: Array.isArray(response) ? response.length : 0
      });

      return Array.isArray(response) ? response : [];
    } catch (error: any) {
      logger.api.error('GET /api/dashboard/dishes/popular failed', error);
      throw new Error(error.response?.data?.message || 'Không thể tải món ăn phổ biến');
    }
  }

  // Get recent orders
  async getRecentOrders(): Promise<RecentOrder[]> {
    try {
      logger.api.request('GET /api/dashboard/orders/recent');
      
      const response = await api.get(`${this.baseURL}/orders/recent`);
      
      logger.api.response('GET /api/dashboard/orders/recent', {
        status: 200,
        count: Array.isArray(response) ? response.length : 0
      });

      return Array.isArray(response) ? response : [];
    } catch (error: any) {
      logger.api.error('GET /api/dashboard/orders/recent failed', error);
      throw new Error(error.response?.data?.message || 'Không thể tải đơn hàng gần đây');
    }
  }
}

export const dashboardAPI = new DashboardAPI();
export default dashboardAPI;