import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  RefreshControl,
  TouchableOpacity,
  Text as RNText,
  TextInput,
  ScrollView,
  Dimensions
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
  Divider
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OrderCard, StatCard } from '@/components';
import { useOrders } from '../hooks/useOrders';
import { Order } from '../api/orders';
import { spacing } from '@/theme';

const OrdersScreen = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [menuVisible, setMenuVisible] = useState(false);
  const [paymentMenuVisible, setPaymentMenuVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailVisible, setOrderDetailVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'kitchen'>('orders');

  const { orders, loading: isLoading, refresh: refetch, updateStatus, updatePaymentStatus } = useOrders();

  const statusOptions = [
    { value: 'all', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ xử lý' },
    { value: 'preparing', label: 'Đang chuẩn bị' },
    { value: 'ready', label: 'Sẵn sàng' },
    { value: 'delivered', label: 'Đã giao' },
    { value: 'cancelled', label: 'Đã hủy' },
  ];

  const paymentStatusOptions = [
    { value: 'all', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ thanh toán' },
    { value: 'paid', label: 'Đã thanh toán' },
    { value: 'failed', label: 'Thất bại' },
    { value: 'refunded', label: 'Đã hoàn tiền' },
  ];

  const filteredOrders = orders?.filter((order: any) => {
    const matchesSearch = (order.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (order.id || '').toString().includes(searchQuery) ||
                         (order.customer_phone || '').includes(searchQuery);
    
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesPaymentStatus = selectedPaymentStatus === 'all' || order.payment_status === selectedPaymentStatus;
    
    return matchesSearch && matchesStatus && matchesPaymentStatus;
  }) || [];

  // Calculate stats
  const stats = {
    total: orders?.length || 0,
    pending: orders?.filter((o: any) => o.status === 'pending').length || 0,
    preparing: orders?.filter((o: any) => o.status === 'preparing').length || 0,
    ready: orders?.filter((o: any) => o.status === 'ready').length || 0,
    delivered: orders?.filter((o: any) => o.status === 'delivered').length || 0,
    totalRevenue: orders?.filter((o: any) => o.payment_status === 'paid').reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0) || 0,
  };

  const handleOrderPress = (order: Order) => {
    setSelectedOrder(order);
    setOrderDetailVisible(true);
  };

  const handleStatusUpdate = async (orderId: string | number, newStatus: string) => {
    try {
      await updateStatus(Number(orderId), newStatus as any);
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const handlePaymentStatusUpdate = async (orderId: string | number, newStatus: string) => {
    try {
      await updatePaymentStatus(orderId.toString(), newStatus as any);
    } catch (error) {
      console.error('Failed to update payment status:', error);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'preparing': return '#3b82f6';
      case 'ready': return '#10b981';
      case 'delivered': return '#059669';
      case 'cancelled': return '#ef4444';
      default: return theme.colors.outline;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'preparing': return 'Đang chuẩn bị';
      case 'ready': return 'Sẵn sàng';
      case 'delivered': return 'Đã giao';
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

  const renderStatsCards = () => {
    const screenWidth = Dimensions.get('window').width;
    const cardWidth = (screenWidth - spacing.lg * 3) / 2;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={[styles.statsCard, { width: cardWidth }]}>
            <StatCard
              title="Tổng đơn"
              value={stats.total.toString()}
              change="+12%"
              icon="📋"
              color={theme.colors.primary}
            />
          </View>
          <View style={[styles.statsCard, { width: cardWidth }]}>
            <StatCard
              title="Chờ xử lý"
              value={stats.pending.toString()}
              change="+5%"
              icon="⏳"
              color="#f59e0b"
            />
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statsCard, { width: cardWidth }]}>
            <StatCard
              title="Đang chuẩn bị"
              value={stats.preparing.toString()}
              change="+8%"
              icon="👨‍🍳"
              color="#3b82f6"
            />
          </View>
          <View style={[styles.statsCard, { width: cardWidth }]}>
            <StatCard
              title="Sẵn sàng"
              value={stats.ready.toString()}
              change="+3%"
              icon="✅"
              color="#10b981"
            />
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statsCard, { width: cardWidth }]}>
            <StatCard
              title="Đã giao"
              value={stats.delivered.toString()}
              change="+15%"
              icon="🚀"
              color="#059669"
            />
          </View>
          <View style={[styles.statsCard, { width: cardWidth }]}>
            <StatCard
              title="Doanh thu"
              value={`${stats.totalRevenue.toLocaleString()}đ`}
              change="+20%"
              icon="💰"
              color={theme.colors.primary}
            />
          </View>
        </View>
      </View>
    );
  };

  const renderTabs = () => {
    return (
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
            Danh sách đơn hàng
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'kitchen' && styles.activeTab]}
          onPress={() => setActiveTab('kitchen')}
        >
          <Text style={[styles.tabText, activeTab === 'kitchen' && styles.activeTabText]}>
            Bếp
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
        data={activeTab === 'orders' ? filteredOrders : filteredOrders?.filter((order: any) => 
          ['pending', 'preparing'].includes(order.status)
        )}
        renderItem={activeTab === 'orders' ? 
          ({ item }: { item: any }) => (
            <OrderCard
              id={item.id}
              customer_name={item.customer_name}
              customer_phone={item.customer_phone}
              status={item.status}
              payment_status={item.payment_status}
              payment_method={item.payment_method}
              total_amount={item.total_amount}
              created_at={item.created_at}
              table_number={item.table_number}
              order_items={item.order_items}
              onPress={() => handleOrderPress(item)}
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
                    Đơn #{order.id}
                  </Text>
                  <Text style={[styles.kitchenCustomer, { color: theme.colors.onSurfaceVariant }]}>
                    {order.customer_name} - {order.table_number ? `Bàn ${order.table_number}` : 'Mang về'}
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
              
              {/* Order Items Preview */}
              <View style={styles.kitchenItems}>
                {order.order_items.slice(0, 3).map((item) => (
                  <View key={item.id} style={styles.kitchenItem}>
                    <View style={styles.kitchenItemInfo}>
                      <Text style={[styles.kitchenItemName, { color: theme.colors.onSurface }]}>
                        • {item.quantity}x {item.dish_name}
                      </Text>
                      {item.customizations && (
                        <Text style={[styles.kitchenItemDetails, { color: theme.colors.onSurfaceVariant }]}>
                          Yêu cầu: {item.customizations}
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
                {order.order_items.length > 3 && (
                  <Text style={[styles.kitchenItemName, { color: theme.colors.onSurfaceVariant, fontStyle: 'italic' }]}>
                    • +{order.order_items.length - 3} món khác
                  </Text>
                )}
              </View>

              {/* Notes */}
              {order.notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>💬 {order.notes}</Text>
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
                  <Button
                    mode="outlined"
                    onPress={() => handleStatusUpdate(order.id, 'preparing')}
                    disabled={order.status === 'preparing'}
                    style={styles.actionButton}
                    compact
                  >
                    {order.status === 'pending' ? 'Bắt đầu' : 'Đang làm'}
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => handleStatusUpdate(order.id, 'ready')}
                    disabled={order.status !== 'preparing'}
                    style={styles.actionButton}
                    compact
                  >
                    Hoàn thành
                  </Button>
                </View>
              </View>
            </TouchableOpacity>
          )
        }
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={() => (
          <View>
            {/* Stats Cards */}
            {renderStatsCards()}
            
            {/* Tabs */}
            {renderTabs()}
            
            {/* Filters */}
            {renderFilters()}
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
          {selectedOrder && (
            <ScrollView style={{ maxHeight: '80%' }}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chi tiết đơn hàng #{selectedOrder.id}</Text>
                <IconButton
                  icon="close"
                  onPress={() => setOrderDetailVisible(false)}
                />
              </View>

              <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Khách hàng:</Text>
                  <Text style={styles.detailValue}>{selectedOrder.customer_name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Số điện thoại:</Text>
                  <Text style={styles.detailValue}>{selectedOrder.customer_phone}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Bàn:</Text>
                  <Text style={styles.detailValue}>
                    {selectedOrder.table_number ? `Bàn ${selectedOrder.table_number}` : 'Mang về'}
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
                    {getPaymentStatusText(selectedOrder.payment_status)} - {getPaymentMethodText(selectedOrder.payment_method)}
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
              {selectedOrder.order_items.map((item) => (
                <View key={item.id} style={styles.orderItem}>
                  <View style={styles.orderItemInfo}>
                    <Text style={styles.orderItemName}>{item.dish_name}</Text>
                    <Text style={styles.orderItemDetails}>
                      Số lượng: {item.quantity} × {item.price.toLocaleString('vi-VN')}đ
                    </Text>
                    {item.customizations && (
                      <Text style={styles.orderItemCustomizations}>
                        Yêu cầu: {item.customizations}
                      </Text>
                    )}
                  </View>
                  <View style={styles.orderItemRight}>
                    <Text style={styles.orderItemPrice}>
                      {(item.quantity * item.price).toLocaleString('vi-VN')}đ
                    </Text>
                    <Chip mode="outlined" compact>
                      {item.status === 'pending' ? 'Chờ' : 
                       item.status === 'preparing' ? 'Đang làm' : 
                       item.status === 'ready' ? 'Xong' : 'Đã phục vụ'}
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

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          console.log('Create new order');
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Stats styles
  statsContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  statsCard: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  // Tabs styles
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: '#f1f5f9', // slate-100
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#333',
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
  // Kitchen styles
  kitchenContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 80,
  },
  kitchenCard: {
    padding: spacing.md,
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
    marginBottom: spacing.sm,
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
    marginBottom: spacing.sm,
  },
  kitchenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  kitchenItemInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  kitchenItemName: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
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
  },
  footerLeft: {
    flex: 1,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
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
    padding: spacing.sm,
    backgroundColor: '#fef3c7', // amber-100
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  notesLabel: {
    fontSize: 12,
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