import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import {
  removeItem,
  updateQuantity,
  applyVoucher,
  removeVoucher,
  clearCart,
} from '../store/slices/cartSlice';
import { mockApi } from '../services/mockApi';
import { mockDishes, Voucher } from '../data/mockData';
import LuxuryCard from '../components/LuxuryCard';
import LuxuryButton from '../components/LuxuryButton';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Minus, Plus, Trash2, Tag, CreditCard, Smartphone, DollarSign } from 'lucide-react-native';

const CartScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { items, appliedVoucher, total } = useSelector((state: RootState) => state.cart);
  const { currentUser } = useSelector((state: RootState) => state.user);
  const [voucherCode, setVoucherCode] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'zalopay' | 'momo' | 'cash' | 'card'>('card');
  const [loading, setLoading] = useState(false);

  const getDishById = (id: string) => {
    return mockDishes.find(dish => dish.id === id);
  };

  const formatPrice = (price: number) => {
    return `₫${price.toLocaleString()}`;
  };

  const handleQuantityChange = (dishId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      dispatch(removeItem(dishId));
    } else {
      dispatch(updateQuantity({ dish_id: dishId, quantity: newQuantity }));
    }
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      Alert.alert('Error', 'Please enter a voucher code');
      return;
    }

    try {
      const voucher = await mockApi.validateVoucher(voucherCode);
      if (voucher) {
        if (voucher.min_amount && total < voucher.min_amount) {
          Alert.alert(
            'Invalid Voucher',
            `Minimum order amount is ${formatPrice(voucher.min_amount)}`
          );
          return;
        }
        dispatch(applyVoucher(voucher));
        Alert.alert('Success', 'Voucher applied successfully!');
        setVoucherCode('');
      } else {
        Alert.alert('Error', 'Invalid or expired voucher code');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to validate voucher');
    }
  };

  const handleRemoveVoucher = () => {
    dispatch(removeVoucher());
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateDiscount = () => {
    if (!appliedVoucher) return 0;
    const subtotal = calculateSubtotal();
    if (appliedVoucher.discount_type === 'percentage') {
      return subtotal * (appliedVoucher.value / 100);
    } else {
      return appliedVoucher.value;
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    if (!currentUser) {
      Alert.alert('Error', 'Please log in to place an order');
      return;
    }

    setLoading(true);
    try {
      const order = await mockApi.createOrder({
        user_id: currentUser.id,
        status: 'pending',
        total_amount: total,
        payment_method: selectedPaymentMethod,
        items: items,
      });

      dispatch(clearCart());
      setShowPaymentModal(false);
      Alert.alert(
        'Order Placed!',
        `Your order #${order.id.slice(-6)} has been placed successfully. You'll receive updates on the status.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderCartItem = ({ item, index }: { item: any; index: number }) => {
    const dish = getDishById(item.dish_id);
    if (!dish) return null;

    return (
      <Animated.View entering={FadeInDown.delay(index * 100)}>
        <LuxuryCard style={styles.cartItem}>
          <View style={styles.itemContent}>
            <Image source={{ uri: dish.media_urls[0] }} style={styles.itemImage} />
            
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{dish.name}</Text>
              <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
              
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => handleQuantityChange(item.dish_id, item.quantity - 1)}
                >
                  <Minus color="#D4AF37" size={16} />
                </TouchableOpacity>
                
                <Text style={styles.quantityText}>{item.quantity}</Text>
                
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => handleQuantityChange(item.dish_id, item.quantity + 1)}
                >
                  <Plus color="#D4AF37" size={16} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.itemActions}>
              <Text style={styles.itemTotal}>
                {formatPrice(item.price * item.quantity)}
              </Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => dispatch(removeItem(item.dish_id))}
              >
                <Trash2 color="#FF4444" size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </LuxuryCard>
      </Animated.View>
    );
  };

  const PaymentModal = () => (
    <Modal visible={showPaymentModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Payment Method</Text>
          
          <View style={styles.paymentMethods}>
            {[
              { id: 'card', name: 'Credit Card', icon: CreditCard },
              { id: 'zalopay', name: 'ZaloPay', icon: Smartphone },
              { id: 'momo', name: 'MoMo', icon: Smartphone },
              { id: 'cash', name: 'Cash', icon: DollarSign },
            ].map(method => {
              const IconComponent = method.icon;
              return (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentMethod,
                    selectedPaymentMethod === method.id && styles.selectedPaymentMethod,
                  ]}
                  onPress={() => setSelectedPaymentMethod(method.id as any)}
                >
                  <IconComponent
                    color={selectedPaymentMethod === method.id ? '#000000' : '#D4AF37'}
                    size={24}
                  />
                  <Text
                    style={[
                      styles.paymentMethodText,
                      selectedPaymentMethod === method.id && styles.selectedPaymentMethodText,
                    ]}
                  >
                    {method.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.orderSummary}>
            <Text style={styles.orderSummaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>{formatPrice(calculateSubtotal())}</Text>
            </View>
            {appliedVoucher && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Discount ({appliedVoucher.code}):
                </Text>
                <Text style={styles.summaryDiscount}>
                  -{formatPrice(calculateDiscount())}
                </Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>{formatPrice(total)}</Text>
            </View>
          </View>

          <View style={styles.modalButtons}>
            <LuxuryButton
              title="Cancel"
              onPress={() => setShowPaymentModal(false)}
              variant="outline"
              style={styles.modalButton}
            />
            <LuxuryButton
              title={loading ? 'Processing...' : 'Confirm Order'}
              onPress={handleCheckout}
              style={styles.modalButton}
              disabled={loading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  if (items.length === 0) {
    return (
      <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <Text style={styles.emptySubtext}>Add some delicious dishes to get started</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Order</Text>
        <TouchableOpacity onPress={() => dispatch(clearCart())}>
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.dish_id}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />

      {/* Voucher Section */}
      <Animated.View entering={FadeInDown.delay(400)}>
        <LuxuryCard>
          <Text style={styles.sectionTitle}>Apply Voucher</Text>
          
          {appliedVoucher ? (
            <View style={styles.appliedVoucher}>
              <View style={styles.voucherInfo}>
                <Tag color="#D4AF37" size={20} />
                <View style={styles.voucherDetails}>
                  <Text style={styles.voucherCode}>{appliedVoucher.code}</Text>
                  <Text style={styles.voucherDescription}>
                    {appliedVoucher.discount_type === 'percentage'
                      ? `${appliedVoucher.value}% off`
                      : `${formatPrice(appliedVoucher.value)} off`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleRemoveVoucher}>
                <Trash2 color="#FF4444" size={20} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.voucherInput}>
              <TextInput
                style={styles.voucherTextInput}
                placeholder="Enter voucher code"
                placeholderTextColor="#666666"
                value={voucherCode}
                onChangeText={setVoucherCode}
                autoCapitalize="characters"
              />
              <LuxuryButton
                title="Apply"
                onPress={handleApplyVoucher}
                style={styles.applyButton}
              />
            </View>
          )}
        </LuxuryCard>
      </Animated.View>

      {/* Order Summary */}
      <Animated.View entering={FadeInDown.delay(500)}>
        <LuxuryCard gradient>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>{formatPrice(calculateSubtotal())}</Text>
          </View>
          
          {appliedVoucher && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Discount ({appliedVoucher.code}):
              </Text>
              <Text style={styles.summaryDiscount}>
                -{formatPrice(calculateDiscount())}
              </Text>
            </View>
          )}
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>

          <LuxuryButton
            title="Proceed to Checkout"
            onPress={() => setShowPaymentModal(true)}
            style={styles.checkoutButton}
          />
        </LuxuryCard>
      </Animated.View>

      <PaymentModal />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  clearText: {
    fontSize: 16,
    color: '#FF4444',
    fontWeight: '600',
    fontFamily: 'Lato-SemiBold',
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    fontFamily: 'Lato-Regular',
  },
  cartItem: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 16,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
    fontFamily: 'Lato-SemiBold',
  },
  itemPrice: {
    fontSize: 14,
    color: '#D4AF37',
    marginBottom: 8,
    fontFamily: 'Lato-Regular',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginHorizontal: 16,
    fontFamily: 'Lato-SemiBold',
  },
  itemActions: {
    alignItems: 'flex-end',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 8,
    fontFamily: 'Lato-Bold',
  },
  removeButton: {
    padding: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 16,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  appliedVoucher: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  voucherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voucherDetails: {
    marginLeft: 12,
  },
  voucherCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4AF37',
    fontFamily: 'Lato-SemiBold',
  },
  voucherDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    fontFamily: 'Lato-Regular',
  },
  voucherInput: {
    flexDirection: 'row',
    gap: 12,
  },
  voucherTextInput: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    fontFamily: 'Lato-Regular',
  },
  applyButton: {
    paddingHorizontal: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    fontFamily: 'Lato-Regular',
  },
  summaryValue: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    fontFamily: 'Lato-SemiBold',
  },
  summaryDiscount: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    fontFamily: 'Lato-SemiBold',
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.3)',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D4AF37',
    fontFamily: 'PlayfairDisplay-Bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D4AF37',
    fontFamily: 'PlayfairDisplay-Bold',
  },
  checkoutButton: {
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  paymentMethods: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  selectedPaymentMethod: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#D4AF37',
    fontWeight: '600',
    marginLeft: 16,
    fontFamily: 'Lato-SemiBold',
  },
  selectedPaymentMethodText: {
    color: '#000000',
  },
  orderSummary: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  orderSummaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 16,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  modalButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});

export default CartScreen;