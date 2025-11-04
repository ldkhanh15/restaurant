import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  Dimensions,
  FlatList,
  TouchableOpacity
} from 'react-native';
import { Text, useTheme, Card, Badge, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  LineChart,
  BarChart,
  PieChart,
} from 'react-native-chart-kit';

import { StatCard } from '../components';
import { useDashboard } from '../hooks/useDashboard';
import { spacing } from '../theme';

const screenWidth = Dimensions.get('window').width;

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

const DashboardScreen = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Safe check for theme
  if (!theme || !theme.colors) {
    return null;
  }
  
  const {
    stats,
    revenueStats,
    dailyOrders,
    popularDishes,
    recentOrders,
    loading,
    error,
    fetchAllData
  } = useDashboard();

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Transform real data to display format  
  const enhancedStats = stats ? [
    {
      title: "Khách hàng",
      value: (stats.totalCustomers || 0).toLocaleString(),
      change: "+12%",
      icon: "👥",
      color: "#2196F3",
    },
    {
      title: "Đơn hàng hôm nay", 
      value: (stats.todayOrders || 0).toString(),
      change: "+8%",
      icon: "🛒",
      color: "#4CAF50",
    },
    {
      title: "Doanh thu tháng",
      value: formatCurrency(stats.monthlyRevenue || 0),
      change: "+15%",
      icon: "💰",
      color: "#FF9800",
    },
    {
      title: "Đặt bàn hôm nay",
      value: (stats.todayReservations || 0).toString(),
      change: "+5%",
      icon: "📅",
      color: "#9C27B0",
    },
    {
      title: "Món ăn",
      value: (stats.totalDishes || 0).toString(),
      change: "+3%",
      icon: "🍜",
      color: "#FF5722",
    },
    {
      title: "Tăng trưởng",
      value: `${stats.growthRate || 0}%`,
      change: "+2%",
      icon: "📈",
      color: "#607D8B",
    },
  ] : [];

  // Use real recent orders data  
  const recentOrdersData = recentOrders || [];

  // Load data on component mount and test API
  React.useEffect(() => {
    // Fetch all dashboard data
    fetchAllData();
  }, [fetchAllData]);

  const tableUtilization = [
    { table: "Bàn 1-5", utilization: 85, occupied: 17, total: 20, capacity: "4 người/bàn" },
    { table: "Bàn 6-10", utilization: 92, occupied: 22, total: 24, capacity: "6 người/bàn" },
    { table: "VIP Area", utilization: 78, occupied: 14, total: 18, capacity: "8 người/bàn" },
    { table: "Rooftop", utilization: 65, occupied: 10, total: 16, capacity: "4 người/bàn" },
    { table: "Sân vườn", utilization: 88, occupied: 11, total: 12, capacity: "6 người/bàn" },
  ];

  // Thêm dữ liệu cho các biểu đồ mới
  const monthlyRevenueData = [
    { month: "T1", revenue: 45, area: 42 },
    { month: "T2", revenue: 52, area: 48 },
    { month: "T3", revenue: 48, area: 45 },
    { month: "T4", revenue: 61, area: 58 },
    { month: "T5", revenue: 55, area: 52 },
    { month: "T6", revenue: 67, area: 63 },
    { month: "T7", revenue: 72, area: 69 },
    { month: "T8", revenue: 69, area: 65 },
    { month: "T9", revenue: 58, area: 55 },
    { month: "T10", revenue: 63, area: 60 },
    { month: "T11", revenue: 71, area: 67 },
    { month: "T12", revenue: 78, area: 74 },
  ];

  const customerSatisfaction = [
    { rating: "5 sao", count: 342, percentage: 68.4, color: "#4CAF50" },
    { rating: "4 sao", count: 98, percentage: 19.6, color: "#8BC34A" },
    { rating: "3 sao", count: 35, percentage: 7.0, color: "#FFC107" },
    { rating: "2 sao", count: 15, percentage: 3.0, color: "#FF9800" },
    { rating: "1 sao", count: 10, percentage: 2.0, color: "#F44336" },
  ];

  // Transform data for charts with better mobile sizing
  const transformRevenueData = () => {
    if (!revenueStats || revenueStats.length === 0) return null;
    return {
      labels: revenueStats.map((item: any) => item.month),
      datasets: [{
        data: revenueStats.map((item: any) => item.revenue / 1000000), // Convert to millions
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  };

  const transformMonthlyAreaData = () => {
    if (!revenueStats || revenueStats.length === 0) return null;
    return {
      labels: revenueStats.map((item: any) => item.month),
      datasets: [{
        data: revenueStats.map((item: any) => item.revenue),
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        strokeWidth: 3,
      }],
    };
  };

  const transformHourlyData = () => {
    // Use revenueStats as hourly data if available
    if (!revenueStats || revenueStats.length === 0) return null;
    return {
      labels: revenueStats.map((item: any) => item.month || `${item.hour}h`),
      datasets: [{
        data: revenueStats.map((item: any) => item.revenue),
      }],
    };
  };

  const transformOrdersData = () => {
    if (!dailyOrders || dailyOrders.length === 0) return null;
    return {
      labels: dailyOrders.map((item: any) => item.date),
      datasets: [{
        data: dailyOrders.map((item: any) => item.total_orders || item.orders),
      }],
    };
  };

  const transformDishesData = () => {
    if (!popularDishes || popularDishes.length === 0) return null;
    const colors = [
      '#FF6384',
      '#36A2EB', 
      '#FFCE56',
      '#4BC0C0',
      '#9966FF',
    ];
    
    return popularDishes.slice(0, 5).map((item: any, index: number) => ({
      name: item.name,
      population: item.orders,
      color: colors[index % colors.length],
      legendFontColor: theme.colors.onSurface,
      legendFontSize: 10,
    }));
  };

  // Chart configuration with better mobile sizing
  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: (opacity = 1) => theme.colors.onSurface,
    style: {
      borderRadius: 12,
    },
    propsForDots: {
      r: '3',
      strokeWidth: '1',
      stroke: theme.colors.primary,
    },
    propsForLabels: {
      fontSize: 10,
    },
  };

  const getChartWidth = () => screenWidth - 64; // Increased padding for safety

  const renderStatCard = ({ item }: { item: any }) => (
    <StatCard
      title={item.title}
      value={item.value}
      icon={item.icon}
      color={item.color}
      change={item.change || '+0%'}
    />
  );

  const renderRecentOrder = ({ item }: { item: any }) => {
    // Add safety checks
    if (!item) return null;
    
    return (
      <Card style={[styles.orderCard, { backgroundColor: theme.colors.surface }]} mode="outlined">
        <Card.Content style={styles.orderContent}>
          <View style={styles.orderHeader}>
            <View>
              <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>{item.id || 'N/A'}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {item.customer || 'Unknown'}
              </Text>
            </View>
            <View style={styles.orderRight}>
              <Text variant="titleSmall" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                {formatCurrency(item.amount || 0)}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {item.time || 'N/A'}
              </Text>
            </View>
          </View>
          <Badge 
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status || 'unknown') }
            ]}
          >
            {item.status || 'Unknown'}
          </Badge>
        </Card.Content>
      </Card>
    );
  };

  const renderTableUtilization = ({ item }: { item: any }) => (
    <Card style={[styles.tableCard, { backgroundColor: theme.colors.surface }]} mode="outlined">
      <Card.Content>
        <View style={styles.tableHeader}>
          <View>
            <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>{item.table}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {item.capacity}
            </Text>
          </View>
          <Text variant="titleSmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
            {item.utilization}%
          </Text>
        </View>
        <View style={styles.tableProgress}>
          <View 
            style={[
              styles.progressBar,
              { backgroundColor: theme.colors.surfaceVariant }
            ]}
          >
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${item.utilization}%`,
                  backgroundColor: item.utilization > 80 ? '#4CAF50' : item.utilization > 60 ? '#FF9800' : '#F44336'
                }
              ]}
            />
          </View>
        </View>
        <View style={styles.tableStats}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Đang sử dụng: {item.occupied}/{item.total} bàn
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
            Công suất: {Math.round((item.occupied * 100) / item.total)}%
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderSatisfactionItem = ({ item }: { item: any }) => (
    <View style={styles.satisfactionItem}>
      <View style={styles.satisfactionLeft}>
        <View style={[styles.colorDot, { backgroundColor: item.color }]} />
        <Text variant="bodyMedium">{item.rating}</Text>
      </View>
      <View style={styles.satisfactionRight}>
        <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>{item.count}</Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          ({item.percentage}%)
        </Text>
      </View>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Đã thanh toán': return '#4CAF50';
      case 'Đã hoàn thành': return '#2196F3';
      case 'Đang chế biến': return '#FF9800';
      case 'Chờ thanh toán': return '#F44336';
      default: return theme.colors.outline;
    }
  };

  const tabOptions = [
    { value: 'overview', label: 'Tổng quan' },
    { value: 'revenue', label: 'Doanh thu' },
    { value: 'orders', label: 'Đơn hàng' },
    { value: 'dishes', label: 'Món ăn' },
    { value: 'tables', label: 'Bàn ăn' },
    { value: 'satisfaction', label: 'Đánh giá' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchAllData}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            Dashboard
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Chào mừng quay trở lại! 👋
          </Text>
        </View>

        {/* Stats Grid */}
        {loading ? (
          <View style={[styles.statGrid, { justifyContent: 'center', alignItems: 'center', height: 200 }]}>
            <Text style={{ color: theme.colors.onBackground }}>Đang tải dữ liệu...</Text>
          </View>
        ) : (
          <FlatList
            data={enhancedStats}
            style={styles.statGrid}
            numColumns={2}
            columnWrapperStyle={styles.row}
            keyExtractor={(item) => item.title}
            renderItem={renderStatCard}
            scrollEnabled={false}
          />
        )}

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tabButtons}>
              {tabOptions.map((tab) => (
                <TouchableOpacity
                  key={tab.value}
                  style={[
                    styles.tabButton,
                    activeTab === tab.value && styles.activeTabButton,
                    { borderColor: theme.colors.outline }
                  ]}
                  onPress={() => setActiveTab(tab.value)}
                >
                  <Text 
                    style={[
                      styles.tabButtonText,
                      { color: activeTab === tab.value ? theme.colors.primary : theme.colors.onSurfaceVariant }
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <View>
            {/* Revenue Overview */}
            {revenueStats && transformRevenueData() && (
              <View style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
                  Tổng quan doanh thu (triệu VNĐ)
                </Text>
                <LineChart
                  data={transformRevenueData()!}
                  width={getChartWidth()}
                  height={200}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              </View>
            )}

            {/* Recent Orders */}
            <View style={[styles.sectionContainer, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Đơn hàng gần đây
              </Text>
              <FlatList
                data={recentOrders}
                renderItem={renderRecentOrder}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        )}

        {activeTab === 'revenue' && (
          <View>
            {/* Monthly Revenue Area Chart */}
            {transformMonthlyAreaData() && (
              <View style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
                  Doanh thu theo tháng (triệu VNĐ)
                </Text>
                <LineChart
                  data={transformMonthlyAreaData()!}
                  width={getChartWidth()}
                  height={200}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              </View>
            )}

            {/* Hourly Revenue Bar Chart */}
            {revenueStats && transformHourlyData() && (
              <View style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
                  Doanh thu theo giờ (triệu VNĐ)
                </Text>
                <BarChart
                  data={transformHourlyData()!}
                  width={getChartWidth()}
                  height={200}
                  chartConfig={chartConfig}
                  style={styles.chart}
                  yAxisLabel=""
                  yAxisSuffix="M"
                />
              </View>
            )}

            {/* Revenue Comparison Line Chart */}
            {revenueStats && transformRevenueData() && (
              <View style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
                  So sánh doanh thu, đơn hàng, khách hàng
                </Text>
                <LineChart
                  data={transformRevenueData()!}
                  width={getChartWidth()}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              </View>
            )}
          </View>
        )}

        {activeTab === 'orders' && dailyOrders && transformOrdersData() && (
          <View style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Đơn hàng theo ngày
            </Text>
            <BarChart
              data={transformOrdersData()!}
              width={getChartWidth()}
              height={200}
              chartConfig={chartConfig}
              style={styles.chart}
              yAxisLabel=""
              yAxisSuffix=""
            />
          </View>
        )}

        {activeTab === 'dishes' && popularDishes && transformDishesData() && (
          <View style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Món ăn phổ biến
            </Text>
            <PieChart
              data={transformDishesData()!}
              width={getChartWidth()}
              height={200}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </View>
        )}

        {activeTab === 'tables' && (
          <View style={[styles.sectionContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Tình trạng sử dụng bàn
            </Text>
            <FlatList
              data={tableUtilization}
              renderItem={renderTableUtilization}
              keyExtractor={(item) => item.table}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {activeTab === 'satisfaction' && (
          <View style={[styles.sectionContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Đánh giá khách hàng
            </Text>
            <FlatList
              data={customerSatisfaction}
              renderItem={renderSatisfactionItem}
              keyExtractor={(item) => item.rating}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Quick Actions */}
        <View style={[styles.quickActions, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Hành động nhanh
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.primaryContainer }]}>
              <Text style={{ color: theme.colors.onPrimaryContainer, textAlign: 'center' }}>📋 Đơn hàng mới</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.secondaryContainer }]}>
              <Text style={{ color: theme.colors.onSecondaryContainer, textAlign: 'center' }}>👥 Thêm khách hàng</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.tertiaryContainer }]}>
              <Text style={{ color: theme.colors.onTertiaryContainer, textAlign: 'center' }}>📊 Báo cáo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  statGrid: {
    paddingHorizontal: spacing.md,
    paddingTop: 0,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  // Tab styles
  tabContainer: {
    paddingHorizontal: spacing.md,
    marginVertical: spacing.md,
  },
  tabButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tabButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Chart styles
  chartContainer: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  chart: {
    marginVertical: spacing.xs,
    borderRadius: 12,
    alignSelf: 'center',
  },
  // Section styles
  sectionContainer: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  // Order card styles
  orderCard: {
    marginBottom: spacing.md,
  },
  orderContent: {
    padding: spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  // Table card styles
  tableCard: {
    marginBottom: spacing.md,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  tableProgress: {
    marginVertical: spacing.sm,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  tableStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  // Satisfaction styles
  satisfactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  satisfactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  satisfactionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  // Quick actions
  quickActions: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    borderRadius: 8,
    alignItems: 'center',
  },
});

export default DashboardScreen;