import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  Button,
  Divider,
  ActivityIndicator,
  useTheme,
  IconButton,
  List,
  Menu,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';

import { useOrders } from '../hooks';
import { Order, OrderItem } from '../api/orderService';
import { spacing } from '@/theme';
import { logger } from '../utils/logger';

type RootStackParamList = {
  OrderDetail: { orderId: string };
  Orders: undefined;
};

type OrderDetailRouteProp = RouteProp<RootStackParamList, 'OrderDetail'>;
type OrderDetailNavigationProp = NavigationProp<RootStackParamList>;

/**
 * OrderDetailScreen - Màn hình chi tiết đơn hàng
 * Tham khảo: admin-web/src/components/modules/order-detail-page.tsx
 */
const OrderDetailScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<OrderDetailNavigationProp>();
  const route = useRoute<OrderDetailRouteProp>();
  const { orderId } = route.params;

  const { getOrderById, updateStatus, updatePaymentStatus, updateItemStatus } = useOrders();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [paymentMenuVisible, setPaymentMenuVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [itemMenuVisible, setItemMenuVisible] = useState(false);

  // Fetch order detail
  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      logger.info('Fetching order detail', { orderId });
      const orderData = await getOrderById(orderId);
      if (orderData) {
        setOrder(orderData);
      } else {
        Alert.alert('Lỗi', 'Không tìm thấy đơn hàng');
        navigation.goBack();
      }
    } catch (error) {
      logger.error('Failed to fetch order detail', error);
      Alert.alert('Lỗi', 'Không thể tải chi tiết đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrderDetail();
    setRefreshing(false);
  };

  // Handle status update
  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setStatusMenuVisible(false);
      await updateStatus(orderId, newStatus as any);
      Alert.alert('Thành công', 'Đã cập nhật trạng thái đơn hàng');
      await fetchOrderDetail();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái đơn hàng');
    }
  };

  // Handle payment status update
  const handlePaymentStatusUpdate = async (newStatus: string) => {
    try {
      setPaymentMenuVisible(false);
      await updatePaymentStatus(orderId, newStatus as any);
      Alert.alert('Thành công', 'Đã cập nhật trạng thái thanh toán');
      await fetchOrderDetail();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái thanh toán');
    }
  };

  // Handle item status update
  const handleItemStatusUpdate = async (itemId: string, newStatus: string) => {
    try {
      setItemMenuVisible(false);
      await updateItemStatus(orderId, itemId, newStatus);
      Alert.alert('Thành công', 'Đã cập nhật trạng thái món ăn');
      await fetchOrderDetail();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái món ăn');
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'preparing': return '#3b82f6';
      case 'ready': return '#10b981';
      case 'delivered': return '#059669';
      case 'served': return '#059669';
      case 'cancelled': return '#ef4444';
      default: return theme.colors.outline;
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'preparing': return 'Đang chuẩn bị';
      case 'ready': return 'Sẵn sàng';
      case 'delivered': return 'Đã giao';
      case 'served': return 'Đã phục vụ';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  // Get payment status text
  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ thanh toán';
      case 'paid': return 'Đã thanh toán';
      case 'failed': return 'Thất bại';
      case 'refunded': return 'Đã hoàn tiền';
      default: return status;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading && !order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không tìm thấy đơn hàng</Text>
          <Button mode="contained" onPress={() => navigation.goBack()}>
            Quay lại
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const items = order.items || order.order_items || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.headerRow}>
              <Text variant="headlineSmall" style={styles.orderId}>
                Đơn hàng #{order.id}
              </Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => navigation.goBack()}
              />
            </View>

            <View style={styles.statusRow}>
              <View style={styles.statusChips}>
                <Menu
                  visible={statusMenuVisible}
                  onDismiss={() => setStatusMenuVisible(false)}
                  anchor={
                    <Chip
                      style={[styles.statusChip, { backgroundColor: getStatusColor(order.status) }]}
                      textStyle={styles.statusChipText}
                      onPress={() => setStatusMenuVisible(true)}
                    >
                      {getStatusText(order.status)}
                    </Chip>
                  }
                >
                  <Menu.Item onPress={() => handleStatusUpdate('pending')} title="Chờ xử lý" />
                  <Menu.Item onPress={() => handleStatusUpdate('preparing')} title="Đang chuẩn bị" />
                  <Menu.Item onPress={() => handleStatusUpdate('ready')} title="Sẵn sàng" />
                  <Menu.Item onPress={() => handleStatusUpdate('delivered')} title="Đã giao" />
                  <Menu.Item onPress={() => handleStatusUpdate('cancelled')} title="Đã hủy" />
                </Menu>

                <Menu
                  visible={paymentMenuVisible}
                  onDismiss={() => setPaymentMenuVisible(false)}
                  anchor={
                    <Chip
                      style={[
                        styles.statusChip,
                        {
                          backgroundColor:
                            order.payment_status === 'paid'
                              ? '#10b981'
                              : order.payment_status === 'failed'
                              ? '#ef4444'
                              : '#f59e0b',
                        },
                      ]}
                      textStyle={styles.statusChipText}
                      onPress={() => setPaymentMenuVisible(true)}
                    >
                      {getPaymentStatusText(order.payment_status)}
                    </Chip>
                  }
                >
                  <Menu.Item onPress={() => handlePaymentStatusUpdate('pending')} title="Chờ thanh toán" />
                  <Menu.Item onPress={() => handlePaymentStatusUpdate('paid')} title="Đã thanh toán" />
                  <Menu.Item onPress={() => handlePaymentStatusUpdate('failed')} title="Thất bại" />
                  <Menu.Item onPress={() => handlePaymentStatusUpdate('refunded')} title="Đã hoàn tiền" />
                </Menu>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Customer Info */}
        <Card style={styles.card}>
          <Card.Title title="Thông tin khách hàng" />
          <Card.Content>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tên:</Text>
              <Text style={styles.infoValue}>{order.customer_name || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Số điện thoại:</Text>
              <Text style={styles.infoValue}>{order.customer_phone || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bàn số:</Text>
              <Text style={styles.infoValue}>{order.table_number || 'N/A'}</Text>
            </View>
            {order.notes && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ghi chú:</Text>
                <Text style={styles.infoValue}>{order.notes}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Order Items */}
        <Card style={styles.card}>
          <Card.Title title="Danh sách món" />
          <Card.Content>
            {items.map((item, index) => (
              <React.Fragment key={item.id}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedItem(item);
                    setItemMenuVisible(true);
                  }}
                >
                  <View style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.dish_name}</Text>
                      <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                      <Chip
                        style={[
                          styles.itemStatusChip,
                          { backgroundColor: getStatusColor(item.status) },
                        ]}
                        textStyle={styles.itemStatusChipText}
                      >
                        {getStatusText(item.status)}
                      </Chip>
                    </View>
                    <Text style={styles.itemPrice}>
                      {formatCurrency((item.price || item.unit_price || 0) * item.quantity)}
                    </Text>
                  </View>
                  {item.special_instructions && (
                    <Text style={styles.itemNotes}>
                      Ghi chú: {item.special_instructions}
                    </Text>
                  )}
                </TouchableOpacity>
                {index < items.length - 1 && <Divider style={styles.itemDivider} />}
              </React.Fragment>
            ))}
          </Card.Content>
        </Card>

        {/* Item Status Menu */}
        <Menu
          visible={itemMenuVisible}
          onDismiss={() => setItemMenuVisible(false)}
          anchor={<View />}
        >
          <Menu.Item
            onPress={() =>
              selectedItem && handleItemStatusUpdate(selectedItem.id, 'pending')
            }
            title="Chờ xử lý"
          />
          <Menu.Item
            onPress={() =>
              selectedItem && handleItemStatusUpdate(selectedItem.id, 'preparing')
            }
            title="Đang chuẩn bị"
          />
          <Menu.Item
            onPress={() =>
              selectedItem && handleItemStatusUpdate(selectedItem.id, 'ready')
            }
            title="Sẵn sàng"
          />
          <Menu.Item
            onPress={() =>
              selectedItem && handleItemStatusUpdate(selectedItem.id, 'served')
            }
            title="Đã phục vụ"
          />
        </Menu>

        {/* Payment Info */}
        <Card style={styles.card}>
          <Card.Title title="Thông tin thanh toán" />
          <Card.Content>
            {order.subtotal && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Tạm tính:</Text>
                <Text style={styles.paymentValue}>{formatCurrency(order.subtotal)}</Text>
              </View>
            )}
            {order.discount_amount && order.discount_amount > 0 && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Giảm giá:</Text>
                <Text style={[styles.paymentValue, styles.discountText]}>
                  -{formatCurrency(order.discount_amount)}
                </Text>
              </View>
            )}
            {order.voucher_code && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Mã voucher:</Text>
                <Text style={styles.paymentValue}>{order.voucher_code}</Text>
              </View>
            )}
            <Divider style={styles.paymentDivider} />
            <View style={styles.paymentRow}>
              <Text style={styles.totalLabel}>Tổng cộng:</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.total_amount)}</Text>
            </View>
            {order.payment_method && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Phương thức:</Text>
                <Text style={styles.paymentValue}>
                  {order.payment_method.toUpperCase()}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Time Info */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tạo lúc:</Text>
              <Text style={styles.infoValue}>{formatDate(order.created_at)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cập nhật:</Text>
              <Text style={styles.infoValue}>{formatDate(order.updated_at)}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            onPress={onRefresh}
            style={styles.actionButton}
            icon="refresh"
          >
            Làm mới
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.actionButton}
          >
            Quay lại
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    fontSize: 16,
    marginBottom: spacing.md,
  },
  card: {
    margin: spacing.md,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontWeight: 'bold',
  },
  statusRow: {
    marginTop: spacing.md,
  },
  statusChips: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusChip: {
    marginRight: spacing.sm,
  },
  statusChipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  itemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemStatusChip: {
    height: 24,
  },
  itemStatusChipText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  itemDivider: {
    marginVertical: spacing.sm,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  discountText: {
    color: '#10b981',
  },
  paymentDivider: {
    marginVertical: spacing.md,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  actionsContainer: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    marginVertical: spacing.xs,
  },
});

export default OrderDetailScreen;
