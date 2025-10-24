// Dashboard API Test Utility
import { getDashboardStats, getRevenueData, getPopularDishes, getRecentOrders } from '../api/dashboard';

export const testDashboardAPI = async () => {
  console.log('🧪 Testing Dashboard API Connection...');
  
  try {
    // Test 1: Dashboard Stats
    console.log('📊 Testing getDashboardStats...');
    const stats = await getDashboardStats();
    console.log('✅ Dashboard Stats:', {
      totalCustomers: stats.totalCustomers,
      todayOrders: stats.todayOrders,
      monthlyRevenue: stats.monthlyRevenue,
      todayReservations: stats.todayReservations,
      totalDishes: stats.totalDishes,
      growthRate: stats.growthRate
    });
    
    // Test 2: Revenue Data
    console.log('💰 Testing getRevenueData...');
    const revenueData = await getRevenueData();
    console.log(`✅ Revenue Data: ${revenueData.length} months`);
    
    // Test 3: Popular Dishes
    console.log('🍽️ Testing getPopularDishes...');
    const popularDishes = await getPopularDishes(5);
    console.log(`✅ Popular Dishes: ${popularDishes.length} dishes`);
    
    // Test 4: Recent Orders
    console.log('📋 Testing getRecentOrders...');
    const recentOrders = await getRecentOrders(5);
    console.log(`✅ Recent Orders: ${recentOrders.length} orders`);
    
    console.log('🎉 All Dashboard API tests passed!');
    return true;
    
  } catch (error: any) {
    console.error('❌ Dashboard API Test Failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return false;
  }
};

// Test function for development
export const runDashboardTests = () => {
  if (__DEV__) {
    testDashboardAPI();
  }
};