import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { getDashboardStats, getRevenueData, getDailyOrdersData, getPopularDishes, getRecentOrders, getHourlyRevenueData } from '../api/dashboard';
import type { PopularDish as APIPopularDish, RecentOrder as APIRecentOrder } from '../api/dashboard';

// Dashboard types dựa trên backend response
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
  date: string;
  orders: number;
}

export interface PopularDish {
  id: string;
  name: string;
  orders: number;
  revenue: number;
}

export interface RecentOrder {
  id: string;
  table_number: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export interface HourlyRevenueData {
  hour: number;
  revenue: number;
}

export const useDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [dailyOrdersData, setDailyOrdersData] = useState<DailyOrdersData[]>([]);
  const [popularDishes, setPopularDishes] = useState<PopularDish[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [hourlyRevenue, setHourlyRevenue] = useState<HourlyRevenueData[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = useCallback(async () => {
    try {
      console.log('📊 Hook: Fetching dashboard stats...');
      setLoading(true);
      setError(null);

      // Sử dụng dashboard API trực tiếp
      const dashboardStats = await getDashboardStats();
        
      setStats(dashboardStats);
      console.log('✅ Hook: Dashboard stats loaded:', dashboardStats);
    } catch (err: any) {
      console.error('❌ Hook: Error fetching dashboard stats:', err);
      setError(err.message);
      
      // Set default stats on error
      setStats({
        totalCustomers: 0,
        todayOrders: 0,
        monthlyRevenue: 0,
        todayReservations: 0,
        totalDishes: 0,
        growthRate: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRevenueStats = useCallback(async (year?: number) => {
    try {
      console.log('💰 Hook: Fetching revenue stats...');
      setLoading(true);

      const revenueStats = await getRevenueData(year);
      setRevenueData(revenueStats);
      console.log('✅ Hook: Revenue stats loaded:', revenueStats.length);
    } catch (err: any) {
      console.error('❌ Hook: Error fetching revenue stats:', err);
      setRevenueData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDailyOrdersStats = useCallback(async (date?: string) => {
    try {
      console.log('📈 Hook: Fetching daily orders stats...');
      setLoading(true);

      const apiDailyOrders = await getDailyOrdersData(date);
      
      // Transform API response to hook interface  
      const ordersStats: DailyOrdersData[] = apiDailyOrders.map((item) => ({
        date: item.time, // API uses 'time', hook expects 'date'
        orders: item.orders
      }));
      
      setDailyOrdersData(ordersStats);
      console.log('✅ Hook: Daily orders stats loaded:', ordersStats.length);
    } catch (err: any) {
      console.error('❌ Hook: Error fetching daily orders stats:', err);
      setDailyOrdersData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPopularDishes = useCallback(async (limit?: number) => {
    try {
      console.log('🍽️ Hook: Fetching popular dishes...');
      setLoading(true);
      
      const apiPopularDishes = await getPopularDishes(limit);
      
      // Transform API response to hook interface
      const popularDishesStats: PopularDish[] = apiPopularDishes.map((dish, index) => ({
        id: `dish-${index}`, // Generate ID since API doesn't provide one
        name: dish.name,
        orders: dish.orders,
        revenue: dish.revenue
      }));
      
      setPopularDishes(popularDishesStats);
      console.log('✅ Hook: Popular dishes loaded:', popularDishesStats.length);
    } catch (err: any) {
      console.error('❌ Hook: Error fetching popular dishes:', err);
      setPopularDishes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecentOrders = useCallback(async (limit?: number) => {
    try {
      console.log('📋 Hook: Fetching recent orders...');
      setLoading(true);
      
      const apiRecentOrders = await getRecentOrders(limit);
      
      // Transform API response to hook interface
      const recentOrdersStats: RecentOrder[] = apiRecentOrders.map((order) => ({
        id: order.id,
        table_number: order.customer || 'N/A', // Use customer as table info
        total_amount: order.amount,
        status: order.status,
        created_at: order.time
      }));
      
      setRecentOrders(recentOrdersStats);
      console.log('✅ Hook: Recent orders loaded:', recentOrdersStats.length);
    } catch (err: any) {
      console.error('❌ Hook: Error fetching recent orders:', err);
      setRecentOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHourlyRevenue = useCallback(async (date?: string) => {
    try {
      console.log('⏰ Hook: Fetching hourly revenue...');
      setLoading(true);
      
      const apiHourlyRevenue = await getHourlyRevenueData(date);
      
      // Transform API response to hook interface
      const hourlyData: HourlyRevenueData[] = apiHourlyRevenue.map((item) => ({
        hour: parseInt(item.time) || 0, // Convert time to hour
        revenue: item.revenue
      }));
      
      setHourlyRevenue(hourlyData);
      console.log('✅ Hook: Hourly revenue loaded:', hourlyData.length);
    } catch (err: any) {
      console.error('❌ Hook: Error fetching hourly revenue:', err);
      setHourlyRevenue([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllDashboardData = useCallback(async () => {
    try {
      console.log('🔄 Hook: Fetching all dashboard data...');
      await Promise.all([
        fetchDashboardStats(),
        fetchRevenueStats(),
        fetchDailyOrdersStats(),
        fetchPopularDishes(),
        fetchRecentOrders(),
        fetchHourlyRevenue()
      ]);
      console.log('✅ Hook: All dashboard data loaded');
    } catch (err: any) {
      console.error('❌ Hook: Error fetching dashboard data:', err);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu dashboard');
    }
  }, [
    fetchDashboardStats,
    fetchRevenueStats,
    fetchDailyOrdersStats,
    fetchPopularDishes,
    fetchRecentOrders,
    fetchHourlyRevenue
  ]);

  return {
    stats,
    revenueData,
    dailyOrdersData,
    popularDishes,
    recentOrders,
    hourlyRevenue,
    loading,
    error,
    fetchDashboardStats,
    fetchRevenueStats,
    fetchDailyOrdersStats,
    fetchPopularDishes,
    fetchRecentOrders,
    fetchHourlyRevenue,
    fetchAllDashboardData
  };
};