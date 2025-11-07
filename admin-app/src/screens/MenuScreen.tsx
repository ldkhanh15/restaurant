import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  FlatList,
  RefreshControl,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import { 
  Text, 
  Card, 
  Button,
  TextInput,
  Menu,
  Chip,
  Badge,
  Portal,
  Modal,
  Provider,
  useTheme,
  SegmentedButtons,
  IconButton,
  Switch
} from 'react-native-paper';
import { spacing } from '@/theme';
import { CachedImage } from '@/components';
import { 
  useMenuItems, 
  useMenuCategories, 
  useCreateMenuItem, 
  useUpdateMenuItem,
  useDeleteMenuItem,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory
} from '../hooks/useMenu';
import { useDishSocket } from '../hooks/useDishSocket';

// Helper function for fallback image
const getFallbackImage = (name: string) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=10b981&color=fff`;
};

export const MenuScreen = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('menu');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Tất cả danh mục');
  const [showInactive, setShowInactive] = useState(false);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  
  // Use menu hooks
  const { data: menuItems = [], isLoading: menuLoading, refetch: refetchMenu, error: menuError } = useMenuItems();
  const { data: categories = [], isLoading: categoriesLoading, refetch: refetchCategories, error: categoriesError } = useMenuCategories();
  
  // Mutations
  const createMenuItemMutation = useCreateMenuItem();
  const updateMenuItemMutation = useUpdateMenuItem();
  const deleteMenuItemMutation = useDeleteMenuItem();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  
  // WebSocket for real-time updates
  const {
    onDishCreated,
    onDishUpdated,
    onDishDeleted,
    onDishAvailabilityChanged,
    isConnected: socketConnected,
  } = useDishSocket();
  
  const isLoading = menuLoading || categoriesLoading;

  // Build category options from API data
  const categoryOptions = useMemo(() => {
    return ['Tất cả danh mục', ...(categories?.map((cat: any) => cat.name) || [])];
  }, [categories]);

  // WebSocket event listeners
  useEffect(() => {
    // When new dish is created
    onDishCreated((dish: any) => {
      console.log('🔔 New dish created:', dish);
      refetchMenu();
    });

    // When dish is updated
    onDishUpdated(({ dish }: { dish: any; changes?: any }) => {
      console.log('🔔 Dish updated:', dish);
      refetchMenu();
    });

    // When dish is deleted
    onDishDeleted(({ dishId }: { dishId: string }) => {
      console.log('🔔 Dish deleted:', dishId);
      refetchMenu();
    });

    // When dish availability changes
    onDishAvailabilityChanged(({ dishId, isAvailable }: { dishId: string; isAvailable: boolean }) => {
      console.log('🔔 Dish availability changed:', dishId, isAvailable);
      refetchMenu();
    });
  }, [onDishCreated, onDishUpdated, onDishDeleted, onDishAvailabilityChanged, refetchMenu]);
  
  // Filter menu items using useMemo for performance
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showEditDishModal, setShowEditDishModal] = useState(false);
  const [showViewDishModal, setShowViewDishModal] = useState(false);
  const [selectedDish, setSelectedDish] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  
  const [newCategoryForm, setNewCategoryForm] = useState({
    name: '',
    description: '',
    status: 'Hoạt động'
  });

  const [newDishForm, setNewDishForm] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    active: true,
    is_available: true,
  });

  // Safe check for theme
  if (!theme || !theme.colors) {
    return null;
  }

  // Filter menu items using useMemo for performance
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
      
      // Handle category - can be object or string
      const itemCategory = typeof item.category === 'object' ? item.category?.name : item.category;
      const matchesCategory = selectedCategoryFilter === 'Tất cả danh mục' || itemCategory === selectedCategoryFilter;
      
      // Use is_available instead of available
      const matchesAvailability = showInactive || (item.is_available !== false);
      
      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [menuItems, searchQuery, selectedCategoryFilter, showInactive]);

  // Filter categories
  const filteredCategories = useMemo(() => {
    return categories; // For now, show all categories since API doesn't have available field
  }, [categories]);

  const onRefresh = () => {
    refetchMenu();
    refetchCategories();
  };

  const handleToggleItemStatus = async (itemId: string) => {
    try {
      const dish = menuItems.find(d => d.id === itemId);
      if (!dish) return;
      
      await updateMenuItemMutation.mutateAsync({ 
        id: itemId.toString(), 
        data: { active: !dish.active } 
      });
      refetchMenu();
    } catch (error) {
      console.error('Toggle status error:', error);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc muốn xóa món ăn này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMenuItemMutation.mutateAsync(itemId.toString());
            } catch (error) {
              console.error('Error deleting menu item:', error);
            }
          }
        }
      ]
    );
  };

  const handleDeleteCategory = (categoryId: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc muốn xóa danh mục này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategoryMutation.mutateAsync(categoryId);
              refetchCategories();
            } catch (error) {
              console.error('Error deleting category:', error);
            }
          }
        }
      ]
    );
  };

  const handleAddCategory = async () => {
    if (!newCategoryForm.name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên danh mục');
      return;
    }

    try {
      await createCategoryMutation.mutateAsync({
        name: newCategoryForm.name.trim(),
        description: newCategoryForm.description.trim(),
        is_active: newCategoryForm.status === 'Hoạt động',
      });
      
      setNewCategoryForm({ name: '', description: '', status: 'Hoạt động' });
      setShowAddCategoryModal(false);
      Alert.alert('Thành công', 'Đã thêm danh mục mới!');
      refetchCategories();
    } catch (error: any) {
      console.error('Error creating category:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tạo danh mục');
    }
  };

  const handleAddDish = async () => {
    if (!newDishForm.name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên món ăn');
      return;
    }

    if (!newDishForm.price || Number(newDishForm.price) <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập giá hợp lệ');
      return;
    }

    if (!newDishForm.category_id) {
      Alert.alert('Lỗi', 'Vui lòng chọn danh mục');
      return;
    }

    try {
      await createMenuItemMutation.mutateAsync({
        name: newDishForm.name.trim(),
        description: newDishForm.description.trim(),
        price: Number(newDishForm.price),
        category_id: newDishForm.category_id,
        active: newDishForm.active,
        is_available: newDishForm.is_available,
      });
      
      setNewDishForm({
        name: '',
        description: '',
        price: '',
        category_id: '',
        active: true,
        is_available: true,
      });
      setShowAddDishModal(false);
      Alert.alert('Thành công', 'Đã thêm món ăn mới!');
      refetchMenu();
    } catch (error: any) {
      console.error('Error creating dish:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tạo món ăn');
    }
  };

  const handleEditDish = (dish: any) => {
    setSelectedDish(dish);
    setNewDishForm({
      name: dish.name || '',
      description: dish.description || '',
      price: dish.price?.toString() || '',
      category_id: dish.category_id || (typeof dish.category === 'object' ? dish.category?.id : ''),
      active: dish.active ?? true,
      is_available: dish.is_available ?? true,
    });
    setShowEditDishModal(true);
  };

  const handleUpdateDish = async () => {
    if (!selectedDish) return;
    
    if (!newDishForm.name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên món ăn');
      return;
    }

    if (!newDishForm.price || Number(newDishForm.price) <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập giá hợp lệ');
      return;
    }

    try {
      await updateMenuItemMutation.mutateAsync({
        id: selectedDish.id,
        data: {
          name: newDishForm.name.trim(),
          description: newDishForm.description.trim(),
          price: Number(newDishForm.price),
          category_id: newDishForm.category_id,
          active: newDishForm.active,
          is_available: newDishForm.is_available,
        }
      });
      
      setShowEditDishModal(false);
      setSelectedDish(null);
      setNewDishForm({
        name: '',
        description: '',
        price: '',
        category_id: '',
        active: true,
        is_available: true,
      });
      Alert.alert('Thành công', 'Đã cập nhật món ăn!');
      refetchMenu();
    } catch (error: any) {
      console.error('Error updating dish:', error);
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật món ăn');
    }
  };

  const handleViewDish = (dish: any) => {
    setSelectedDish(dish);
    setShowViewDishModal(true);
  };

  const handleEditCategory = (category: any) => {
    setSelectedCategory(category);
    setNewCategoryForm({
      name: category.name || '',
      description: category.description || '',
      status: category.is_active ? 'Hoạt động' : 'Tạm dừng',
    });
    setShowEditCategoryModal(true);
  };

  const handleUpdateCategory = async () => {
    if (!selectedCategory) return;
    
    if (!newCategoryForm.name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên danh mục');
      return;
    }

    try {
      await updateCategoryMutation.mutateAsync({
        id: selectedCategory.id,
        data: {
          name: newCategoryForm.name.trim(),
          description: newCategoryForm.description.trim(),
          is_active: newCategoryForm.status === 'Hoạt động',
        }
      });
      
      setShowEditCategoryModal(false);
      setSelectedCategory(null);
      setNewCategoryForm({ name: '', description: '', status: 'Hoạt động' });
      Alert.alert('Thành công', 'Đã cập nhật danh mục!');
      refetchCategories();
    } catch (error: any) {
      console.error('Error updating category:', error);
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật danh mục');
    }
  };

  const renderMenuItem = ({ item }: { item: any }) => {
    // Parse media_urls if it's a string
    let imageUrl = item.image_url;
    
    // Try to get image from media_urls if image_url is not available
    if (!imageUrl && item.media_urls) {
      try {
        const parsedUrls = typeof item.media_urls === 'string' 
          ? JSON.parse(item.media_urls) 
          : item.media_urls;
        imageUrl = Array.isArray(parsedUrls) && parsedUrls.length > 0 ? parsedUrls[0] : null;
      } catch (e) {
        // If parsing fails, try to use it directly if it looks like a URL
        if (typeof item.media_urls === 'string' && item.media_urls.startsWith('http')) {
          imageUrl = item.media_urls;
        }
      }
    }

    // Trim and validate URL
    if (imageUrl && typeof imageUrl === 'string') {
      imageUrl = imageUrl.trim();
    }
    
    // Validate if image URL is usable (http or https)
    const isValidUrl = typeof imageUrl === 'string' && 
                       imageUrl.length > 0 && 
                       (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'));
    const displayImageUrl = isValidUrl ? imageUrl : null;

    return (
      <Card style={[styles.menuItemCard, { backgroundColor: theme.colors.surface }]} mode="outlined">
        <Card.Content style={styles.menuItemContent}>
          {/* Image and main info */}
          <View style={styles.itemHeader}>
            <View style={styles.imageContainer}>
              {displayImageUrl ? (
                <CachedImage 
                  uri={displayImageUrl}
                  style={styles.itemImage}
                />
              ) : (
                <View style={[styles.itemImage, styles.placeholderContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Text style={[styles.placeholderText, { color: theme.colors.onSurfaceVariant }]}>
                    {item.name.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.itemMainInfo}>
              <View style={styles.itemTitleRow}>
                <Text style={[styles.itemName, { color: theme.colors.onSurface }]} numberOfLines={2}>
                  {item.name}
                </Text>
              </View>
              <Text style={[styles.itemPrice, { color: theme.colors.primary }]}>
                {Number(item.price).toLocaleString('vi-VN')}đ
              </Text>
              <Text style={[styles.itemDescription, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
                {item.description || 'Chưa có mô tả'}
              </Text>
            </View>
          </View>

          {/* Badges and status */}
          <View style={styles.itemBadgesRow}>
            <View style={styles.leftBadges}>
              <Chip 
                mode="flat" 
                compact 
                style={[styles.categoryBadge, { backgroundColor: theme.colors.primaryContainer }]}
                textStyle={{ color: theme.colors.onPrimaryContainer, fontSize: 11 }}
              >
                {typeof item.category === 'object' ? item.category?.name : item.category || 'N/A'}
              </Chip>
            </View>
            <Badge 
              style={[styles.statusBadge, { backgroundColor: item.active ? '#10b981' : '#6b7280' }]}
            >
              {item.active ? 'Hoạt động' : 'Tạm dừng'}
            </Badge>
          </View>

          {/* Action buttons */}
          <View style={styles.itemActions}>
            <IconButton
              icon="eye"
              size={20}
              onPress={() => handleViewDish(item)}
              style={styles.actionButton}
            />
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => handleEditDish(item)}
              style={styles.actionButton}
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDeleteItem(item.id)}
              style={styles.actionButton}
            />
            <IconButton
              icon={item.active ? 'toggle-switch' : 'toggle-switch-off'}
              size={20}
              onPress={() => handleToggleItemStatus(item.id)}
              style={styles.actionButton}
              iconColor={item.active ? '#10b981' : '#6b7280'}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderCategoryItem = ({ item }: { item: any }) => {
    // Count dishes in this category
    const dishCount = menuItems.filter(dish => {
      const dishCategoryId = typeof dish.category === 'object' ? dish.category?.id : dish.category_id;
      return dishCategoryId === item.id;
    }).length;

    return (
      <Card style={[styles.categoryCard, { backgroundColor: theme.colors.surface }]} mode="outlined">
        <Card.Content style={styles.categoryContent}>
          <View style={styles.categoryHeader}>
            <Text variant="titleMedium" style={[styles.categoryName, { color: theme.colors.onSurface }]}>
              {item.name}
            </Text>
            <Badge 
              style={[styles.categoryStatusBadge, { backgroundColor: item.is_active ? '#10b981' : '#6b7280' }]}
            >
              {item.is_active ? 'Hoạt động' : 'Tạm dừng'}
            </Badge>
          </View>
          
          <Text variant="bodyMedium" style={[styles.categoryDescription, { color: theme.colors.onSurfaceVariant }]}>
            {item.description || 'Chưa có mô tả'}
          </Text>
          
          <View style={styles.categoryFooter}>
            <Text variant="bodySmall" style={[styles.itemCount, { color: theme.colors.primary }]}>
              {dishCount} món ăn
            </Text>
            <View style={styles.categoryActions}>
              <IconButton
                icon="pencil"
                size={18}
                onPress={() => handleEditCategory(item)}
                style={styles.categoryActionButton}
              />
              <IconButton
                icon="delete"
                size={18}
                onPress={() => handleDeleteCategory(item.id)}
                style={styles.categoryActionButton}
              />
            </View>
          </View>
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
              refreshing={isLoading}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View>
                <Text style={[styles.title, { color: theme.colors.onBackground }]}>
                  Quản lý Thực đơn
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                  {filteredMenuItems.length} món ăn {socketConnected && '• Đang cập nhật'}
                </Text>
              </View>
              <View style={styles.connectionBadge}>
                <View style={[styles.connectionDot, { backgroundColor: socketConnected ? '#10b981' : '#94a3b8' }]} />
              </View>
            </View>
          </View>

          {/* Error Messages */}
          {(menuError || categoriesError) && (
            <Card style={[styles.errorCard, { backgroundColor: theme.colors.errorContainer }]}>
              <Card.Content>
                <Text style={[styles.errorText, { color: theme.colors.onErrorContainer }]}>
                  ⚠️ {menuError?.message || categoriesError?.message || 'Lỗi tải dữ liệu'}
                </Text>
                <Button 
                  mode="text" 
                  onPress={onRefresh}
                  textColor={theme.colors.onErrorContainer}
                >
                  Thử lại
                </Button>
              </Card.Content>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && menuItems.length === 0 && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
                Đang tải dữ liệu...
              </Text>
            </View>
          )}

          {/* Tab Navigation */}
          <View style={[styles.tabSection, { backgroundColor: theme.colors.surface }]}>
            <SegmentedButtons
              value={activeTab}
              onValueChange={setActiveTab}
              buttons={[
                { value: 'menu', label: 'Quản lý món ăn', icon: 'food' },
                { value: 'categories', label: 'Quản lý danh mục', icon: 'view-grid' }
              ]}
              style={styles.tabButtons}
            />
            <Button
              mode="contained"
              icon="plus"
              onPress={() => {
                if (activeTab === 'categories') {
                  setShowAddCategoryModal(true);
                } else {
                  setShowAddDishModal(true);
                }
              }}
              style={styles.addButton}
            >
              {activeTab === 'categories' ? 'Thêm danh mục' : 'Thêm món ăn'}
            </Button>
          </View>

          {activeTab === 'menu' ? (
            // Menu Items Management
            <View>
              {/* Search and Filter Section */}
              <View style={[styles.filterSection, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                  Danh sách món ăn
                </Text>
                
                {/* Search Input */}
                <TextInput
                  mode="outlined"
                  label="Tìm kiếm món ăn..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchInput}
                  left={<TextInput.Icon icon="magnify" />}
                  right={searchQuery ? <TextInput.Icon icon="close" onPress={() => setSearchQuery('')} /> : undefined}
                />

                {/* Filter Row */}
                <View style={styles.filterRow}>
                  {/* Category Filter */}
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
                          {selectedCategoryFilter}
                        </Button>
                      }
                    >
                      {categoryOptions.map((category) => (
                        <Menu.Item
                          key={category}
                          onPress={() => {
                            setSelectedCategoryFilter(category);
                            setCategoryMenuVisible(false);
                          }}
                          title={category}
                        />
                      ))}
                    </Menu>
                  </View>

                  {/* Show Inactive Toggle */}
                  <View style={styles.toggleContainer}>
                    <Text style={[styles.toggleLabel, { color: theme.colors.onSurface }]}>
                      Hiện không hoạt động
                    </Text>
                    <Switch
                      value={showInactive}
                      onValueChange={setShowInactive}
                    />
                  </View>
                </View>
              </View>

              {/* Menu Items List */}
              <View style={[styles.itemsListSection, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                  Món ăn ({filteredMenuItems.length})
                </Text>
                <FlatList
                  key="menu-items-list"
                  data={filteredMenuItems}
                  renderItem={renderMenuItem}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                        Không tìm thấy món ăn nào phù hợp 🍽️
                      </Text>
                    </View>
                  }
                />
              </View>
            </View>
          ) : (
            // Categories Management
            <View>
              {/* Categories Filter */}
              <View style={[styles.filterSection, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                  Danh sách danh mục
                </Text>
                
                <View style={styles.categoryFilterRow}>
                  <View style={styles.toggleContainer}>
                    <Text style={[styles.toggleLabel, { color: theme.colors.onSurface }]}>
                      Hiện không hoạt động
                    </Text>
                    <Switch
                      value={showInactive}
                      onValueChange={setShowInactive}
                    />
                  </View>
                </View>
              </View>

              {/* Categories Grid */}
              <View style={[styles.categoriesListSection, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                  Danh mục ({filteredCategories.length})
                </Text>
                <FlatList
                  key="categories-grid"
                  data={filteredCategories}
                  renderItem={renderCategoryItem}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={2}
                  columnWrapperStyle={styles.categoryRow}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                        Không có danh mục nào 📂
                      </Text>
                    </View>
                  }
                />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Add Category Modal */}
        <Portal>
          <Modal
            visible={showAddCategoryModal}
            onDismiss={() => setShowAddCategoryModal(false)}
            contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                  Thêm danh mục mới
                </Text>
                <IconButton
                  icon="close"
                  onPress={() => setShowAddCategoryModal(false)}
                  style={styles.closeButton}
                />
              </View>

              <View style={styles.modalContent}>
                {/* Category Name */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                    Tên danh mục <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={newCategoryForm.name}
                    onChangeText={(text) => setNewCategoryForm(prev => ({ ...prev, name: text }))}
                    placeholder="VD: Khai vị"
                    style={styles.modalInput}
                  />
                </View>

                {/* Category Description */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                    Mô tả
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={newCategoryForm.description}
                    onChangeText={(text) => setNewCategoryForm(prev => ({ ...prev, description: text }))}
                    placeholder="Mô tả về danh mục..."
                    multiline
                    numberOfLines={3}
                    style={styles.modalInput}
                  />
                </View>

                {/* Status */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                    Trạng thái
                  </Text>
                  <SegmentedButtons
                    value={newCategoryForm.status}
                    onValueChange={(value) => setNewCategoryForm(prev => ({ ...prev, status: value }))}
                    buttons={[
                      { value: 'Hoạt động', label: 'Hoạt động' },
                      { value: 'Tạm dừng', label: 'Tạm dừng' }
                    ]}
                    style={styles.statusButtons}
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setShowAddCategoryModal(false)}
                  style={[styles.modalActionButton, styles.cancelButton]}
                >
                  Hủy
                </Button>
                <Button
                  mode="contained"
                  onPress={handleAddCategory}
                  style={[styles.modalActionButton, styles.saveButton]}
                  loading={createCategoryMutation.isPending}
                >
                  Thêm danh mục
                </Button>
              </View>
            </ScrollView>
          </Modal>
        </Portal>

        {/* Add Dish Modal */}
        <Portal>
          <Modal
            visible={showAddDishModal}
            onDismiss={() => setShowAddDishModal(false)}
            contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                  Thêm món ăn mới
                </Text>
                <IconButton
                  icon="close"
                  onPress={() => setShowAddDishModal(false)}
                  style={styles.closeButton}
                />
              </View>

              <View style={styles.modalContent}>
                {/* Dish Name */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                    Tên món ăn <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={newDishForm.name}
                    onChangeText={(text) => setNewDishForm(prev => ({ ...prev, name: text }))}
                    placeholder="VD: Phở Bò Tái"
                    style={styles.modalInput}
                  />
                </View>

                {/* Description */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                    Mô tả
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={newDishForm.description}
                    onChangeText={(text) => setNewDishForm(prev => ({ ...prev, description: text }))}
                    placeholder="Mô tả chi tiết về món ăn..."
                    multiline
                    numberOfLines={3}
                    style={styles.modalInput}
                  />
                </View>

                {/* Price */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                    Giá <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={newDishForm.price}
                    onChangeText={(text) => setNewDishForm(prev => ({ ...prev, price: text.replace(/[^0-9]/g, '') }))}
                    placeholder="VD: 85000"
                    keyboardType="numeric"
                    right={<TextInput.Affix text="đ" />}
                    style={styles.modalInput}
                  />
                </View>

                {/* Category */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                    Danh mục <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.categoryPickerContainer}>
                    {categories.map((category) => (
                      <Chip
                        key={category.id}
                        selected={newDishForm.category_id === category.id}
                        onPress={() => setNewDishForm(prev => ({ ...prev, category_id: category.id }))}
                        style={styles.categoryChip}
                      >
                        {category.name}
                      </Chip>
                    ))}
                  </View>
                </View>

                {/* Active Status */}
                <View style={styles.inputGroup}>
                  <View style={styles.switchRow}>
                    <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                      Món ăn đang hoạt động
                    </Text>
                    <Switch
                      value={newDishForm.active}
                      onValueChange={(value) => setNewDishForm(prev => ({ ...prev, active: value }))}
                    />
                  </View>
                </View>

                {/* Available Status */}
                <View style={styles.inputGroup}>
                  <View style={styles.switchRow}>
                    <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                      Có sẵn để đặt
                    </Text>
                    <Switch
                      value={newDishForm.is_available}
                      onValueChange={(value) => setNewDishForm(prev => ({ ...prev, is_available: value }))}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setShowAddDishModal(false)}
                  style={[styles.modalActionButton, styles.cancelButton]}
                >
                  Hủy
                </Button>
                <Button
                  mode="contained"
                  onPress={handleAddDish}
                  style={[styles.modalActionButton, styles.saveButton]}
                  loading={createMenuItemMutation.isPending}
                >
                  Thêm món ăn
                </Button>
              </View>
            </ScrollView>
          </Modal>
        </Portal>

        {/* Edit Category Modal */}
        <Portal>
          <Modal
            visible={showEditCategoryModal}
            onDismiss={() => {
              setShowEditCategoryModal(false);
              setSelectedCategory(null);
              setNewCategoryForm({ name: '', description: '', status: 'Hoạt động' });
            }}
            contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                  Chỉnh sửa danh mục
                </Text>
                <IconButton
                  icon="close"
                  onPress={() => {
                    setShowEditCategoryModal(false);
                    setSelectedCategory(null);
                    setNewCategoryForm({ name: '', description: '', status: 'Hoạt động' });
                  }}
                  style={styles.closeButton}
                />
              </View>

              <View style={styles.modalContent}>
                {/* Category Name */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                    Tên danh mục <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={newCategoryForm.name}
                    onChangeText={(text) => setNewCategoryForm(prev => ({ ...prev, name: text }))}
                    placeholder="VD: Khai vị"
                    style={styles.modalInput}
                  />
                </View>

                {/* Category Description */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                    Mô tả
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={newCategoryForm.description}
                    onChangeText={(text) => setNewCategoryForm(prev => ({ ...prev, description: text }))}
                    placeholder="Mô tả về danh mục..."
                    multiline
                    numberOfLines={3}
                    style={styles.modalInput}
                  />
                </View>

                {/* Status */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                    Trạng thái
                  </Text>
                  <SegmentedButtons
                    value={newCategoryForm.status}
                    onValueChange={(value) => setNewCategoryForm(prev => ({ ...prev, status: value }))}
                    buttons={[
                      { value: 'Hoạt động', label: 'Hoạt động' },
                      { value: 'Tạm dừng', label: 'Tạm dừng' }
                    ]}
                    style={styles.statusButtons}
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setShowEditCategoryModal(false);
                    setSelectedCategory(null);
                    setNewCategoryForm({ name: '', description: '', status: 'Hoạt động' });
                  }}
                  style={[styles.modalActionButton, styles.cancelButton]}
                >
                  Hủy
                </Button>
                <Button
                  mode="contained"
                  onPress={handleUpdateCategory}
                  style={[styles.modalActionButton, styles.saveButton]}
                  loading={updateCategoryMutation.isPending}
                >
                  Cập nhật
                </Button>
              </View>
            </ScrollView>
          </Modal>
        </Portal>

        {/* Edit Dish Modal */}
        <Portal>
          <Modal
            visible={showEditDishModal}
            onDismiss={() => {
              setShowEditDishModal(false);
              setSelectedDish(null);
              setNewDishForm({
                name: '',
                description: '',
                price: '',
                category_id: '',
                active: true,
                is_available: true,
              });
            }}
            contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                  Chỉnh sửa món ăn
                </Text>
                <IconButton
                  icon="close"
                  onPress={() => {
                    setShowEditDishModal(false);
                    setSelectedDish(null);
                    setNewDishForm({
                      name: '',
                      description: '',
                      price: '',
                      category_id: '',
                      active: true,
                      is_available: true,
                    });
                  }}
                  style={styles.closeButton}
                />
              </View>

              <View style={styles.modalContent}>
                {/* Dish Name */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                    Tên món ăn <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={newDishForm.name}
                    onChangeText={(text) => setNewDishForm(prev => ({ ...prev, name: text }))}
                    placeholder="VD: Phở Bò Tái"
                    style={styles.modalInput}
                  />
                </View>

                {/* Description */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                    Mô tả
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={newDishForm.description}
                    onChangeText={(text) => setNewDishForm(prev => ({ ...prev, description: text }))}
                    placeholder="Mô tả chi tiết về món ăn..."
                    multiline
                    numberOfLines={3}
                    style={styles.modalInput}
                  />
                </View>

                {/* Price */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                    Giá <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={newDishForm.price}
                    onChangeText={(text) => setNewDishForm(prev => ({ ...prev, price: text.replace(/[^0-9]/g, '') }))}
                    placeholder="VD: 85000"
                    keyboardType="numeric"
                    right={<TextInput.Affix text="đ" />}
                    style={styles.modalInput}
                  />
                </View>

                {/* Category */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                    Danh mục <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.categoryPickerContainer}>
                    {categories.map((category) => (
                      <Chip
                        key={category.id}
                        selected={newDishForm.category_id === category.id}
                        onPress={() => setNewDishForm(prev => ({ ...prev, category_id: category.id }))}
                        style={styles.categoryChip}
                      >
                        {category.name}
                      </Chip>
                    ))}
                  </View>
                </View>

                {/* Active Status */}
                <View style={styles.inputGroup}>
                  <View style={styles.switchRow}>
                    <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                      Món ăn đang hoạt động
                    </Text>
                    <Switch
                      value={newDishForm.active}
                      onValueChange={(value) => setNewDishForm(prev => ({ ...prev, active: value }))}
                    />
                  </View>
                </View>

                {/* Available Status */}
                <View style={styles.inputGroup}>
                  <View style={styles.switchRow}>
                    <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                      Có sẵn để đặt
                    </Text>
                    <Switch
                      value={newDishForm.is_available}
                      onValueChange={(value) => setNewDishForm(prev => ({ ...prev, is_available: value }))}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setShowEditDishModal(false);
                    setSelectedDish(null);
                    setNewDishForm({
                      name: '',
                      description: '',
                      price: '',
                      category_id: '',
                      active: true,
                      is_available: true,
                    });
                  }}
                  style={[styles.modalActionButton, styles.cancelButton]}
                >
                  Hủy
                </Button>
                <Button
                  mode="contained"
                  onPress={handleUpdateDish}
                  style={[styles.modalActionButton, styles.saveButton]}
                  loading={updateMenuItemMutation.isPending}
                >
                  Cập nhật
                </Button>
              </View>
            </ScrollView>
          </Modal>
        </Portal>

        {/* View Dish Modal */}
        <Portal>
          <Modal
            visible={showViewDishModal}
            onDismiss={() => {
              setShowViewDishModal(false);
              setSelectedDish(null);
            }}
            contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                  Chi tiết món ăn
                </Text>
                <IconButton
                  icon="close"
                  onPress={() => {
                    setShowViewDishModal(false);
                    setSelectedDish(null);
                  }}
                  style={styles.closeButton}
                />
              </View>

              {selectedDish && (
                <View style={styles.modalContent}>
                  {/* Image */}
                  {selectedDish.image_url && (
                    <View style={styles.viewImageContainer}>
                      <CachedImage
                        uri={selectedDish.image_url || getFallbackImage(selectedDish.name)}
                        style={styles.viewImage}
                      />
                    </View>
                  )}

                  {/* Name */}
                  <View style={styles.viewField}>
                    <Text style={[styles.viewLabel, { color: theme.colors.onSurfaceVariant }]}>
                      Tên món ăn
                    </Text>
                    <Text style={[styles.viewValue, { color: theme.colors.onSurface }]}>
                      {selectedDish.name}
                    </Text>
                  </View>

                  {/* Description */}
                  {selectedDish.description && (
                    <View style={styles.viewField}>
                      <Text style={[styles.viewLabel, { color: theme.colors.onSurfaceVariant }]}>
                        Mô tả
                      </Text>
                      <Text style={[styles.viewValue, { color: theme.colors.onSurface }]}>
                        {selectedDish.description}
                      </Text>
                    </View>
                  )}

                  {/* Price */}
                  <View style={styles.viewField}>
                    <Text style={[styles.viewLabel, { color: theme.colors.onSurfaceVariant }]}>
                      Giá
                    </Text>
                    <Text style={[styles.viewValue, { color: theme.colors.primary, fontWeight: 'bold' }]}>
                      {selectedDish.price.toLocaleString()}đ
                    </Text>
                  </View>

                  {/* Category */}
                  <View style={styles.viewField}>
                    <Text style={[styles.viewLabel, { color: theme.colors.onSurfaceVariant }]}>
                      Danh mục
                    </Text>
                    <Chip mode="flat" compact>
                      {typeof selectedDish.category === 'object' 
                        ? selectedDish.category?.name 
                        : selectedDish.category}
                    </Chip>
                  </View>

                  {/* Status Row */}
                  <View style={styles.viewStatusRow}>
                    <View style={styles.viewStatusItem}>
                      <Text style={[styles.viewLabel, { color: theme.colors.onSurfaceVariant }]}>
                        Trạng thái
                      </Text>
                      <Badge 
                        style={[
                          styles.viewStatusBadge, 
                          { backgroundColor: selectedDish.active ? '#10b981' : '#6b7280' }
                        ]}
                      >
                        {selectedDish.active ? 'Hoạt động' : 'Tạm dừng'}
                      </Badge>
                    </View>

                    <View style={styles.viewStatusItem}>
                      <Text style={[styles.viewLabel, { color: theme.colors.onSurfaceVariant }]}>
                        Sẵn có
                      </Text>
                      <Badge 
                        style={[
                          styles.viewStatusBadge, 
                          { backgroundColor: selectedDish.is_available ? '#10b981' : '#6b7280' }
                        ]}
                      >
                        {selectedDish.is_available ? 'Có' : 'Hết'}
                      </Badge>
                    </View>
                  </View>

                  {/* Timestamps */}
                  <View style={styles.viewField}>
                    <Text style={[styles.viewLabel, { color: theme.colors.onSurfaceVariant }]}>
                      Ngày tạo
                    </Text>
                    <Text style={[styles.viewValue, { color: theme.colors.onSurface, fontSize: 12 }]}>
                      {new Date(selectedDish.created_at).toLocaleString('vi-VN')}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.modalActions}>
                <Button
                  mode="contained"
                  onPress={() => {
                    setShowViewDishModal(false);
                    setSelectedDish(null);
                  }}
                  style={[styles.modalActionButton, styles.saveButton]}
                >
                  Đóng
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '400',
  },
  connectionBadge: {
    padding: 8,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Tab Section
  tabSection: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tabButtons: {
    marginBottom: spacing.md,
  },
  addButton: {
    alignSelf: 'flex-end',
  },
  // Filter Section
  filterSection: {
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
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  filterItem: {
    flex: 1,
    marginRight: spacing.md,
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
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  // Category Filter
  categoryFilterRow: {
    marginTop: spacing.sm,
  },
  // Items List Section
  itemsListSection: {
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
  // Menu Item Card
  menuItemCard: {
    marginBottom: spacing.md,
  },
  menuItemContent: {
    padding: spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  imageContainer: {
    marginRight: spacing.md,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  itemMainInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemTitleRow: {
    marginBottom: spacing.xs,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  itemDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  itemBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  leftBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  categoryBadge: {
    height: 24,
  },
  specialBadge: {
    height: 24,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  actionButton: {
    margin: 0,
  },
  // Categories List Section
  categoriesListSection: {
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
  categoryRow: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  // Category Card
  categoryCard: {
    flex: 1,
    marginBottom: spacing.md,
    marginHorizontal: spacing.xs,
  },
  categoryContent: {
    padding: spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  categoryName: {
    flex: 1,
    fontWeight: 'bold',
    marginRight: spacing.sm,
  },
  categoryStatusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  categoryDescription: {
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  categoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCount: {
    fontWeight: '500',
  },
  categoryActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  categoryActionButton: {
    margin: 0,
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  // Modal styles
  modalContainer: {
    margin: spacing.md,
    maxHeight: '90%',
    borderRadius: 12,
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    margin: 0,
  },
  modalContent: {
    // Removed flex: 1 to work with ScrollView
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  required: {
    color: '#ef4444', // red-500 (error)
  },
  modalInput: {
    marginBottom: spacing.xs,
  },
  statusButtons: {
    marginTop: spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  modalActionButton: {
    minWidth: 100,
  },
  cancelButton: {
    marginRight: spacing.sm,
  },
  saveButton: {
    // Default styles
  },
  categoryPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  categoryChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Legacy styles to maintain compatibility
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
  },
  errorCard: {
    margin: spacing.md,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  headerContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  segmentedButtons: {
    // Remove background color here since it's set dynamically
  },
  searchContainer: {
    paddingBottom: 16,
    elevation: 1,
  },
  searchbar: {
    margin: 16,
    marginBottom: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchLabel: {
    marginRight: 8,
    fontSize: 14,
  },
  categoriesContainer: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  list: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusChip: {
    marginLeft: 4,
  },
  specialChip: {
    marginLeft: 4,
  },
  description: {
    marginBottom: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  category: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  // View Modal Styles
  viewImageContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  viewImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  viewField: {
    marginBottom: spacing.lg,
  },
  viewLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  viewValue: {
    fontSize: 16,
    lineHeight: 22,
  },
  viewStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  viewStatusItem: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  viewStatusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginTop: spacing.xs,
  },
});

export default MenuScreen;