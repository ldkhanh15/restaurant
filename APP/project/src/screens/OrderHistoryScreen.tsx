import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { mockApi } from '../services/mockApi';
import { Order } from '../data/mockData';
import LuxuryCard from '../components/LuxuryCard';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ShoppingBag, Clock, AlertCircle } from 'lucide-react-native';

const OrderHistoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { currentUser } = useSelector((state: RootState) => state.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'active' | 'completed'
  >('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    if (!currentUser) return;
    try {
      const userOrders = await mockApi.getUserOrders(currentUser.id);
      setOrders(userOrders);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return `₫${price.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFC107';
      case 'preparing':
        return '#FF9800';
      case 'ready':
        return '#4CAF50';
      case 'delivered':
        return '#2196F3';
      default:
        return '#666666';
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'active') {
      return ['pending', 'preparing', 'ready'].includes(order.status);
    }
    return order.status === 'delivered';
  });

  const renderOrder = ({ item, index }: { item: Order; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 100)}>
      <LuxuryCard style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>Order #{item.id.slice(-6)}</Text>
            <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.orderItems}>
          {item.items.map((orderItem, idx) => (
            <View key={idx} style={styles.orderItem}>
              <Text style={styles.itemName}>{orderItem.dish_name}</Text>
              <Text style={styles.itemQuantity}>x{orderItem.quantity}</Text>
              <Text style={styles.itemPrice}>
                {formatPrice(orderItem.price)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.orderFooter}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalAmount}>
            {formatPrice(item.total_amount)}
          </Text>
        </View>
      </LuxuryCard>
    </Animated.View>
  );

  return (
    <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order History</Text>
      </View>

      <View style={styles.filterContainer}>
        {(['all', 'active', 'completed'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              selectedFilter === filter && styles.selectedFilter,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter && styles.selectedFilterText,
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredOrders.length > 0 ? (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <ShoppingBag color="#D4AF37" size={64} />
          <Text style={styles.emptyTitle}>No Orders Found</Text>
          <Text style={styles.emptySubtitle}>
            Your order history will appear here
          </Text>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#D4AF37',
    fontFamily: 'PlayfairDisplay-Bold',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  selectedFilter: {
    backgroundColor: '#D4AF37',
  },
  filterText: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '600',
    fontFamily: 'Lato-SemiBold',
  },
  selectedFilterText: {
    color: '#000000',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  orderCard: {
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Lato-SemiBold',
  },
  orderDate: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 4,
    fontFamily: 'Lato-Regular',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Lato-SemiBold',
  },
  orderItems: {
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    color: '#CCCCCC',
    fontFamily: 'Lato-Regular',
  },
  itemQuantity: {
    fontSize: 16,
    color: '#D4AF37',
    marginHorizontal: 16,
    fontFamily: 'Lato-Regular',
  },
  itemPrice: {
    fontSize: 16,
    color: 'white',
    fontFamily: 'Lato-SemiBold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    marginVertical: 16,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    color: '#CCCCCC',
    fontFamily: 'Lato-Regular',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#D4AF37',
    fontFamily: 'Lato-SemiBold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4AF37',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    fontFamily: 'Lato-Regular',
  },
});

export default OrderHistoryScreen;
