import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  RefreshControl,
  TouchableOpacity,
  Text as RNText,
  TextInput,
  ScrollView,
  Dimensions,
  Alert
} from 'react-native';
import { 
  Text, 
  FAB, 
  useTheme,
  Menu,
  Button,
  Portal,
  Card,
  Chip,
  Modal,
  IconButton,
  Divider,
  Snackbar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

import { OrderCard, StatCard, CreateOrderModal } from '@/components';
import { useOrders } from '../hooks';
import { useRealtimeOrders } from '../hooks/useRealtimeOrders';
import orderService, { Order } from '../api/orderService';  // Import service and type from orderService
import { spacing } from '@/theme';

const OrdersScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [menuVisible, setMenuVisible] = useState(false);
  const [paymentMenuVisible, setPaymentMenuVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailVisible, setOrderDetailVisible] = useState(false);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'kitchen'>('orders');
  const [createOrderModalVisible, setCreateOrderModalVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [tables, setTables] = useState<any[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);

  const { 
    orders, 
    loading: isLoading, 
    refresh: refetch, 
    createOrder,
    updateStatus, 
    updatePaymentStatus 
  } = useOrders();

  // Real-time WebSocket integration
  const {
    onOrderCreated,
    onOrderUpdated,
    onOrderStatusChanged,
  } = useRealtimeOrders();

  // Load tables when modal opens
  useEffect(() => {
    if (createOrderModalVisible && tables.length === 0) {
      loadTables();
    }
  }, [createOrderModalVisible]);

  const loadTables = async () => {
    try {
      setLoadingTables(true);
      const response = await orderService.getAvailableTables();
      
      let tablesData = response?.data || response || [];
      
      // Filter only available tables
      if (Array.isArray(tablesData)) {
        tablesData = tablesData.filter((t: any) => 
          t.status === 'available' || t.status === 'empty'
        );
      } else {
        tablesData = [];
      }
      
      setTables(tablesData);
    } catch (error: any) {
      setSnackbarMessage('Không thể tải danh sách bàn');
      setSnackbarVisible(true);
      setTables([]);
    } finally {
      setLoadingTables(false);
    }
  };

  // Setup real-time event listeners
  useEffect(() => {
    // Listen for new orders
    const unsubscribeCreated = onOrderCreated((order) => {
      setSnackbarMessage(`Đơn hàng mới #${order.id}`);
      setSnackbarVisible(true);
      refetch();
    });

    // Listen for order updates
    const unsubscribeUpdated = onOrderUpdated((order) => {
      refetch();
    });

    // Listen for status changes
    const unsubscribeStatusChanged = onOrderStatusChanged(({ orderId, status }) => {
      setSnackbarMessage(`Đơn hàng #${orderId} - ${status}`);
      setSnackbarVisible(true);
      refetch();
    });

    // Cleanup on unmount
    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeStatusChanged();
    };
  }, [onOrderCreated, onOrderUpdated, onOrderStatusChanged, refetch]);

  const statusOptions = [
    { value: 'all', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ xử lý' },
    { value: 'dining', label: 'Đang chuẩn bị' },  // Backend: dining = preparing in UI
    { value: 'waiting_payment', label: 'Sẵn sàng' },  // Backend: waiting_payment = ready in UI
    { value: 'paid', label: 'Đã hoàn thành' },  // Backend: paid = completed in UI
    { value: 'cancelled', label: 'Đã hủy' },
  ];

  const paymentStatusOptions = [
    { value: 'all', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ thanh toán' },
    { value: 'paid', label: 'Đã thanh toán' },
    { value: 'failed', label: 'Thất bại' },
    { value: 'refunded', label: 'Đã hoàn tiền' },
  ];

  // Filter orders based on active tab and search criteria (with useMemo for performance)
  const filteredOrders = useMemo(() => {
    return orders?.filter((order: any) => {
      const searchLower = searchQuery.toLowerCase().trim();
      const matchesSearch = !searchQuery || 
        (order.order_number || '').toLowerCase().includes(searchLower) ||
        (order.customer_name || '').toLowerCase().includes(searchLower) ||
        (order.customer_phone || '').includes(searchQuery.trim()) ||
        (order.table_number || '').toString().includes(searchQuery.trim()) ||
        (order.id || '').toString().toLowerCase().includes(searchLower);
      
      const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
      const matchesPaymentStatus = selectedPaymentStatus === 'all' || order.payment_status === selectedPaymentStatus;
      
      const matchesTab = activeTab === 'orders' 
        ? true
        : ['pending', 'dining'].includes(order.status);
      
      return matchesSearch && matchesStatus && matchesPaymentStatus && matchesTab;
    }) || [];
  }, [orders, searchQuery, selectedStatus, selectedPaymentStatus, activeTab]);

  // Calculate stats - map backend status to UI
  const stats = {
    total: orders?.length || 0,
    pending: orders?.filter((o: any) => o.status === 'pending').length || 0,
    preparing: orders?.filter((o: any) => o.status === 'dining').length || 0,  // dining = preparing
    ready: orders?.filter((o: any) => o.status === 'waiting_payment').length || 0,  // waiting_payment = ready
    delivered: orders?.filter((o: any) => o.status === 'paid').length || 0,  // paid = delivered/completed
    totalRevenue: orders?.filter((o: any) => o.payment_status === 'paid').reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0) || 0,
  };

  const handleOrderPress = async (order: Order) => {
    console.log('🔍 handleOrderPress called with order:', order.id);
    console.log('🔍 Order from list:', JSON.stringify(order, null, 2));
    setLoadingOrderDetail(true);
    setOrderDetailVisible(true); // Show modal immediately with loading
    try {
      // Fetch full order details with items before showing modal
      const fullOrder = await orderService.getDetails(order.id);
      console.log('✅ Fetched full order details:', JSON.stringify(fullOrder, null, 2));
      console.log('✅ Customer name:', fullOrder.customer_name);
      console.log('✅ Customer phone:', fullOrder.customer_phone);
      console.log('✅ Items:', fullOrder.items);
      console.log('✅ Order items:', fullOrder.order_items);
      setSelectedOrder(fullOrder);
    } catch (error) {
      console.error('❌ Error fetching order details:', error);
      setOrderDetailVisible(false); // Hide modal on error
      Alert.alert('Lỗi', 'Không thể tải thông tin đơn hàng');
    } finally {
      setLoadingOrderDetail(false);
    }
  };

  const handleStatusUpdate = async (orderId: string | number, newStatus: string) => {
    try {
      console.log('🔄 handleStatusUpdate called with:', { orderId, newStatus });
      
      // OrderCard now sends backend status directly (dining, waiting_payment, paid)
      // But Kitchen tab buttons still send frontend status (preparing, ready)
      // So we still need to map those
      const backendStatus = newStatus === 'preparing' ? 'dining' : 
                           newStatus === 'ready' ? 'waiting_payment' :
                           newStatus === 'completed' ? 'paid' : 
                           newStatus;  // Already backend status from OrderCard
      
      console.log('🔄 Final backend status:', backendStatus);
      
      await updateStatus(String(orderId), backendStatus as any);
      // Refresh orders after status update
      await refetch();
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const handlePaymentStatusUpdate = useCallback(async (orderId: string | number, newStatus: string) => {
    try {
      await updatePaymentStatus(String(orderId), newStatus as any);
    } catch (error) {
      // Silent fail
    }
  }, [updatePaymentStatus]);

  const handleCreateOrder = async (orderData: {
    tableId?: string;
    customerName: string;
    customerPhone: string;
    items: Array<{
      dishId: string;
      dishName: string;
      price: number;
      quantity: number;
      notes?: string;
    }>;
    notes?: string;
  }) => {
    try {
      // Validate table_id (REQUIRED by backend)
      if (!orderData.tableId) {
        throw new Error('Vui lòng chọn bàn');
      }
      
      // Validate customer info
      if (!orderData.customerName || !orderData.customerPhone) {
        throw new Error('Vui lòng nhập đầy đủ thông tin khách hàng');
      }
      
      // Validate items
      if (!orderData.items || orderData.items.length === 0) {
        throw new Error('Vui lòng chọn ít nhất 1 món');
      }
      
      // Calculate totals
      const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = subtotal * 0.1;
      const total = subtotal + tax;
      
      // Transform data to match API format
      const apiData: any = {
        table_id: orderData.tableId,
        customer_name: orderData.customerName.trim(),
        customer_phone: orderData.customerPhone.trim(),
        notes: orderData.notes?.trim() || undefined,
        items: orderData.items.map(item => ({
          dish_id: item.dishId,
          quantity: item.quantity,
          price: item.price,
          special_instructions: item.notes?.trim() || undefined,
        })),
        subtotal,
        total_amount: total,
        status: 'pending',
        payment_status: 'pending',
      };

      const newOrder = await createOrder(apiData);
      
      setCreateOrderModalVisible(false);
      setSnackbarMessage(`Đã tạo đơn hàng #${newOrder.order_number || newOrder.id.substring(0, 8)}`);
      setSnackbarVisible(true);
      
      await refetch();
    } catch (error: any) {
      const errorMessage = error.message || error.response?.data?.message || 'Không thể tạo đơn hàng';
      setSnackbarMessage(errorMessage);
      setSnackbarVisible(true);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'dining': return '#3b82f6';  // dining = preparing in UI
      case 'waiting_payment': return '#10b981';  // waiting_payment = ready in UI
      case 'paid': return '#059669';  // paid = delivered/completed in UI
      case 'cancelled': return '#ef4444';
      default: return theme.colors.outline;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'dining': return 'Đang chuẩn bị';  // dining = preparing in UI
      case 'waiting_payment': return 'Sẵn sàng';  // waiting_payment = ready in UI
      case 'paid': return 'Đã hoàn thành';  // paid = completed in UI
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ thanh toán';
      case 'paid': return 'Đã thanh toán';
      case 'failed': return 'Thất bại';
      case 'refunded': return 'Đã hoàn tiền';
      default: return status;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash': return 'Tiền mặt';
      case 'card': return 'Thẻ';
      case 'transfer': return 'Chuyển khoản';
      case 'momo': return 'MoMo';
      case 'zalopay': return 'ZaloPay';
      default: return method;
    }
  };

  const statsData = [
    {
      title: "Tổng đơn",
      value: stats.total.toString(),
      change: "+12%",
      icon: "📋",
      color: theme.colors.primary,
    },
    {
      title: "Chờ xử lý",
      value: stats.pending.toString(),
      change: "+5%",
      icon: "⏳",
      color: "#f59e0b",
    },
    {
      title: "Đang chuẩn bị",
      value: stats.preparing.toString(),
      change: "+8%",
      icon: "👨‍🍳",
      color: "#3b82f6",
    },
    {
      title: "Sẵn sàng",
      value: stats.ready.toString(),
      change: "+3%",
      icon: "✅",
      color: "#10b981",
    },
    {
      title: "Đã giao",
      value: stats.delivered.toString(),
      change: "+15%",
      icon: "🚀",
      color: "#059669",
    },
    {
      title: "Doanh thu",
      value: `${Math.round(stats.totalRevenue).toLocaleString('vi-VN')}đ`,
      change: "+20%",
      icon: "💰",
      color: theme.colors.primary,
    },
  ];

  const renderStatCard = ({ item }: { item: any }) => (
    <StatCard
      title={item.title}
      value={item.value}
      icon={item.icon}
      color={item.color}
      change={item.change}
    />
  );

  const renderTabs = () => {
    // Calculate tab counts
    const kitchenOrders = orders?.filter((order: any) => 
      ['pending', 'preparing'].includes(order.status)
    ).length || 0;
    
    return (
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
          onPress={() => {
            setActiveTab('orders');
            // Reset filters when switching to Orders tab
            setSelectedStatus('all');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
            Danh sách đơn hàng ({orders?.length || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'kitchen' && styles.activeTab]}
          onPress={() => {
            setActiveTab('kitchen');
            // Auto-filter to pending/preparing when switching to Kitchen tab
            if (selectedStatus !== 'pending' && selectedStatus !== 'preparing') {
              setSelectedStatus('all');
            }
          }}
        >
          <Text style={[styles.tabText, activeTab === 'kitchen' && styles.activeTabText]}>
            Bếp ({kitchenOrders})
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFilters = () => {
    return (
      <View style={styles.filtersContainer}>
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
          <IconButton 
            icon="magnify" 
            size={20} 
            iconColor={theme.colors.onSurfaceVariant}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Tìm kiếm đơn hàng..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[styles.searchInput, { color: theme.colors.onSurface }]}
            placeholderTextColor={theme.colors.onSurfaceVariant}
          />
        </View>
        
        <View style={styles.dropdownContainer}>
          {/* Order Status Dropdown */}
          <Button
            mode="outlined"
            onPress={() => setMenuVisible(true)}
            style={styles.dropdownButton}
            contentStyle={styles.dropdownContent}
            icon="chevron-down"
          >
            {selectedStatus === 'all' ? 'Tất cả trạng thái' : statusOptions.find(opt => opt.value === selectedStatus)?.label}
          </Button>

          {/* Payment Status Dropdown */}
          <Button
            mode="outlined"
            onPress={() => setPaymentMenuVisible(true)}
            style={styles.dropdownButton}
            contentStyle={styles.dropdownContent}
            icon="chevron-down"
          >
            {selectedPaymentStatus === 'all' ? 'Tất cả thanh toán' : paymentStatusOptions.find(opt => opt.value === selectedPaymentStatus)?.label}
          </Button>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList<any>
        data={filteredOrders}
        renderItem={activeTab === 'orders' ? 
          ({ item }: { item: any }) => (
            <OrderCard
              id={item.order_number || item.id} // Hiển thị order_number thay vì UUID
              customer_name={item.user?.name || item.customer_name || 'Khách vãng lai'}
              customer_phone={item.user?.phone || item.customer_phone || 'Chưa có'}
              status={item.status}
              payment_status={item.payment_status}
              payment_method={item.payment_method}
              total_amount={item.total_amount}
              created_at={item.created_at}
              table_number={item.table?.table_number || item.table_number}
              order_items={item.order_items || item.items || []}
              onPress={() => handleOrderPress(item)}
              onStatusChange={handleStatusUpdate}
              onPaymentStatusChange={handlePaymentStatusUpdate}
            />
          ) :
          ({ item: order }: { item: Order }) => (
            <TouchableOpacity 
              style={[styles.kitchenCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => handleOrderPress(order)}
              activeOpacity={0.7}
            >
              {/* Header with Order ID and Status */}
              <View style={styles.kitchenCardHeader}>
                <View style={styles.headerLeft}>
                  <Text style={[styles.kitchenOrderId, { color: theme.colors.onSurface }]}>
                    Đơn #{order.order_number || order.id.substring(0, 8)}
                  </Text>
                  <Text style={[styles.kitchenCustomer, { color: theme.colors.onSurfaceVariant }]}>
                    {order.table?.table_number || order.table_number ? `Bàn ${order.table?.table_number || order.table_number}` : 'Mang về'}
                  </Text>
                </View>
                <Chip 
                  style={{ backgroundColor: getStatusBadgeColor(order.status) }}
                  textStyle={{ color: 'white', fontSize: 12 }}
                  compact
                >
                  {getStatusText(order.status)}
                </Chip>
              </View>
              
              {/* Order Items - Hiển thị đầy đủ */}
              {(order.order_items || order.items || []).length > 0 ? (
                <View style={styles.kitchenItems}>
                  {(order.order_items || order.items || []).map((item) => (
                    <View key={item.id} style={styles.kitchenItem}>
                      <View style={styles.kitchenItemInfo}>
                        <Text style={[styles.kitchenItemName, { color: theme.colors.onSurface }]}>
                          • {item.quantity}x {item.dish?.name || item.dish_name || 'Món ăn'}
                        </Text>
                        {item.special_instructions && (
                          <Text style={[styles.kitchenItemDetails, { color: theme.colors.onSurfaceVariant }]}>
                            Yêu cầu: {item.special_instructions}
                          </Text>
                        )}
                      </View>
                      <Chip 
                        style={item.status === 'ready' ? styles.readyChip : styles.pendingChip}
                        textStyle={{ color: item.status === 'ready' ? 'white' : '#666', fontSize: 10 }}
                        compact
                      >
                        {item.status === 'pending' ? 'Chờ' : 
                         item.status === 'preparing' ? 'Đang làm' : 
                         item.status === 'ready' ? 'Xong' : 'Đã phục vụ'}
                      </Chip>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={[styles.emptyKitchenItems, { backgroundColor: '#fef3c7' }]}>
                  <Text style={[styles.emptyKitchenItemsText, { color: '#d97706' }]}>
                    ⚠️ Chưa load được món ăn
                  </Text>
                </View>
              )}

              {/* Notes */}
              {order.notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>💬 Ghi chú: {order.notes}</Text>
                </View>
              )}

              {/* Footer with Price and Actions */}
              <View style={styles.kitchenFooter}>
                <View style={styles.footerLeft}>
                  <Text style={[styles.totalPrice, { color: theme.colors.primary }]}>
                    {order.total_amount.toLocaleString('vi-VN')}đ
                  </Text>
                  <Text style={[styles.timeText, { color: theme.colors.onSurfaceVariant }]}>
                    {new Date(order.created_at).toLocaleTimeString('vi-VN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </View>
                <View style={styles.kitchenActions}>
                  {order.status === 'pending' && (
                    <Button
                      mode="contained"
                      onPress={(e) => {
                        e.stopPropagation();
                        handleStatusUpdate(order.id, 'preparing');  // Will be mapped to 'dining'
                      }}
                      style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}
                      labelStyle={{ color: 'white' }}
                      icon="play"
                      compact
                    >
                      Bắt đầu làm
                    </Button>
                  )}
                  {/* dining = preparing in backend */}
                  {order.status === 'dining' && (
                    <Button
                      mode="contained"
                      onPress={(e) => {
                        e.stopPropagation();
                        handleStatusUpdate(order.id, 'ready');  // Will be mapped to 'waiting_payment'
                      }}
                      style={[styles.actionButton, { backgroundColor: '#10b981' }]}
                      labelStyle={{ color: 'white' }}
                      icon="check"
                      compact
                    >
                      Hoàn thành
                    </Button>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )
        }
        keyExtractor={(item) => item.id.toString()}
        
        // 🚀 PERFORMANCE OPTIMIZATION
        windowSize={10}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={100}
        
        ListHeaderComponent={() => (
          <View>
            {/* Stats Cards */}
            <FlatList
              data={statsData}
              style={styles.statsGrid}
              numColumns={2}
              columnWrapperStyle={styles.statsRow}
              keyExtractor={(item) => item.title}
              renderItem={renderStatCard}
              scrollEnabled={false}
            />
            
            {/* Tabs */}
            {renderTabs()}
            
            {/* Filters */}
            {renderFilters()}
            
            {/* Search hint */}
            {searchQuery && (
              <View style={styles.searchHintContainer}>
                <Text style={[styles.searchHint, { color: theme.colors.onSurfaceVariant }]}>
                  Tìm thấy {filteredOrders.length} đơn hàng
                </Text>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              {activeTab === 'kitchen' 
                ? 'Không có đơn hàng nào cần xử lý'
                : (searchQuery || selectedStatus !== 'all' || selectedPaymentStatus !== 'all'
                  ? 'Không tìm thấy đơn hàng nào' 
                  : 'Chưa có đơn hàng nào')
              }
            </Text>
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={[theme.colors.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Order Status Modal */}
      <Modal
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        contentContainerStyle={[styles.menuModal, { backgroundColor: theme.colors.surface }]}
      >
        <Text style={[styles.menuTitle, { color: theme.colors.onSurface }]}>
          Chọn trạng thái đơn hàng
        </Text>
        {statusOptions.map((option) => (
          <Button
            key={option.value}
            mode="text"
            onPress={() => {
              setSelectedStatus(option.value);
              setMenuVisible(false);
            }}
            style={styles.menuItem}
          >
            {option.label}
          </Button>
        ))}
      </Modal>

      {/* Payment Status Modal */}
      <Modal
        visible={paymentMenuVisible}
        onDismiss={() => setPaymentMenuVisible(false)}
        contentContainerStyle={[styles.menuModal, { backgroundColor: theme.colors.surface }]}
      >
        <Text style={[styles.menuTitle, { color: theme.colors.onSurface }]}>
          Chọn trạng thái thanh toán
        </Text>
        {paymentStatusOptions.map((option) => (
          <Button
            key={option.value}
            mode="text"
            onPress={() => {
              setSelectedPaymentStatus(option.value);
              setPaymentMenuVisible(false);
            }}
            style={styles.menuItem}
          >
            {option.label}
          </Button>
        ))}
      </Modal>

      {/* Order Detail Modal */}
      <Portal>
        <Modal
          visible={orderDetailVisible}
          onDismiss={() => setOrderDetailVisible(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          {loadingOrderDetail ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text>Đang tải...</Text>
            </View>
          ) : selectedOrder && (
            <ScrollView style={{ maxHeight: '80%' }}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Chi tiết đơn hàng #{selectedOrder.order_number || selectedOrder.id.substring(0, 8)}
                </Text>
                <IconButton
                  icon="close"
                  onPress={() => setOrderDetailVisible(false)}
                />
              </View>

              <View style={styles.orderDetails}>
                {selectedOrder.user?.name && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Khách hàng:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.user.name}</Text>
                  </View>
                )}
                {(selectedOrder.user?.phone || selectedOrder.customer_phone) && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Số điện thoại:</Text>
                    <Text style={styles.detailValue}>
                      {selectedOrder.user?.phone || selectedOrder.customer_phone}
                    </Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Bàn:</Text>
                  <Text style={styles.detailValue}>
                    {selectedOrder.table?.table_number || selectedOrder.table_number ? 
                      `Bàn ${selectedOrder.table?.table_number || selectedOrder.table_number}` : 
                      'Mang về'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Trạng thái:</Text>
                  <Chip 
                    style={{ backgroundColor: getStatusBadgeColor(selectedOrder.status) }}
                    textStyle={{ color: 'white' }}
                  >
                    {getStatusText(selectedOrder.status)}
                  </Chip>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Thanh toán:</Text>
                  <Text style={styles.detailValue}>
                    {getPaymentStatusText(selectedOrder.payment_status)} - {getPaymentMethodText(selectedOrder.payment_method || 'cash')}
                  </Text>
                </View>
              </View>

              {selectedOrder.notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.detailLabel}>Ghi chú:</Text>
                  <Text style={styles.notesText}>{selectedOrder.notes}</Text>
                </View>
              )}

              <Divider style={{ marginVertical: spacing.md }} />

              <Text style={styles.itemsTitle}>Món ăn đã đặt:</Text>
              {(selectedOrder.order_items || selectedOrder.items || []).map((item) => (
                <View key={item.id} style={styles.orderItem}>
                  <View style={styles.orderItemInfo}>
                    <Text style={styles.orderItemName}>
                      {item.dish?.name || item.dish_name || 'Món ăn'}
                    </Text>
                    <Text style={styles.orderItemDetails}>
                      Số lượng: {item.quantity} × {(item.price || item.unit_price || 0).toLocaleString('vi-VN')}đ
                    </Text>
                    {item.special_instructions && (
                      <Text style={styles.orderItemCustomizations}>
                        Yêu cầu: {item.special_instructions}
                      </Text>
                    )}
                  </View>
                  <View style={styles.orderItemRight}>
                    <Text style={styles.orderItemPrice}>
                      {(item.quantity * (item.price || item.unit_price || 0)).toLocaleString('vi-VN')}đ
                    </Text>
                    <Chip mode="outlined" compact>
                      {item.status === 'pending' ? 'Chờ' : 
                       item.status === 'preparing' || item.status === 'dining' ? 'Đang làm' : 
                       item.status === 'ready' || item.status === 'waiting_payment' ? 'Xong' : 
                       item.status === 'served' || item.status === 'paid' ? 'Đã phục vụ' : 
                       item.status}
                    </Chip>
                  </View>
                </View>
              ))}

              <Divider style={{ marginVertical: spacing.md }} />

              <View style={styles.orderSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Đặt lúc:</Text>
                  <Text style={styles.summaryValue}>
                    {new Date(selectedOrder.created_at).toLocaleString('vi-VN')}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Cập nhật:</Text>
                  <Text style={styles.summaryValue}>
                    {new Date(selectedOrder.updated_at).toLocaleString('vi-VN')}
                  </Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Tổng cộng:</Text>
                  <Text style={styles.totalValue}>
                    {selectedOrder.total_amount.toLocaleString('vi-VN')}đ
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}
        </Modal>
      </Portal>

      {/* Create Order Modal */}
      <CreateOrderModal
        visible={createOrderModalVisible}
        onDismiss={() => setCreateOrderModalVisible(false)}
        onSubmit={handleCreateOrder}
        tables={Array.isArray(tables) ? tables.map(t => ({
          id: t.id,
          name: t.table_number ? `Bàn ${t.table_number}` : t.name || `Bàn ${t.id}`,
          capacity: t.capacity || 4
        })) : []}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          // Navigate to create order screen or show modal
          setCreateOrderModalVisible(true);
        }}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'Đóng',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Stats styles
  statsGrid: {
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
  },
  statsRow: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    gap: spacing.sm,
  },
  // Tabs styles
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0', // slate-200
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -2, // Overlap with container border
  },
  activeTab: {
    borderBottomColor: '#3b82f6', // blue-500 primary
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#3b82f6', // blue-500 primary
    fontWeight: '600',
  },
  // Filters styles
  filtersContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0', // slate-200
    paddingHorizontal: spacing.sm,
  },
  searchIcon: {
    margin: 0,
    padding: 0,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dropdownContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dropdownButton: {
    flex: 1,
  },
  dropdownContent: {
    justifyContent: 'flex-start',
  },
  filterChip: {
    marginRight: spacing.sm,
  },
  // List styles
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  searchHintContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  searchHint: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  // Kitchen styles
  kitchenContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 80,
  },
  kitchenCard: {
    padding: spacing.sm,
    borderRadius: 12,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6', // blue-500 (primary)
  },
  kitchenCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  headerLeft: {
    flex: 1,
  },
  kitchenOrderId: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  kitchenCustomer: {
    fontSize: 14,
    marginTop: 2,
  },
  kitchenItems: {
    // marginBottom removed - will use gap in parent
  },
  emptyKitchenItems: {
    padding: spacing.sm,
    borderRadius: 8,
    // marginBottom removed - will use gap in parent
    alignItems: 'center',
  },
  emptyKitchenItemsText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  kitchenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  kitchenItemInfo: {
    flex: 1,
    marginRight: spacing.xs,
  },
  kitchenItemName: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  kitchenItemDetails: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  kitchenFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.sm,
  },
  footerLeft: {
    flex: 1,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
  },
  readyChip: {
    backgroundColor: '#10b981', // emerald-500 (secondary)
  },
  pendingChip: {
    backgroundColor: '#f1f5f9', // slate-100
  },
  notesContainer: {
    padding: spacing.xs,
    backgroundColor: '#fef3c7', // amber-100
    borderRadius: 8,
    marginTop: spacing.xs,
  },
  notesLabel: {
    fontSize: 11,
    color: '#d97706', // amber-600
  },
  notesText: {
    fontSize: 12,
    color: '#d97706', // amber-600
    marginTop: 2,
  },
  kitchenActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  // Modal styles
  modalContainer: {
    margin: spacing.lg,
    borderRadius: 12,
    padding: spacing.lg,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  orderDetails: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    flex: 2,
    textAlign: 'right',
  },
  notesSection: {
    marginBottom: spacing.md,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: '#f8fafc', // slate-50
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '500',
  },
  orderItemDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  orderItemCustomizations: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
  },
  orderItemRight: {
    alignItems: 'flex-end',
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  orderSummary: {
    marginTop: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
  },
  summaryValue: {
    fontSize: 12,
  },
  totalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0', // slate-200
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6', // blue-500 (primary)
  },
  // Menu Modal styles
  menuModal: {
    margin: spacing.lg,
    borderRadius: 12,
    padding: spacing.lg,
    elevation: 5,
    maxHeight: '60%',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  menuItem: {
    marginVertical: spacing.xs,
  },
  // FAB
  fab: {
    position: 'absolute',
    margin: spacing.lg,
    right: 0,
    bottom: 0,
  },
  // Legacy styles (keeping for compatibility)
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchbar: {
    marginBottom: spacing.md,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.md,
  },
  statusChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statusChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: spacing.sm,
  },
});

export default OrdersScreen;