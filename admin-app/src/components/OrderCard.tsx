import React, { useState, memo } from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import { Text, useTheme, Chip, IconButton } from 'react-native-paper';
import { spacing } from '@/theme';
import { OrderItem } from '../api/orderService';
import { StatusDropdown } from './StatusDropdown';

interface OrderCardProps {
  id: string | number; // Cho phép cả string (UUID) và number
  customer_name: string;
  customer_phone: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  total_amount: number;
  created_at: string;
  table_number?: number;
  order_items: OrderItem[];
  onPress?: () => void;
  onStatusChange?: (orderId: string | number, newStatus: string) => void;
  onPaymentStatusChange?: (orderId: string | number, newStatus: string) => void;
}

/**
 * ✅ OPTIMIZED: Wrap với memo để tránh re-render không cần thiết
 * Component chỉ re-render khi props thay đổi
 */
const OrderCardComponent: React.FC<OrderCardProps> = ({
  id,
  customer_name,
  customer_phone,
  status,
  payment_status,
  payment_method = 'cash',
  total_amount,
  created_at,
  table_number,
  order_items,
  onPress,
  onStatusChange,
  onPaymentStatusChange,
}) => {
  const theme = useTheme();

  // Safe check for theme
  if (!theme || !theme.colors) {
    return null;
  }

  // Rút ngắn ID nếu là UUID (chỉ hiển thị 8 ký tự đầu)
  const displayId = typeof id === 'string' && id.length > 10 
    ? id.substring(0, 8).toUpperCase() 
    : String(id);

  // Status options - sử dụng backend status
  const getAvailableStatusOptions = (currentStatus: string) => {
    const allStatuses = [
      { value: 'pending', label: 'Chờ xử lý', icon: '⏳' },
      { value: 'dining', label: 'Đang chuẩn bị', icon: '👨‍🍳' },  // Backend: dining
      { value: 'waiting_payment', label: 'Sẵn sàng', icon: '✅' },  // Backend: waiting_payment
      { value: 'paid', label: 'Đã hoàn thành', icon: '🚀' },  // Backend: paid
      { value: 'cancelled', label: 'Đã hủy', icon: '❌' },
    ];

    // Logic: Chỉ cho phép chuyển sang trạng thái tiếp theo hoặc cancel
    switch (currentStatus) {
      case 'pending':
        return allStatuses.filter(s => ['pending', 'dining', 'cancelled'].includes(s.value));
      case 'dining':  // dining = preparing in UI
        return allStatuses.filter(s => ['dining', 'waiting_payment', 'cancelled'].includes(s.value));
      case 'waiting_payment':  // waiting_payment = ready in UI
        return allStatuses.filter(s => ['waiting_payment', 'paid', 'cancelled'].includes(s.value));
      case 'paid':  // paid = completed/delivered in UI
        return allStatuses.filter(s => s.value === 'paid'); // Không thể thay đổi
      case 'cancelled':
        return allStatuses.filter(s => s.value === 'cancelled'); // Không thể thay đổi
      default:
        return allStatuses;
    }
  };

  // Payment status options - sử dụng backend status
  const paymentStatusOptions = [
    { value: 'pending', label: 'Chờ thanh toán', icon: '⏳' },
    { value: 'paid', label: 'Đã thanh toán', icon: '✅' },
    { value: 'failed', label: 'Thất bại', icon: '❌' },
  ];

  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange && newStatus !== status) {
      onStatusChange(id, newStatus);
    }
  };

  const handlePaymentStatusChange = (newStatus: string) => {
    if (onPaymentStatusChange && newStatus !== payment_status) {
      onPaymentStatusChange(id, newStatus);
    }
  };

  const handleCardPress = () => {
    console.log('🎯 OrderCard pressed, id:', id);
    if (onPress) {
      console.log('✅ Calling onPress callback');
      onPress();
    } else {
      console.log('⚠️ No onPress callback provided');
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'dining': return '#3b82f6';  // Backend: dining = preparing in UI
      case 'waiting_payment': return '#10b981';  // Backend: waiting_payment = ready in UI
      case 'paid': return '#059669';  // Backend: paid = completed in UI
      case 'cancelled': return '#ef4444';
      default: return theme.colors.outline;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'dining': return 'Đang chuẩn bị';  // Backend: dining = preparing in UI
      case 'waiting_payment': return 'Sẵn sàng';  // Backend: waiting_payment = ready in UI
      case 'paid': return 'Đã hoàn thành';  // Backend: paid = completed in UI
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'failed': return '#ef4444';
      default: return theme.colors.outline;
    }
  };

  const getPaymentStatusText = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid': return 'Đã thanh toán';
      case 'pending': return 'Chờ thanh toán';
      case 'failed': return 'Thất bại';
      default: return paymentStatus;
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

  return (
    <Pressable 
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      onPress={handleCardPress}
    >
        {/* Header with Order ID and Status */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.orderTitle, { color: theme.colors.onSurface }]}>
              Đơn #{displayId}
            </Text>
            {table_number && (
              <Text style={[styles.tableText, { color: theme.colors.onSurfaceVariant }]}>
                • Bàn {table_number}
              </Text>
            )}
          </View>
          <View style={styles.headerRight}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {/* Status Dropdown - Custom Modal Implementation */}
            <StatusDropdown
              value={status}
              options={getAvailableStatusOptions(status)}
              onSelect={handleStatusChange}
              disabled={!onStatusChange || status === 'paid' || status === 'cancelled'}
              color={getStatusColor(status)}
              textSize={12}
              showIcon={onStatusChange && status !== 'paid' && status !== 'cancelled'}
            />
          </View>
        </View>

      {/* Customer Information */}
      <View style={styles.customerInfo}>
        {customer_name && customer_name !== 'Khách vãng lai' && (
          <Text style={[styles.customerName, { color: theme.colors.onSurface }]}>
            {customer_name}
          </Text>
        )}
        {customer_phone && customer_phone !== 'Chưa có' && (
          <Text style={[styles.customerPhone, { color: theme.colors.onSurfaceVariant }]}>
            {customer_phone}
          </Text>
        )}
      </View>

      {/* Order Items Preview - Giống Modal */}
      {(order_items || []).length > 0 ? (
        <View style={styles.orderItems}>
          {(order_items || []).map((item, index) => {
            // State to track image load error
            const [imageError, setImageError] = React.useState(false);
            
            // Clean and validate image URL
            let imageUrl = item.dish?.media_urls?.[0];
            
            // Parse if it's a JSON string
            if (typeof item.dish?.media_urls === 'string') {
              try {
                const parsed = JSON.parse(item.dish.media_urls);
                imageUrl = Array.isArray(parsed) ? parsed[0] : null;
              } catch (e) {
                console.warn('Failed to parse media_urls:', item.dish.media_urls);
              }
            }
            
            // Clean URL: remove newlines, carriage returns, and extra spaces
            if (imageUrl && typeof imageUrl === 'string') {
              imageUrl = imageUrl
                .replace(/[\r\n\t]/g, '') // Remove newlines, tabs
                .replace(/\s+/g, '') // Remove all whitespace
                .trim();
            }
            
            // Validate URL is valid string and starts with http
            const isValidUrl = typeof imageUrl === 'string' && imageUrl.length > 0 && imageUrl.startsWith('http');
            
            return (
              <View key={index} style={[styles.orderItem, { backgroundColor: '#f8fafc' }]}>
                {/* Dish Image with Fallback - only show if valid URL */}
                {isValidUrl && !imageError ? (
                  <Image 
                    source={{ uri: imageUrl }}
                    style={styles.dishImage}
                    resizeMode="cover"
                    onError={(error) => {
                      console.warn('⚠️ Image 404 or failed:', imageUrl);
                      setImageError(true);
                    }}
                  />
                ) : (
                  <View style={[styles.dishImage, styles.dishImagePlaceholder]}>
                    <Text style={styles.dishImagePlaceholderText}>🍽️</Text>
                  </View>
                )}
                <View style={styles.orderItemInfo}>
                  <Text style={[styles.orderItemName, { color: theme.colors.onSurface }]}>
                    {item.dish?.name || item.dish_name || 'Món ăn'}
                </Text>
                <Text style={[styles.orderItemDetails, { color: theme.colors.onSurfaceVariant }]}>
                  Số lượng: {item.quantity} × {((item.price || item.unit_price || 0)).toLocaleString('vi-VN')}đ
                </Text>
                {item.special_instructions && (
                  <Text style={[styles.orderItemCustomizations, { color: theme.colors.onSurfaceVariant }]}>
                    Yêu cầu: {item.special_instructions}
                  </Text>
                )}
              </View>
              <View style={styles.orderItemRight}>
                <Text style={[styles.orderItemPrice, { color: theme.colors.onSurface }]}>
                  {((item.quantity || 0) * (item.price || item.unit_price || 0)).toLocaleString('vi-VN')}đ
                </Text>
                <Chip 
                  mode="outlined" 
                  compact 
                  style={styles.itemStatusChip}
                  textStyle={styles.itemStatusChipText}
                >
                  {item.status === 'pending' ? 'Chờ' : 
                   item.status === 'preparing' ? 'Đang làm' : 
                   item.status === 'ready' ? 'Xong' : 
                   item.status === 'served' ? 'Đã phục vụ' : 
                   item.status}
                </Chip>
              </View>
            </View>
            );
          })}
        </View>
      ) : (
        <View style={[styles.emptyItems, { backgroundColor: '#f0f9ff' }]}>
          <Text style={[styles.emptyItemsText, { color: '#0369a1' }]}>
            📋 Click để xem chi tiết món ăn
          </Text>
        </View>
      )}

        {/* Footer with Price and Payment Info */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={[styles.totalPrice, { color: theme.colors.primary }]}>
              {total_amount.toLocaleString('vi-VN')}đ
            </Text>
            <View style={styles.paymentInfo}
              onStartShouldSetResponder={() => true}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              {/* Payment Status Dropdown - Custom Modal Implementation */}
              <StatusDropdown
                value={payment_status}
                options={paymentStatusOptions}
                onSelect={handlePaymentStatusChange}
                disabled={!onPaymentStatusChange}
                color={getPaymentStatusColor(payment_status)}
                textSize={10}
                showIcon={!!onPaymentStatusChange}
              />
              <Text style={[styles.paymentMethod, { color: theme.colors.onSurfaceVariant }]}>
                {getPaymentMethodText(payment_method)}
              </Text>
            </View>
          </View>
          <View style={styles.footerRight}>
            <Text style={[styles.dateText, { color: theme.colors.onSurfaceVariant }]}>
              {new Date(created_at).toLocaleDateString('vi-VN')}
            </Text>
            <Text style={[styles.timeText, { color: theme.colors.onSurfaceVariant }]}>
              {new Date(created_at).toLocaleTimeString('vi-VN', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
            <IconButton
              icon="chevron-right"
              size={20}
              onPress={() => {
                if (onPress) onPress();
              }}
              style={styles.chevronButton}
            />
          </View>
        </View>
      </Pressable>
  );
};
const styles = StyleSheet.create({
  container: {
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tableText: {
    fontSize: 14,
    marginTop: 2,
  },
  headerRight: {},
  customerInfo: {
    marginBottom: spacing.sm,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  customerPhone: {
    fontSize: 14,
    marginTop: 2,
  },
  orderItems: {
    marginBottom: spacing.sm,
  },
  emptyItems: {
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  emptyItemsText: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  dishImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  dishImagePlaceholder: {
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dishImagePlaceholderText: {
    fontSize: 24,
  },
  orderItemInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '500',
  },
  orderItemDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  orderItemCustomizations: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  orderItemRight: {
    alignItems: 'flex-end',
    minWidth: 90,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemStatusChip: {
    height: 26,
    minWidth: 75,
  },
  itemStatusChipText: {
    fontSize: 11,
    lineHeight: 14,
    marginVertical: 0,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  itemText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
  footer: {
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
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  paymentMethod: {
    fontSize: 12,
  },
  footerRight: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 12,
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  chevronButton: {
    margin: 0,
    padding: 0,
  },
});

/**
 * ✅ OPTIMIZED: Export với memo và custom comparison
 * Chỉ re-render khi các props quan trọng thay đổi
 */
export const OrderCard = memo(OrderCardComponent, (prevProps, nextProps) => {
  // Custom comparison: chỉ re-render khi những field này thay đổi
  return (
    prevProps.id === nextProps.id &&
    prevProps.status === nextProps.status &&
    prevProps.payment_status === nextProps.payment_status &&
    prevProps.total_amount === nextProps.total_amount &&
    prevProps.order_items.length === nextProps.order_items.length
  );
});