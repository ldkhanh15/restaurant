import api from './axiosConfig';

// Types cho dashboard API responses
export interface DashboardStats {
  totalCustomers: number;
  todayOrders: number;
  monthlyRevenue: number;
  todayReservations: number;
  totalDishes: number;
  growthRate: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
}

export interface DailyOrdersData {
  time: string;
  orders: number;
}

export interface PopularDish {
  name: string;
  orders: number;
  revenue: number;
}

export interface RecentOrder {
  id: string;
  customer: string;
  amount: number;
  status: string;
  time: string;
}

export interface HourlyRevenueData {
  time: string;
  revenue: number;
}

// Dashboard API functions
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    console.log('🔄 Fetching dashboard stats...');
    console.log('🔗 API Base URL:', api.defaults.baseURL);
    const response = await api.get('/dashboard/stats');
    console.log('✅ Dashboard stats API response:', response.data);
    return response.data.data;
  } catch (error: any) {
    console.error('❌ Dashboard stats API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url
    });
    throw error;
  }
};

export const getRevenueData = async (year?: number): Promise<RevenueData[]> => {
  try {
    console.log('🔄 Fetching revenue data...');
    const params = year ? { year } : {};
    const response = await api.get('/dashboard/revenue', { params });
    console.log('✅ Revenue data response:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Error fetching revenue data:', error);
    throw error;
  }
};

export const getDailyOrdersData = async (date?: string): Promise<DailyOrdersData[]> => {
  try {
    console.log('🔄 Fetching daily orders data...');
    const params = date ? { date } : {};
    const response = await api.get('/dashboard/orders/daily', { params });
    console.log('✅ Daily orders data response:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Error fetching daily orders data:', error);
    throw error;
  }
};

export const getPopularDishes = async (limit?: number): Promise<PopularDish[]> => {
  try {
    console.log('🔄 Fetching popular dishes...');
    const params = limit ? { limit } : {};
    const response = await api.get('/dashboard/dishes/popular', { params });
    console.log('✅ Popular dishes response:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Error fetching popular dishes:', error);
    throw error;
  }
};

export const getRecentOrders = async (limit?: number): Promise<RecentOrder[]> => {
  try {
    console.log('🔄 Fetching recent orders...');
    const params = limit ? { limit } : {};
    const response = await api.get('/dashboard/orders/recent', { params });
    console.log('✅ Recent orders response:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Error fetching recent orders:', error);
    throw error;
  }
};

export const getHourlyRevenueData = async (date?: string): Promise<HourlyRevenueData[]> => {
  try {
    console.log('🔄 Fetching hourly revenue data...');
    const params = date ? { date } : {};
    const response = await api.get('/dashboard/orders/hourly-revenue', { params });
    console.log('✅ Hourly revenue data response:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Error fetching hourly revenue data:', error);
    throw error;
  }
};