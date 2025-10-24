import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme, Chip, IconButton } from 'react-native-paper';
import { spacing } from '@/theme';
import { OrderItem } from '@/api/orders';

interface OrderCardProps {
  id: number;
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
}) => {
  const theme = useTheme();

  // Safe check for theme
  if (!theme || !theme.colors) {
    return null;
  }

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
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header with Order ID and Status */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.orderTitle, { color: theme.colors.onSurface }]}>
            Đơn #{id}
          </Text>
          {table_number && (
            <Text style={[styles.tableText, { color: theme.colors.onSurfaceVariant }]}>
              Bàn {table_number}
            </Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <Chip 
            style={{ backgroundColor: getStatusColor(status) }}
            textStyle={{ color: 'white', fontSize: 12 }}
            compact
          >
            {getStatusText(status)}
          </Chip>
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
        {order_items.slice(0, 2).map((item, index) => (
          <Text 
            key={index} 
            style={[styles.itemText, { color: theme.colors.onSurfaceVariant }]}
          >
            • {item.quantity}x {item.dish_name}
          </Text>
        ))}
        {order_items.length > 2 && (
          <Text style={[styles.itemText, { color: theme.colors.onSurfaceVariant }]}>
            • +{order_items.length - 2} món khác
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
            <Chip 
              style={{ backgroundColor: getPaymentStatusColor(payment_status) }}
              textStyle={{ color: 'white', fontSize: 10 }}
              compact
            >
              {getPaymentStatusText(payment_status)}
            </Chip>
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
            onPress={onPress}
            style={styles.chevronButton}
          />
        </View>
      </View>
    </TouchableOpacity>
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