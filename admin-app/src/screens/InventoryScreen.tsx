import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  FlatList,
  TouchableOpacity,
  Dimensions,
  RefreshControl
} from 'react-native';
import { 
  Text, 
  Card, 
  useTheme, 
  TextInput,
  Button,
  Badge,
  IconButton,
  Chip,
  Menu,
  Provider,
  FAB,
  Modal,
  Portal,
  SegmentedButtons
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatCard } from '@/components';
import { spacing } from '@/theme';
import { formatCurrency } from '@/utils';
import { useInventory } from '../hooks/useInventory';

const screenWidth = Dimensions.get('window').width;

// Mock data for inventory
const mockInventoryData = [
  {
    id: 1,
    name: "Thịt bò",
    category: "Thịt",
    stock: 15,
    min_stock: 10,
    unit: "kg",
    status: "Đủ hàng",
    price: 350000,
    expiry: "2024-03-25",
    supplier: "Công ty Thịt Sạch ABC"
  },
  {
    id: 2,
    name: "Bánh phở",
    category: "Tinh bột",
    stock: 25,
    min_stock: 20,
    unit: "kg",
    status: "Đủ hàng",
    price: 25000,
    expiry: null,
    supplier: "Nhà máy Bánh Phở Hà Nội"
  },
  {
    id: 3,
    name: "Hành lá",
    category: "Rau củ",
    stock: 3,
    min_stock: 5,
    unit: "kg",
    status: "Sắp hết",
    price: 15000,
    expiry: "2024-03-22",
    supplier: "Nông trại Xanh"
  },
  {
    id: 4,
    name: "Tôm tươi",
    category: "Hải sản",
    stock: 0,
    min_stock: 8,
    unit: "kg",
    status: "Hết hàng",
    price: 420000,
    expiry: "2024-03-21",
    supplier: "Cảng cá Cát Bà"
  },
  {
    id: 5,
    name: "Dầu ăn",
    category: "Gia vị",
    stock: 12,
    min_stock: 6,
    unit: "lít",
    status: "Đủ hàng",
    price: 45000,
    expiry: "2024-12-30",
    supplier: "Công ty Dầu Thực Vật"
  },
  {
    id: 6,
    name: "Gạo tẻ",
    category: "Tinh bột",
    stock: 4,
    min_stock: 10,
    unit: "kg",
    status: "Sắp hết",
    price: 18000,
    expiry: null,
    supplier: "Hợp tác xã Nông nghiệp"
  }
];

// Mock data for import history
const mockImportHistory = [
  {
    id: 1,
    code: "#IMP001",
    reason: "Nhập hàng định kỳ",
    supplier: "Công ty Thịt Sạch ABC",
    staff: "Nguyễn Văn A",
    date: "2024-03-20",
    total: 5500000,
    status: "Hoàn thành"
  },
  {
    id: 2,
    code: "#IMP002",
    reason: "Bổ sung nguyên liệu thiếu",
    supplier: "Nông trại Xanh",
    staff: "Trần Thị B",
    date: "2024-03-19",
    total: 800000,
    status: "Đang xử lý"
  },
  {
    id: 3,
    code: "#IMP003",
    reason: "Nhập hàng khẩn cấp",
    supplier: "Cảng cá Cát Bà",
    staff: "Lê Văn C",
    date: "2024-03-18",
    total: 1200000,
    status: "Hủy"
  },
  {
    id: 4,
    code: "#IMP004",
    reason: "Nhập hàng tuần",
    supplier: "Nhà máy Bánh Phở Hà Nội",
    staff: "Phạm Thị D",
    date: "2024-03-17",
    total: 2300000,
    status: "Hoàn thành"
  }
];

const categories = ["Tất cả", "Thịt", "Hải sản", "Rau củ", "Tinh bột", "Gia vị"];
const inventoryStatuses = ["Tất cả", "Đủ hàng", "Sắp hết", "Hết hàng"];
const importStatuses = ["Tất cả", "Hoàn thành", "Đang xử lý", "Hủy"];

export const InventoryScreen = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [selectedStatus, setSelectedStatus] = useState('Tất cả');
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [inventoryData, setInventoryData] = useState(mockInventoryData);
  const [importData, setImportData] = useState(mockImportHistory);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  
  // Form state for adding new inventory item
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    category: '',
    stock: '',
    min_stock: '',
    unit: '',
    price: '',
    expiry: '',
    supplier: ''
  });

  // Safe check for theme
  if (!theme || !theme.colors) {
    return null;
  }

  // Statistics data
  const totalItems = inventoryData.length;
  const lowStockItems = inventoryData.filter(item => item.stock <= item.min_stock && item.stock > 0).length;
  const outOfStockItems = inventoryData.filter(item => item.stock === 0).length;
  const expiringItems = inventoryData.filter(item => {
    if (!item.expiry) return false;
    const expiryDate = new Date(item.expiry);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  }).length;

  const stats = [
    {
      title: "Tổng nguyên liệu",
      value: totalItems.toString(),
      change: "+2",
      icon: "📦",
      color: "#2196F3",
    },
    {
      title: "Sắp hết hàng",
      value: lowStockItems.toString(),
      change: "+1",
      icon: "⚠️",
      color: "#FF9800",
    },
    {
      title: "Hết hàng",
      value: outOfStockItems.toString(),
      change: "0",
      icon: "❌",
      color: "#F44336",
    },
    {
      title: "Sắp hết hạn",
      value: expiringItems.toString(),
      change: "+1",
      icon: "⏰",
      color: "#9C27B0",
    },
  ];

  // Filter data based on active tab
  const filteredInventoryData = inventoryData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Tất cả' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'Tất cả' || item.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredImportData = importData.filter(item => {
    const matchesSearch = item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.staff.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'Tất cả' || item.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Đủ hàng': return '#4CAF50';
      case 'Sắp hết': return '#FF9800';
      case 'Hết hàng': return '#F44336';
      case 'Hoàn thành': return '#4CAF50';
      case 'Đang xử lý': return '#FF9800';
      case 'Hủy': return '#F44336';
      default: return theme.colors.outline;
    }
  };

  const getStockColor = (stock: number, minStock: number) => {
    if (stock === 0) return '#F44336';
    if (stock <= minStock) return '#FF9800';
    return '#4CAF50';
  };

  const tabButtons = [
    { value: 'inventory', label: 'Kho nguyên liệu' },
    { value: 'history', label: 'Lịch sử nhập hàng' },
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

  const renderInventoryItem = ({ item }: { item: any }) => (
    <Card style={[styles.inventoryCard, { backgroundColor: theme.colors.surface }]} mode="outlined">
      <Card.Content style={styles.inventoryContent}>
        <View style={styles.inventoryHeader}>
          <View style={styles.inventoryTitleSection}>
            <Text variant="titleMedium" style={[styles.inventoryTitle, { color: theme.colors.onSurface }]}>
              {item.name}
            </Text>
            <View style={styles.inventoryRow}>
              <Chip 
                mode="outlined" 
                compact 
                style={[styles.categoryChip, { borderColor: theme.colors.outline }]}
              >
                {item.category}
              </Chip>
              <Badge 
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status) }
                ]}
              >
                {item.status}
              </Badge>
            </View>
          </View>
        </View>

        <View style={styles.inventoryDetails}>
          <View style={styles.stockRow}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Tồn kho:
            </Text>
            <Text variant="titleSmall" style={{ 
              color: getStockColor(item.stock, item.min_stock), 
              fontWeight: 'bold' 
            }}>
              {item.stock} / {item.min_stock} min ({item.unit})
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Đơn giá: <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                {formatCurrency(item.price)}/{item.unit}
              </Text>
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Hạn sử dụng: <Text style={{ fontWeight: 'bold' }}>
                {item.expiry ? new Date(item.expiry).toLocaleDateString('vi-VN') : 'Không có'}
              </Text>
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Nhà cung cấp: <Text style={{ fontWeight: 'bold' }}>{item.supplier}</Text>
            </Text>
          </View>

          <View style={styles.inventoryActions}>
            <IconButton
              icon="pencil"
              mode="contained-tonal"
              size={20}
              onPress={() => console.log('Chỉnh sửa nguyên liệu', item.id)}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderImportItem = ({ item }: { item: any }) => (
    <Card style={[styles.importCard, { backgroundColor: theme.colors.surface }]} mode="outlined">
      <Card.Content style={styles.importContent}>
        <View style={styles.importHeader}>
          <View style={styles.importTitleSection}>
            <Text variant="titleMedium" style={[styles.importTitle, { color: theme.colors.onSurface }]}>
              {item.code}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {item.reason}
            </Text>
          </View>
          <Badge 
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) }
            ]}
          >
            {item.status}
          </Badge>
        </View>

        <View style={styles.importDetails}>
          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Nhà cung cấp: <Text style={{ fontWeight: 'bold' }}>{item.supplier}</Text>
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Nhân viên: <Text style={{ fontWeight: 'bold' }}>{item.staff}</Text>
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Ngày nhập: <Text style={{ fontWeight: 'bold' }}>
                {new Date(item.date).toLocaleDateString('vi-VN')}
              </Text>
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Tổng tiền: <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                {formatCurrency(item.total)}
              </Text>
            </Text>
          </View>

          <View style={styles.importActions}>
            <IconButton
              icon="eye"
              mode="contained-tonal"
              size={20}
              onPress={() => console.log('Xem chi tiết phiếu', item.id)}
            />
            <IconButton
              icon="pencil"
              mode="contained-tonal"
              size={20}
              onPress={() => console.log('Chỉnh sửa phiếu', item.id)}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const handleAddItem = () => {
    console.log('Thêm nguyên liệu mới:', newItemForm);
    setIsAddModalVisible(false);
    setNewItemForm({
      name: '',
      category: '',
      stock: '',
      min_stock: '',
      unit: '',
      price: '',
      expiry: '',
      supplier: ''
    });
  };

  const getFilterStatusOptions = () => {
    return activeTab === 'inventory' ? inventoryStatuses : importStatuses;
  };

  const getSearchPlaceholder = () => {
    return activeTab === 'inventory' 
      ? 'Tìm kiếm nguyên liệu...' 
      : 'Tìm kiếm mã phiếu, nhà cung cấp...';
  };

  const getLowStockWarning = () => {
    if (activeTab !== 'inventory' || lowStockItems === 0) return null;
    
    return (
      <Card style={[styles.warningCard, { backgroundColor: '#FFF3CD', borderColor: '#FFEB3B' }]} mode="outlined">
        <Card.Content style={styles.warningContent}>
          <Text variant="bodyMedium" style={{ color: '#856404' }}>
            ⚠️ Có {lowStockItems} nguyên liệu sắp hết hàng cần bổ sung!
          </Text>
        </Card.Content>
      </Card>
    );
  };

  return (
    <Provider>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.onBackground }]}>
              Quản lý Kho hàng
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Theo dõi và quản lý nguyên liệu 📦
            </Text>
          </View>

          {/* Stats Grid */}
          <FlatList
            data={stats}
            style={styles.statGrid}
            numColumns={2}
            columnWrapperStyle={styles.row}
            keyExtractor={(item) => item.title}
            renderItem={renderStatCard}
            scrollEnabled={false}
          />

          {/* Tab Navigation */}
          <SegmentedButtons
            value={activeTab}
            onValueChange={setActiveTab}
            buttons={tabButtons}
            style={styles.tabs}
          />

          {/* Search and Filter Section */}
          <View style={[styles.searchSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Tìm kiếm & Bộ lọc
            </Text>
            
            {/* Search Input */}
            <TextInput
              mode="outlined"
              label={getSearchPlaceholder()}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              left={<TextInput.Icon icon="magnify" />}
              right={searchQuery ? <TextInput.Icon icon="close" onPress={() => setSearchQuery('')} /> : undefined}
            />

            {/* Filter Row */}
            <View style={styles.filterRow}>
              {/* Category Filter - only show for inventory tab */}
              {activeTab === 'inventory' && (
                <View style={styles.filterItem}>
                  <Text style={[styles.filterLabel, { color: theme.colors.onSurface }]}>Danh mục</Text>
                  <Menu
                    visible={categoryMenuVisible}
                    onDismiss={() => setCategoryMenuVisible(false)}
                    anchor={
                      <Button
                        mode="outlined"
                        onPress={() => setCategoryMenuVisible(true)}
                        style={styles.filterButton}
                        contentStyle={styles.filterButtonContent}
                      >
                        {selectedCategory}
                      </Button>
                    }
                  >
                    {categories.map((category) => (
                      <Menu.Item
                        key={category}
                        onPress={() => {
                          setSelectedCategory(category);
                          setCategoryMenuVisible(false);
                        }}
                        title={category}
                      />
                    ))}
                  </Menu>
                </View>
              )}

              {/* Status Filter */}
              <View style={activeTab === 'inventory' ? styles.filterItem : styles.fullFilterItem}>
                <Text style={[styles.filterLabel, { color: theme.colors.onSurface }]}>Trạng thái</Text>
                <Menu
                  visible={statusMenuVisible}
                  onDismiss={() => setStatusMenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setStatusMenuVisible(true)}
                      style={styles.filterButton}
                      contentStyle={styles.filterButtonContent}
                    >
                      {selectedStatus}
                    </Button>
                  }
                >
                  {getFilterStatusOptions().map((status) => (
                    <Menu.Item
                      key={status}
                      onPress={() => {
                        setSelectedStatus(status);
                        setStatusMenuVisible(false);
                      }}
                      title={status}
                    />
                  ))}
                </Menu>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsRow}>
              {activeTab === 'inventory' && (
                <Button
                  mode="outlined"
                  icon="package-variant"
                  onPress={() => console.log('Nhập hàng')}
                  style={styles.actionButton}
                >
                  Nhập hàng
                </Button>
              )}
              <Button
                mode="contained"
                icon="plus"
                onPress={() => {
                  if (activeTab === 'inventory') {
                    setIsAddModalVisible(true);
                  } else {
                    console.log('Tạo phiếu nhập mới');
                  }
                }}
                style={styles.actionButton}
              >
                {activeTab === 'inventory' ? 'Thêm nguyên liệu' : 'Tạo phiếu nhập'}
              </Button>
            </View>
          </View>

          {/* Warning Banner */}
          {getLowStockWarning()}

          {/* Content based on active tab */}
          <View style={[styles.contentSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              {activeTab === 'inventory' 
                ? `Danh sách nguyên liệu (${filteredInventoryData.length})` 
                : `Danh sách phiếu nhập (${filteredImportData.length})`
              }
            </Text>
            
            {activeTab === 'inventory' ? (
              <FlatList
                data={filteredInventoryData}
                renderItem={renderInventoryItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                      Không tìm thấy nguyên liệu nào 📦
                    </Text>
                  </View>
                }
              />
            ) : (
              <FlatList
                data={filteredImportData}
                renderItem={renderImportItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                      Không tìm thấy phiếu nhập nào 📋
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        </ScrollView>

        {/* Add Item Modal */}
        <Portal>
          <Modal
            visible={isAddModalVisible}
            onDismiss={() => setIsAddModalVisible(false)}
            contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                Thêm nguyên liệu mới
              </Text>

              <View style={styles.formContainer}>
                <TextInput
                  label="Tên nguyên liệu *"
                  value={newItemForm.name}
                  onChangeText={(text) => setNewItemForm(prev => ({ ...prev, name: text }))}
                  mode="outlined"
                  style={styles.formInput}
                />

                <TextInput
                  label="Danh mục *"
                  value={newItemForm.category}
                  onChangeText={(text) => setNewItemForm(prev => ({ ...prev, category: text }))}
                  mode="outlined"
                  style={styles.formInput}
                />

                <TextInput
                  label="Tồn kho hiện tại *"
                  value={newItemForm.stock}
                  onChangeText={(text) => setNewItemForm(prev => ({ ...prev, stock: text }))}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.formInput}
                />

                <TextInput
                  label="Tồn kho tối thiểu *"
                  value={newItemForm.min_stock}
                  onChangeText={(text) => setNewItemForm(prev => ({ ...prev, min_stock: text }))}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.formInput}
                />

                <TextInput
                  label="Đơn vị *"
                  value={newItemForm.unit}
                  onChangeText={(text) => setNewItemForm(prev => ({ ...prev, unit: text }))}
                  mode="outlined"
                  style={styles.formInput}
                  placeholder="kg, lít, gói..."
                />

                <TextInput
                  label="Đơn giá (VNĐ) *"
                  value={newItemForm.price}
                  onChangeText={(text) => setNewItemForm(prev => ({ ...prev, price: text }))}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.formInput}
                />

                <TextInput
                  label="Hạn sử dụng"
                  value={newItemForm.expiry}
                  onChangeText={(text) => setNewItemForm(prev => ({ ...prev, expiry: text }))}
                  mode="outlined"
                  style={styles.formInput}
                  placeholder="YYYY-MM-DD"
                />

                <TextInput
                  label="Nhà cung cấp *"
                  value={newItemForm.supplier}
                  onChangeText={(text) => setNewItemForm(prev => ({ ...prev, supplier: text }))}
                  mode="outlined"
                  style={styles.formInput}
                />
              </View>

              <View style={styles.formActions}>
                <Button 
                  mode="outlined" 
                  onPress={() => setIsAddModalVisible(false)}
                  style={styles.formButton}
                >
                  Hủy
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleAddItem}
                  style={styles.formButton}
                >
                  Thêm nguyên liệu
                </Button>
              </View>
            </ScrollView>
          </Modal>
        </Portal>
      </SafeAreaView>
    </Provider>
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
  tabs: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
  },
  // Search and Filter Section
  searchSection: {
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
  searchInput: {
    marginBottom: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  filterItem: {
    flex: 1,
  },
  fullFilterItem: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  filterButton: {
    justifyContent: 'flex-start',
  },
  filterButtonContent: {
    justifyContent: 'flex-start',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  // Warning Banner
  warningCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  warningContent: {
    paddingVertical: spacing.sm,
  },
  // Content Section
  contentSection: {
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // Inventory Item Styles
  inventoryCard: {
    marginBottom: spacing.md,
  },
  inventoryContent: {
    padding: spacing.md,
  },
  inventoryHeader: {
    marginBottom: spacing.md,
  },
  inventoryTitleSection: {
    gap: spacing.sm,
  },
  inventoryTitle: {
    fontWeight: 'bold',
    lineHeight: 20,
  },
  inventoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryChip: {
    height: 24,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  inventoryDetails: {
    gap: spacing.sm,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
  },
  detailRow: {
    paddingVertical: spacing.xs,
  },
  inventoryActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
  // Import Item Styles
  importCard: {
    marginBottom: spacing.md,
  },
  importContent: {
    padding: spacing.md,
  },
  importHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  importTitleSection: {
    flex: 1,
    marginRight: spacing.md,
  },
  importTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  importDetails: {
    gap: spacing.sm,
  },
  importActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  // Modal styles
  modal: {
    margin: spacing.lg,
    borderRadius: 12,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  modalTitle: {
    marginBottom: spacing.lg,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  formContainer: {
    gap: spacing.md,
  },
  formInput: {
    marginBottom: spacing.sm,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  formButton: {
    flex: 1,
  },
});