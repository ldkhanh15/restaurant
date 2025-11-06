import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
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

export const OrderCard: React.FC<OrderCardProps> = ({
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

  // Status options - chỉ hiển thị các trạng thái hợp lệ để chuyển
  const getAvailableStatusOptions = (currentStatus: string) => {
    const allStatuses = [
      { value: 'pending', label: 'Chờ xử lý', icon: '⏳' },
      { value: 'preparing', label: 'Đang chuẩn bị', icon: '👨‍🍳' },
      { value: 'ready', label: 'Sẵn sàng', icon: '✅' },
      { value: 'delivered', label: 'Đã giao', icon: '🚀' },
      { value: 'cancelled', label: 'Đã hủy', icon: '❌' },
    ];

    // Logic: Chỉ cho phép chuyển sang trạng thái tiếp theo hoặc cancel
    switch (currentStatus) {
      case 'pending':
        return allStatuses.filter(s => ['pending', 'preparing', 'cancelled'].includes(s.value));
      case 'preparing':
        return allStatuses.filter(s => ['preparing', 'ready', 'cancelled'].includes(s.value));
      case 'ready':
        return allStatuses.filter(s => ['ready', 'delivered', 'cancelled'].includes(s.value));
      case 'delivered':
        return allStatuses.filter(s => s.value === 'delivered'); // Không thể thay đổi
      case 'cancelled':
        return allStatuses.filter(s => s.value === 'cancelled'); // Không thể thay đổi
      default:
        return allStatuses;
    }
  };

  // Payment status options
  const paymentStatusOptions = [
    { value: 'pending', label: 'Chờ thanh toán', icon: '⏳' },
    { value: 'paid', label: 'Đã thanh toán', icon: '✅' },
    { value: 'failed', label: 'Thất bại', icon: '❌' },
    { value: 'refunded', label: 'Đã hoàn tiền', icon: '↩️' },
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
    if (onPress) {
      onPress();
    }
  };


  const getStatusColor = (status: string) => {
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

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'failed': return '#ef4444';
      case 'refunded': return '#6b7280';
      default: return theme.colors.outline;
    }
  };

  const getPaymentStatusText = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid': return 'Đã thanh toán';
      case 'pending': return 'Chờ thanh toán';
      case 'failed': return 'Thất bại';
      case 'refunded': return 'Đã hoàn tiền';
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
          <View style={styles.headerRight}>
            {/* Status Dropdown - Custom Modal Implementation */}
            <StatusDropdown
              value={status}
              options={getAvailableStatusOptions(status)}
              onSelect={handleStatusChange}
              disabled={!onStatusChange || status === 'delivered' || status === 'cancelled'}
              color={getStatusColor(status)}
              textSize={12}
              showIcon={onStatusChange && status !== 'delivered' && status !== 'cancelled'}
            />
          </View>
        </View>

      {/* Customer Information */}
      <View style={styles.customerInfo}>
        <Text style={[styles.customerName, { color: theme.colors.onSurface }]}>
          {customer_name}
        </Text>
        <Text style={[styles.customerPhone, { color: theme.colors.onSurfaceVariant }]}>
          {customer_phone}
        </Text>
      </View>

      {/* Order Items Preview */}
      <View style={styles.orderItems}>
        {(order_items || []).slice(0, 2).map((item, index) => (
          <Text 
            key={index} 
            style={[styles.itemText, { color: theme.colors.onSurfaceVariant }]}
          >
            • {item.quantity}x {item.dish_name}
          </Text>
        ))}
        {(order_items || []).length > 2 && (
          <Text style={[styles.itemText, { color: theme.colors.onSurfaceVariant }]}>
            • +{(order_items || []).length - 2} món khác
          </Text>
        )}
      </View>

        {/* Footer with Price and Payment Info */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={[styles.totalPrice, { color: theme.colors.primary }]}>
              {total_amount.toLocaleString('vi-VN')}đ
            </Text>
            <View style={styles.paymentInfo}>
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
  itemText: {
    fontSize: 14,
    lineHeight: 20,
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