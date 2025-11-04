import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  TextInput,
  Searchbar,
  Chip,
  Divider,
  IconButton,
  Card,
  Surface,
  ActivityIndicator,
} from 'react-native-paper';
import { useMenuItems } from '../hooks/useMenu';

interface OrderItem {
  dishId: string;
  dishName: string;
  price: number;
  quantity: number;
  notes?: string;
}

interface CreateOrderModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (orderData: {
    tableId?: string;
    customerName: string;
    customerPhone: string;
    items: OrderItem[];
    notes?: string;
  }) => void;
  tables?: Array<{ id: string; name: string; capacity: number }>;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  visible,
  onDismiss,
  onSubmit,
  tables = [],
}) => {
  const { data: dishes, isLoading: dishesLoading } = useMenuItems();
  
  const [step, setStep] = useState<'items' | 'customer' | 'review'>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [itemNotes, setItemNotes] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setStep('items');
      setSearchQuery('');
      setSelectedCategory('all');
      setSelectedTable('');
      setOrderItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setOrderNotes('');
      setItemNotes({});
    }
  }, [visible]);

  // Get unique categories
  const categories = ['all', ...new Set(dishes?.map((d: any) => d.category).filter(Boolean))] as string[];

  // Filter dishes
  const filteredDishes = dishes?.filter((dish: any) => {
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || dish.category === selectedCategory;
    const isAvailable = dish.available !== false;
    return matchesSearch && matchesCategory && isAvailable;
  }) || [];

  // Add item to order
  const addItem = (dish: any) => {
    const existingIndex = orderItems.findIndex(item => item.dishId === dish.id);
    if (existingIndex >= 0) {
      const updated = [...orderItems];
      updated[existingIndex].quantity += 1;
      setOrderItems(updated);
    } else {
      setOrderItems([
        ...orderItems,
        {
          dishId: dish.id,
          dishName: dish.name,
          price: dish.price,
          quantity: 1,
        },
      ]);
    }
  };

  // Update item quantity
  const updateQuantity = (dishId: string, delta: number) => {
    const updated = orderItems.map(item => {
      if (item.dishId === dishId) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0);
    setOrderItems(updated);
  };

  // Update item notes
  const updateItemNotes = (dishId: string, notes: string) => {
    setItemNotes(prev => ({ ...prev, [dishId]: notes }));
    setOrderItems(orderItems.map(item => 
      item.dishId === dishId ? { ...item, notes } : item
    ));
  };

  // Calculate total
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  // Validate form
  const canProceedToCustomer = orderItems.length > 0;
  const canProceedToReview = customerName.trim() !== '' && customerPhone.trim() !== '';
  const canSubmit = canProceedToCustomer && canProceedToReview;

  // Handle submit
  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      await onSubmit({
        tableId: selectedTable || undefined,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        items: orderItems,
        notes: orderNotes.trim() || undefined,
      });
      onDismiss();
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Render step navigation
  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={[styles.step, step === 'items' && styles.activeStep]}>
        <Text style={[styles.stepText, step === 'items' && styles.activeStepText]}>1. Món ăn</Text>
      </View>
      <View style={[styles.step, step === 'customer' && styles.activeStep]}>
        <Text style={[styles.stepText, step === 'customer' && styles.activeStepText]}>2. Khách hàng</Text>
      </View>
      <View style={[styles.step, step === 'review' && styles.activeStep]}>
        <Text style={[styles.stepText, step === 'review' && styles.activeStepText]}>3. Xác nhận</Text>
      </View>
    </View>
  );

  // Step 1: Select Items
  const renderItemsStep = () => (
    <View style={styles.stepContent}>
      <Searchbar
        placeholder="Tìm món ăn..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories.map(cat => (
          <Chip
            key={cat}
            selected={selectedCategory === cat}
            onPress={() => setSelectedCategory(cat)}
            style={styles.categoryChip}
          >
            {cat === 'all' ? 'Tất cả' : cat}
          </Chip>
        ))}
      </ScrollView>

      {dishesLoading ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <FlatList
          data={filteredDishes}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.dishGrid}
          renderItem={({ item }) => {
            const inCart = orderItems.find(oi => oi.dishId === item.id);
            return (
              <TouchableOpacity
                style={styles.dishCard}
                onPress={() => addItem(item)}
              >
                <Card>
                  <Card.Content>
                    <Text variant="titleMedium" numberOfLines={2}>{item.name}</Text>
                    <Text variant="bodyMedium" style={styles.price}>
                      {item.price.toLocaleString('vi-VN')}đ
                    </Text>
                    {inCart && (
                      <Chip icon="cart" compact style={styles.cartBadge}>
                        {inCart.quantity}
                      </Chip>
                    )}
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {orderItems.length > 0 && (
        <Surface style={styles.cartSummary}>
          <Text variant="titleMedium">Đã chọn: {orderItems.length} món</Text>
          <Text variant="bodyLarge" style={styles.totalText}>
            {total.toLocaleString('vi-VN')}đ
          </Text>
        </Surface>
      )}
    </View>
  );

  // Step 2: Customer Info
  const renderCustomerStep = () => (
    <ScrollView style={styles.stepContent}>
      <Text variant="titleMedium" style={styles.sectionTitle}>Thông tin khách hàng</Text>
      
      <TextInput
        label="Tên khách hàng *"
        value={customerName}
        onChangeText={setCustomerName}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Số điện thoại *"
        value={customerPhone}
        onChangeText={setCustomerPhone}
        mode="outlined"
        keyboardType="phone-pad"
        style={styles.input}
      />

      {tables.length > 0 && (
        <>
          <Text variant="titleMedium" style={styles.sectionTitle}>Chọn bàn (tùy chọn)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tables.map(table => (
              <Chip
                key={table.id}
                selected={selectedTable === table.id}
                onPress={() => setSelectedTable(table.id)}
                style={styles.tableChip}
              >
                {table.name} ({table.capacity} chỗ)
              </Chip>
            ))}
          </ScrollView>
        </>
      )}

      <Text variant="titleMedium" style={styles.sectionTitle}>Ghi chú đơn hàng</Text>
      <TextInput
        value={orderNotes}
        onChangeText={setOrderNotes}
        mode="outlined"
        multiline
        numberOfLines={3}
        placeholder="Ghi chú chung cho đơn hàng..."
        style={styles.input}
      />

      <Text variant="titleMedium" style={styles.sectionTitle}>Chi tiết món ăn</Text>
      {orderItems.map(item => (
        <Card key={item.dishId} style={styles.itemCard}>
          <Card.Content>
            <View style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text variant="titleMedium">{item.dishName}</Text>
                <Text variant="bodyMedium" style={styles.price}>
                  {item.price.toLocaleString('vi-VN')}đ
                </Text>
              </View>
              <View style={styles.quantityControl}>
                <IconButton
                  icon="minus"
                  size={20}
                  onPress={() => updateQuantity(item.dishId, -1)}
                />
                <Text variant="titleMedium">{item.quantity}</Text>
                <IconButton
                  icon="plus"
                  size={20}
                  onPress={() => updateQuantity(item.dishId, 1)}
                />
              </View>
            </View>
            <TextInput
              value={itemNotes[item.dishId] || ''}
              onChangeText={(text) => updateItemNotes(item.dishId, text)}
              placeholder="Ghi chú cho món này..."
              mode="flat"
              dense
              style={styles.itemNotesInput}
            />
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );

  // Step 3: Review Order
  const renderReviewStep = () => (
    <ScrollView style={styles.stepContent}>
      <Text variant="titleLarge" style={styles.reviewTitle}>Xác nhận đơn hàng</Text>

      <Card style={styles.reviewCard}>
        <Card.Title title="Thông tin khách hàng" />
        <Card.Content>
          <Text>Tên: {customerName}</Text>
          <Text>SĐT: {customerPhone}</Text>
          {selectedTable && tables.find(t => t.id === selectedTable) && (
            <Text>Bàn: {tables.find(t => t.id === selectedTable)?.name}</Text>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.reviewCard}>
        <Card.Title title={`Món ăn (${orderItems.length})`} />
        <Card.Content>
          {orderItems.map(item => (
            <View key={item.dishId} style={styles.reviewItem}>
              <Text style={styles.reviewItemName}>
                {item.dishName} x{item.quantity}
              </Text>
              <Text style={styles.reviewItemPrice}>
                {(item.price * item.quantity).toLocaleString('vi-VN')}đ
              </Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.reviewCard}>
        <Card.Content>
          <View style={styles.summaryRow}>
            <Text>Tạm tính:</Text>
            <Text>{subtotal.toLocaleString('vi-VN')}đ</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Thuế (10%):</Text>
            <Text>{tax.toLocaleString('vi-VN')}đ</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text variant="titleLarge">Tổng cộng:</Text>
            <Text variant="titleLarge" style={styles.totalAmount}>
              {total.toLocaleString('vi-VN')}đ
            </Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <View style={styles.header}>
          <Text variant="headlineSmall">Tạo đơn hàng mới</Text>
          <IconButton icon="close" onPress={onDismiss} />
        </View>

        {renderStepIndicator()}

        <View style={styles.content}>
          {step === 'items' && renderItemsStep()}
          {step === 'customer' && renderCustomerStep()}
          {step === 'review' && renderReviewStep()}
        </View>

        <View style={styles.footer}>
          {step !== 'items' && (
            <Button
              mode="outlined"
              onPress={() => {
                if (step === 'customer') setStep('items');
                if (step === 'review') setStep('customer');
              }}
              style={styles.backButton}
            >
              Quay lại
            </Button>
          )}
          
          {step === 'items' && (
            <Button
              mode="contained"
              onPress={() => setStep('customer')}
              disabled={!canProceedToCustomer}
              style={styles.nextButton}
            >
              Tiếp theo ({orderItems.length} món)
            </Button>
          )}

          {step === 'customer' && (
            <Button
              mode="contained"
              onPress={() => setStep('review')}
              disabled={!canProceedToReview}
              style={styles.nextButton}
            >
              Xem lại đơn hàng
            </Button>
          )}

          {step === 'review' && (
            <Button
              mode="contained"
              onPress={handleSubmit}
              disabled={!canSubmit || submitting}
              loading={submitting}
              style={styles.nextButton}
            >
              Tạo đơn hàng
            </Button>
          )}
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    maxHeight: '90%',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  step: {
    padding: 8,
    borderRadius: 4,
  },
  activeStep: {
    backgroundColor: '#3b82f6',
  },
  stepText: {
    fontSize: 12,
    color: '#666',
  },
  activeStepText: {
    color: 'white',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    padding: 16,
  },
  searchbar: {
    marginBottom: 12,
  },
  categoryScroll: {
    marginBottom: 12,
  },
  categoryChip: {
    marginRight: 8,
  },
  loader: {
    marginTop: 32,
  },
  dishGrid: {
    paddingBottom: 80,
  },
  dishCard: {
    flex: 1,
    margin: 4,
  },
  price: {
    color: '#3b82f6',
    fontWeight: 'bold',
    marginTop: 4,
  },
  cartBadge: {
    marginTop: 8,
    backgroundColor: '#10b981',
  },
  cartSummary: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
  },
  totalText: {
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    marginBottom: 12,
  },
  tableChip: {
    marginRight: 8,
    marginBottom: 12,
  },
  itemCard: {
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemNotesInput: {
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  reviewTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  reviewCard: {
    marginBottom: 12,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  reviewItemName: {
    flex: 1,
  },
  reviewItemPrice: {
    fontWeight: 'bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  divider: {
    marginVertical: 8,
  },
  totalAmount: {
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  backButton: {
    flex: 1,
    marginRight: 8,
  },
  nextButton: {
    flex: 2,
  },
});
