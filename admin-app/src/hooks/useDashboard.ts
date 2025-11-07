import { useState, useEffect, useCallback } from 'react';
import dashboardAPI from '../api/dashboardApi';
import type { 
  DashboardStats, 
  RevenueStats, 
  DailyOrderStats, 
  PopularDish, 
  RecentOrder 
} from '../api/dashboardApi';
import { logger } from '../utils/logger';

export const useDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueStats, setRevenueStats] = useState<RevenueStats[]>([]);
  const [dailyOrders, setDailyOrders] = useState<DailyOrderStats[]>([]);
  const [popularDishes, setPopularDishes] = useState<PopularDish[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [hourlyRevenue, setHourlyRevenue] = useState<any[]>([]);
  const [peakHours, setPeakHours] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      logger.info('Fetching dashboard stats...');
      
      const data = await dashboardAPI.getDashboardStats();
      setStats(data);
      
      logger.info('Dashboard stats loaded successfully');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load dashboard stats';
      setError(errorMessage);
      logger.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRevenueStats = useCallback(async (period: 'day' | 'week' | 'month' = 'month') => {
    try {
      setLoading(true);
      setError(null);
      logger.info('Fetching revenue stats...');
      
      // API doesn't accept period parameter yet
      const data = await dashboardAPI.getRevenueStats();
      console.log('📊 Revenue Stats Data:', data);
      setRevenueStats(Array.isArray(data) ? data : []);
      
      logger.info(`Revenue stats loaded successfully: ${data?.length || 0} items`);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load revenue stats';
      setError(errorMessage);
      logger.error('Error fetching revenue stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDailyOrders = useCallback(async (days: number = 7) => {
    try {
      setLoading(true);
      setError(null);
      logger.info('Fetching daily orders...');
      
      // API doesn't accept days parameter yet
      const data = await dashboardAPI.getDailyOrdersStats();
      console.log('📊 Daily Orders Data:', data);
      setDailyOrders(Array.isArray(data) ? data : []);
      
      logger.info(`Daily orders loaded successfully: ${data?.length || 0} items`);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load daily orders';
      setError(errorMessage);
      logger.error('Error fetching daily orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPopularDishes = useCallback(async (limit: number = 5) => {
    try {
      setLoading(true);
      setError(null);
      logger.info('Fetching popular dishes...');
      
      // API doesn't accept limit parameter yet
      const data = await dashboardAPI.getPopularDishes();
      console.log('📊 Popular Dishes Data:', data);
      setPopularDishes(Array.isArray(data) ? data : []);
      
      logger.info(`Popular dishes loaded successfully: ${data?.length || 0} items`);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load popular dishes';
      setError(errorMessage);
      logger.error('Error fetching popular dishes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecentOrders = useCallback(async (limit: number = 10) => {
    try {
      setLoading(true);
      setError(null);
      logger.info('Fetching recent orders...');
      
      const data = await dashboardAPI.getRecentOrders(limit);
      setRecentOrders(Array.isArray(data) ? data : []);
      
      logger.info('Recent orders loaded successfully');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load recent orders';
      setError(errorMessage);
      logger.error('Error fetching recent orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHourlyRevenue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      logger.info('Fetching hourly revenue...');
      
      const data = await dashboardAPI.getHourlyRevenueStats();
      console.log('📊 Hourly Revenue Data:', data);
      setHourlyRevenue(Array.isArray(data) ? data : []);
      
      logger.info(`Hourly revenue loaded successfully: ${data?.length || 0} items`);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load hourly revenue';
      setError(errorMessage);
      logger.error('Error fetching hourly revenue:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPeakHours = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      logger.info('Fetching peak hours...');
      
      const data = await dashboardAPI.getPeakHoursStats();
      console.log('📊 Peak Hours Data:', data);
      setPeakHours(Array.isArray(data) ? data : []);
      
      logger.info(`Peak hours loaded successfully: ${data?.length || 0} items`);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load peak hours';
      setError(errorMessage);
      logger.error('Error fetching peak hours:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([
      fetchDashboardStats(),
      fetchRevenueStats(),
      fetchDailyOrders(),
      fetchPopularDishes(),
      fetchRecentOrders(),
      fetchHourlyRevenue(),
      fetchPeakHours(),
    ]);
  }, [fetchDashboardStats, fetchRevenueStats, fetchDailyOrders, fetchPopularDishes, fetchRecentOrders, fetchHourlyRevenue, fetchPeakHours]);

  // Load initial data
  useEffect(() => {
    refresh();
  }, []);

  return {
    stats,
    revenueStats,
    dailyOrders,
    popularDishes,
    recentOrders,
    hourlyRevenue,
    peakHours,
    loading,
    error,
    fetchDashboardStats,
    fetchRevenueStats,
    fetchDailyOrders,
    fetchPopularDishes,
    fetchRecentOrders,
    fetchHourlyRevenue,
    fetchPeakHours,
    refresh,
    // Backward compatibility: some components expect `fetchAllData`
    fetchAllData: refresh,
  };
};
