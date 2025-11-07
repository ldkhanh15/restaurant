import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  FlatList,
  RefreshControl,
  Alert 
} from 'react-native';
import { 
  Text, 
  Card, 
  Button,
  TextInput,
  Menu,
  Chip,
  Badge,
  Provider,
  useTheme,
  ProgressBar,
  Modal,
  Portal
} from 'react-native-paper';
import { spacing } from '@/theme';
import { StatCard } from '@/components';
import { useVouchers } from '../hooks/useVouchers';

const voucherStatuses = ["Tất cả trạng thái", "Đang hoạt động", "Tạm dừng", "Hết hạn", "Bản nháp"];
const voucherTypes = ["Tất cả loại", "Phần trăm", "Số tiền cố định", "Miễn phí ship", "Mua X tặng Y"];

// Form options for create voucher
const createVoucherTypes = ["Phần trăm", "Số tiền cố định", "Miễn phí ship", "Mua X tặng Y"];
const createVoucherStatuses = ["Đang hoạt động", "Tạm dừng", "Hết hạn", "Bản nháp"];
const applyToOptions = ["Tất cả khách hàng", "Khách hàng mới", "Khách hàng VIP", "Theo danh mục món ăn"];

export const VoucherScreen = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Tất cả trạng thái');
  const [selectedType, setSelectedType] = useState('Tất cả loại');
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);
  
  // Use API hook for vouchers
  const { 
    vouchers, 
    loading: isLoading, 
    error, 
    refresh,
    createVoucher: createVoucherMutation,
    updateVoucher: updateVoucherMutation,
    deleteVoucher: deleteVoucherMutation
  } = useVouchers();
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form state for create voucher
  const [formData, setFormData] = useState({
    voucherCode: '',
    voucherType: '',
    voucherName: '',
    description: '',
    discountValue: '',
    minOrder: '',
    usageLimit: '',
    startDate: '',
    endDate: '',
    status: 'Bản nháp',
    applyTo: 'Tất cả khách hàng'
  });
  
  // Menu visibility for form
  const [formTypeMenuVisible, setFormTypeMenuVisible] = useState(false);
  const [formStatusMenuVisible, setFormStatusMenuVisible] = useState(false);
  const [formApplyToMenuVisible, setFormApplyToMenuVisible] = useState(false);
  
  // Form validation errors
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // Safe check for theme
  if (!theme || !theme.colors) {
    return null;
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const activeVouchers = vouchers.filter(v => v.active).length;
    const totalUsage = vouchers.reduce((sum, v) => sum + (v.current_uses || 0), 0);
    const expiredVouchers = vouchers.filter(v => {
      if (!v.expiry_date) return false;
      return new Date(v.expiry_date) < new Date();
    }).length;
    const avgUsageRate = vouchers.length > 0 
      ? Math.round(vouchers.reduce((sum, v) => {
          const max = v.max_uses || 1;
          const current = v.current_uses || 0;
          return sum + (current / max * 100);
        }, 0) / vouchers.length)
      : 0;

    return [
      {
        title: "Voucher đang hoạt động",
        value: activeVouchers.toString(),
        change: "+2",
        icon: "🎫",
        color: "#10b981", // emerald-500 (secondary)
      },
      {
        title: "Lượt sử dụng",
        value: totalUsage.toString(),
        change: "+45",
        icon: "📊",
        color: "#3b82f6", // blue-500 (primary)
      },
      {
        title: "Voucher hết hạn",
        value: expiredVouchers.toString(),
        change: "+1",
        icon: "⏰",
        color: "#f59e0b", // amber-500
      },
      {
        title: "Tỷ lệ sử dụng TB",
        value: `${avgUsageRate}%`,
        change: "+5%",
        icon: "📈",
        color: "#8b5cf6", // violet-500 (tertiary)
      },
    ];
  }, [vouchers]);

  // Filter vouchers using useMemo for performance
  const filteredVouchers = useMemo(() => {
    return vouchers.filter(item => {
      const matchesSearch = item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (item.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                           (item.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      // Map status from API (active boolean) to display status
      const itemStatus = item.active ? 'Đang hoạt động' : 'Tạm dừng';
      const matchesStatus = selectedStatus === 'Tất cả trạng thái' || itemStatus === selectedStatus;
      
      // Map type from API (discount_type) to display type
      const itemType = item.discount_type === 'percentage' ? 'Phần trăm' : 'Số tiền cố định';
      const matchesType = selectedType === 'Tất cả loại' || itemType === selectedType;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [vouchers, searchQuery, selectedStatus, selectedType]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = () => {
    setIsRefreshing(true);
    refresh();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Đang hoạt động': return '#4CAF50';
      case 'Tạm dừng': return '#FF9800';
      case 'Hết hạn': return '#F44336';
      case 'Bản nháp': return '#9E9E9E';
      default: return theme.colors.outline;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Phần trăm': return '#E3F2FD';
      case 'Số tiền cố định': return '#E8F5E8';
      case 'Miễn phí ship': return '#FFF3E0';
      case 'Mua X tặng Y': return '#F3E5F5';
      default: return theme.colors.surfaceVariant;
    }
  };

  const getTypeTextColor = (type: string) => {
    switch (type) {
      case 'Phần trăm': return '#1976D2';
      case 'Số tiền cố định': return '#388E3C';
      case 'Miễn phí ship': return '#F57C00';
      case 'Mua X tặng Y': return '#7B1FA2';
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const handlePauseVoucher = async (voucherId: string) => {
    const voucher = vouchers.find(v => v.id === voucherId);
    if (!voucher) return;
    
    await updateVoucherMutation(voucherId, {
      active: !voucher.active
    });
    refresh();
  };

  const handleDeleteVoucher = async (voucherId: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa voucher này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            await deleteVoucherMutation(voucherId);
            refresh();
          }
        }
      ]
    );
  };

  // Form validation
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.voucherCode.trim()) {
      newErrors.voucherCode = 'Mã voucher là bắt buộc';
    }
    
    if (!formData.voucherType) {
      newErrors.voucherType = 'Loại voucher là bắt buộc';
    }
    
    if (!formData.voucherName.trim()) {
      newErrors.voucherName = 'Tên voucher là bắt buộc';
    }
    
    if (!formData.discountValue.trim()) {
      newErrors.discountValue = 'Giá trị giảm là bắt buộc';
    }
    
    if (!formData.startDate.trim()) {
      newErrors.startDate = 'Ngày bắt đầu là bắt buộc';
    }
    
    if (!formData.endDate.trim()) {
      newErrors.endDate = 'Ngày kết thúc là bắt buộc';
    }
    
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    
    if (formData.minOrder && isNaN(Number(formData.minOrder))) {
      newErrors.minOrder = 'Đơn tối thiểu phải là số';
    }
    
    if (formData.usageLimit && isNaN(Number(formData.usageLimit))) {
      newErrors.usageLimit = 'Giới hạn sử dụng phải là số';
    }
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateVoucher = async () => {
    if (!validateForm()) {
      Alert.alert('Lỗi', 'Vui lòng kiểm tra lại thông tin đã nhập');
      return;
    }

    const success = await createVoucherMutation({
      code: formData.voucherCode.toUpperCase(),
      name: formData.voucherName,
      description: formData.description,
      discount_type: formData.voucherType === 'Phần trăm' ? 'percentage' : 'fixed',
      value: Number(formData.discountValue),
      min_order_value: formData.minOrder ? Number(formData.minOrder) : undefined,
      max_uses: formData.usageLimit ? Number(formData.usageLimit) : 100,
      active: formData.status === 'Đang hoạt động',
      expiry_date: formData.endDate || undefined,
    });

    if (success) {
      resetForm();
      setShowCreateModal(false);
      refresh();
    }
  };

  const resetForm = () => {
    setFormData({
      voucherCode: '',
      voucherType: '',
      voucherName: '',
      description: '',
      discountValue: '',
      minOrder: '',
      usageLimit: '',
      startDate: '',
      endDate: '',
      status: 'Bản nháp',
      applyTo: 'Tất cả khách hàng'
    });
    setFormErrors({});
  };

  const getDisplayValue = (type: string, value: string) => {
    switch (type) {
      case 'Phần trăm':
        return `${value}%`;
      case 'Số tiền cố định':
        return `${Number(value).toLocaleString()}đ`;
      case 'Miễn phí ship':
        return 'Miễn phí';
      case 'Mua X tặng Y':
        return 'Tặng 1';
      default:
        return value;
    }
  };

  const getDiscountLabel = () => {
    switch (formData.voucherType) {
      case 'Phần trăm':
        return 'Phần trăm giảm (%)';
      case 'Số tiền cố định':
        return 'Số tiền giảm (VNĐ)';
      case 'Miễn phí ship':
        return 'Phần trăm miễn phí (%)';
      case 'Mua X tặng Y':
        return 'Mô tả quà tặng';
      default:
        return 'Giá trị giảm';
    }
  };

  const getDiscountPlaceholder = () => {
    switch (formData.voucherType) {
      case 'Phần trăm':
        return 'VD: 20';
      case 'Số tiền cố định':
        return 'VD: 50000';
      case 'Miễn phí ship':
        return 'VD: 100';
      case 'Mua X tặng Y':
        return 'VD: 1 ly nước ngọt';
      default:
        return 'Nhập giá trị';
    }
  };

  const renderStatCard = ({ item }: { item: any }) => (
    <StatCard
      title={item.title}
      value={item.value}
      icon={item.icon}
      color={item.color}
      change={item.change || '+0'}
    />
  );

  const renderVoucherItem = ({ item }: { item: any }) => {
    const usagePercentage = (item.usageCount / item.usageLimit) * 100;
    
    return (
      <Card style={[styles.voucherCard, { backgroundColor: theme.colors.surface }]} mode="outlined">
        <Card.Content style={styles.voucherContent}>
          {/* Header with code and status */}
          <View style={styles.voucherHeader}>
            <View style={styles.codeSection}>
              <Text variant="titleMedium" style={[styles.voucherCode, { color: theme.colors.primary }]}>
                {item.code}
              </Text>
              <Chip 
                mode="flat" 
                compact 
                style={[
                  styles.typeChip, 
                  { 
                    backgroundColor: getTypeColor(item.type),
                    borderColor: getTypeTextColor(item.type)
                  }
                ]}
                textStyle={{ color: getTypeTextColor(item.type), fontSize: 11 }}
              >
                {item.type}
              </Chip>
            </View>
            <View style={styles.valueSection}>
              <Text variant="titleLarge" style={[styles.discountValue, { color: theme.colors.primary }]}>
                {item.displayValue}
              </Text>
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

          {/* Voucher info */}
          <View style={styles.voucherBody}>
            <Text variant="titleMedium" style={[styles.voucherName, { color: theme.colors.onSurface }]}>
              {item.name}
            </Text>
            <Text variant="bodyMedium" style={[styles.voucherDescription, { color: theme.colors.onSurfaceVariant }]}>
              {item.description}
            </Text>
          </View>

          {/* Usage stats */}
          <View style={styles.usageSection}>
            <View style={styles.usageInfo}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Sử dụng: <Text style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                  {item.usageCount}/{item.usageLimit}
                </Text>
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Đơn tối thiểu: <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                  {item.minOrder.toLocaleString()}đ
                </Text>
              </Text>
            </View>
            <Text variant="bodySmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
              {Math.round(usagePercentage)}%
            </Text>
          </View>

          {/* Progress bar */}
          <ProgressBar 
            progress={usagePercentage / 100} 
            color={theme.colors.primary}
            style={styles.progressBar}
          />

          {/* Creator info and dates */}
          <View style={styles.metaInfo}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Người tạo: <Text style={{ fontWeight: 'bold' }}>{item.createdBy}</Text> • {item.createdAt}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Thời gian: <Text style={{ fontWeight: 'bold' }}>
                {new Date(item.startDate).toLocaleDateString('vi-VN')} - {new Date(item.endDate).toLocaleDateString('vi-VN')}
              </Text>
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Áp dụng: <Text style={{ fontWeight: 'bold' }}>{item.applyTo}</Text>
            </Text>
          </View>

          {/* Action buttons */}
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              icon="eye"
              onPress={() => console.log('Xem chi tiết:', item.id)}
              style={styles.actionButton}
              compact
            >
              Xem chi tiết
            </Button>
            <Button
              mode="contained-tonal"
              icon="pencil"
              onPress={() => console.log('Chỉnh sửa:', item.id)}
              style={styles.actionButton}
              compact
            >
              Chỉnh sửa
            </Button>
            <Button
              mode="outlined"
              icon={item.status === 'Đang hoạt động' ? 'pause' : 'play'}
              onPress={() => handlePauseVoucher(item.id)}
              style={styles.actionButton}
              compact
            >
              {item.status === 'Đang hoạt động' ? 'Tạm dừng' : 'Kích hoạt'}
            </Button>
            <Button
              mode="outlined"
              icon="delete"
              onPress={() => handleDeleteVoucher(item.id)}
              style={[styles.actionButton, { borderColor: '#ef4444' }]} // red-500
              textColor="#ef4444"
              compact
            >
              Xóa
            </Button>
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
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleSection}>
              <Text style={[styles.title, { color: theme.colors.onBackground }]}>
                Quản lý Voucher
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                Tạo và quản lý các mã giảm giá 🎫
              </Text>
            </View>
            <Button
              mode="contained"
              icon="plus"
              onPress={() => setShowCreateModal(true)}
              style={styles.createButton}
            >
              Tạo voucher mới
            </Button>
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

          {/* Search and Filter Section */}
          <View style={[styles.searchSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Tìm kiếm & Bộ lọc
            </Text>
            
            {/* Search Input */}
            <TextInput
              mode="outlined"
              label="Tìm kiếm theo mã, tên voucher..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              left={<TextInput.Icon icon="magnify" />}
              right={searchQuery ? <TextInput.Icon icon="close" onPress={() => setSearchQuery('')} /> : undefined}
            />

            {/* Filter Row */}
            <View style={styles.filterRow}>
              {/* Status Filter */}
              <View style={styles.filterItem}>
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
                  {voucherStatuses.map((status) => (
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

              {/* Type Filter */}
              <View style={styles.filterItem}>
                <Text style={[styles.filterLabel, { color: theme.colors.onSurface }]}>Loại voucher</Text>
                <Menu
                  visible={typeMenuVisible}
                  onDismiss={() => setTypeMenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setTypeMenuVisible(true)}
                      style={styles.filterButton}
                      contentStyle={styles.filterButtonContent}
                    >
                      {selectedType}
                    </Button>
                  }
                >
                  {voucherTypes.map((type) => (
                    <Menu.Item
                      key={type}
                      onPress={() => {
                        setSelectedType(type);
                        setTypeMenuVisible(false);
                      }}
                      title={type}
                    />
                  ))}
                </Menu>
              </View>
            </View>
          </View>

          {/* Vouchers List */}
          <View style={[styles.voucherListSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Danh sách voucher ({filteredVouchers.length})
            </Text>
            <FlatList
              data={filteredVouchers}
              renderItem={renderVoucherItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                    Không tìm thấy voucher nào phù hợp 🎫
                  </Text>
                </View>
              }
            />
          </View>
        </ScrollView>

        {/* Create Voucher Modal */}
        <Portal>
          <Modal
            visible={showCreateModal}
            onDismiss={() => {
              setShowCreateModal(false);
              resetForm();
            }}
            contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                  Tạo Voucher Mới
                </Text>
                <Button
                  mode="text"
                  icon="close"
                  onPress={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  style={styles.closeButton}
                >
                  Đóng
                </Button>
              </View>

              {/* Form Fields */}
              <View style={styles.formSection}>
                
                {/* Voucher Code */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.colors.onSurface }]}>
                    Mã voucher <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={formData.voucherCode}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, voucherCode: text.toUpperCase() }))}
                    placeholder="VD: WEEKEND20"
                    error={!!formErrors.voucherCode}
                    style={styles.input}
                  />
                  {formErrors.voucherCode && (
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                      {formErrors.voucherCode}
                    </Text>
                  )}
                </View>

                {/* Voucher Type */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.colors.onSurface }]}>
                    Loại voucher <Text style={styles.required}>*</Text>
                  </Text>
                  <Menu
                    visible={formTypeMenuVisible}
                    onDismiss={() => setFormTypeMenuVisible(false)}
                    anchor={
                      <TextInput
                        mode="outlined"
                        value={formData.voucherType}
                        placeholder="Chọn loại voucher"
                        editable={false}
                        right={<TextInput.Icon icon="chevron-down" onPress={() => setFormTypeMenuVisible(true)} />}
                        error={!!formErrors.voucherType}
                        style={styles.input}
                        onPressIn={() => setFormTypeMenuVisible(true)}
                      />
                    }
                  >
                    {createVoucherTypes.map((type) => (
                      <Menu.Item
                        key={type}
                        onPress={() => {
                          setFormData(prev => ({ ...prev, voucherType: type, discountValue: '' }));
                          setFormTypeMenuVisible(false);
                        }}
                        title={type}
                      />
                    ))}
                  </Menu>
                  {formErrors.voucherType && (
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                      {formErrors.voucherType}
                    </Text>
                  )}
                </View>

                {/* Voucher Name */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.colors.onSurface }]}>
                    Tên voucher <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={formData.voucherName}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, voucherName: text }))}
                    placeholder="VD: Giảm giá cuối tuần"
                    error={!!formErrors.voucherName}
                    style={styles.input}
                  />
                  {formErrors.voucherName && (
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                      {formErrors.voucherName}
                    </Text>
                  )}
                </View>

                {/* Description */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.colors.onSurface }]}>
                    Mô tả
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={formData.description}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                    placeholder="Mô tả chi tiết về voucher..."
                    multiline
                    numberOfLines={2}
                    style={styles.input}
                  />
                </View>

                {/* Discount Value */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.colors.onSurface }]}>
                    {getDiscountLabel()} <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={formData.discountValue}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, discountValue: text }))}
                    placeholder={getDiscountPlaceholder()}
                    keyboardType={formData.voucherType === 'Mua X tặng Y' ? 'default' : 'numeric'}
                    error={!!formErrors.discountValue}
                    style={styles.input}
                  />
                  {formErrors.discountValue && (
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                      {formErrors.discountValue}
                    </Text>
                  )}
                </View>

                {/* Min Order and Usage Limit Row */}
                <View style={styles.rowInputs}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
                    <Text style={[styles.label, { color: theme.colors.onSurface }]}>
                      Đơn tối thiểu (VNĐ)
                    </Text>
                    <TextInput
                      mode="outlined"
                      value={formData.minOrder}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, minOrder: text }))}
                      placeholder="200000"
                      keyboardType="numeric"
                      error={!!formErrors.minOrder}
                      style={styles.input}
                    />
                    {formErrors.minOrder && (
                      <Text style={[styles.errorText, { color: theme.colors.error }]}>
                        {formErrors.minOrder}
                      </Text>
                    )}
                  </View>

                  <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                    <Text style={[styles.label, { color: theme.colors.onSurface }]}>
                      Giới hạn sử dụng
                    </Text>
                    <TextInput
                      mode="outlined"
                      value={formData.usageLimit}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, usageLimit: text }))}
                      placeholder="100"
                      keyboardType="numeric"
                      error={!!formErrors.usageLimit}
                      style={styles.input}
                    />
                    {formErrors.usageLimit && (
                      <Text style={[styles.errorText, { color: theme.colors.error }]}>
                        {formErrors.usageLimit}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Date Row */}
                <View style={styles.rowInputs}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
                    <Text style={[styles.label, { color: theme.colors.onSurface }]}>
                      Ngày bắt đầu <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      mode="outlined"
                      value={formData.startDate}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, startDate: text }))}
                      placeholder="2024-03-15"
                      error={!!formErrors.startDate}
                      style={styles.input}
                    />
                    {formErrors.startDate && (
                      <Text style={[styles.errorText, { color: theme.colors.error }]}>
                        {formErrors.startDate}
                      </Text>
                    )}
                  </View>

                  <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                    <Text style={[styles.label, { color: theme.colors.onSurface }]}>
                      Ngày kết thúc <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      mode="outlined"
                      value={formData.endDate}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, endDate: text }))}
                      placeholder="2024-03-31"
                      error={!!formErrors.endDate}
                      style={styles.input}
                    />
                    {formErrors.endDate && (
                      <Text style={[styles.errorText, { color: theme.colors.error }]}>
                        {formErrors.endDate}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Status and Apply To Row */}
                <View style={styles.rowInputs}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
                    <Text style={[styles.label, { color: theme.colors.onSurface }]}>
                      Trạng thái
                    </Text>
                    <Menu
                      visible={formStatusMenuVisible}
                      onDismiss={() => setFormStatusMenuVisible(false)}
                      anchor={
                        <TextInput
                          mode="outlined"
                          value={formData.status}
                          editable={false}
                          right={<TextInput.Icon icon="chevron-down" onPress={() => setFormStatusMenuVisible(true)} />}
                          style={styles.input}
                          onPressIn={() => setFormStatusMenuVisible(true)}
                        />
                      }
                    >
                      {createVoucherStatuses.map((statusOption) => (
                        <Menu.Item
                          key={statusOption}
                          onPress={() => {
                            setFormData(prev => ({ ...prev, status: statusOption }));
                            setFormStatusMenuVisible(false);
                          }}
                          title={statusOption}
                        />
                      ))}
                    </Menu>
                  </View>

                  <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                    <Text style={[styles.label, { color: theme.colors.onSurface }]}>
                      Áp dụng cho
                    </Text>
                    <Menu
                      visible={formApplyToMenuVisible}
                      onDismiss={() => setFormApplyToMenuVisible(false)}
                      anchor={
                        <TextInput
                          mode="outlined"
                          value={formData.applyTo}
                          editable={false}
                          right={<TextInput.Icon icon="chevron-down" onPress={() => setFormApplyToMenuVisible(true)} />}
                          style={styles.input}
                          onPressIn={() => setFormApplyToMenuVisible(true)}
                        />
                      }
                    >
                      {applyToOptions.map((option) => (
                        <Menu.Item
                          key={option}
                          onPress={() => {
                            setFormData(prev => ({ ...prev, applyTo: option }));
                            setFormApplyToMenuVisible(false);
                          }}
                          title={option}
                        />
                      ))}
                    </Menu>
                  </View>
                </View>

              </View>

              {/* Modal Action Buttons */}
              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  style={[styles.modalActionButton, styles.cancelButton]}
                >
                  Hủy
                </Button>
                <Button
                  mode="contained"
                  onPress={handleCreateVoucher}
                  style={[styles.modalActionButton, styles.saveButton]}
                >
                  Tạo voucher
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
    marginRight: spacing.md,
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
  createButton: {
    marginTop: spacing.xs,
  },
  // Stats Grid
  statGrid: {
    paddingHorizontal: spacing.md,
    paddingTop: 0,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
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
    gap: spacing.md,
  },
  filterItem: {
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
  // Voucher List Section
  voucherListSection: {
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
  // Voucher Item Styles
  voucherCard: {
    marginBottom: spacing.md,
  },
  voucherContent: {
    padding: spacing.md,
  },
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  codeSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  voucherCode: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  typeChip: {
    height: 28,
    borderWidth: 1,
  },
  valueSection: {
    alignItems: 'flex-end',
  },
  discountValue: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  statusBadge: {
    alignSelf: 'flex-end',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: spacing.xs,
  },
  voucherBody: {
    marginBottom: spacing.md,
  },
  voucherName: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    lineHeight: 22,
  },
  voucherDescription: {
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  usageSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  usageInfo: {
    gap: spacing.xs,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: spacing.md,
  },
  metaInfo: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  actionButton: {
    borderRadius: 8,
    marginBottom: spacing.xs,
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
  formSection: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  required: {
    color: '#ef4444', // red-500
  },
  input: {
    marginBottom: spacing.xs,
  },
  errorText: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  rowInputs: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  modalActionButton: {
    flex: 1,
    borderRadius: 8,
  },
  cancelButton: {
    borderColor: '#6b7280', // gray-500
  },
  saveButton: {
    // Uses theme primary color by default
  },
});

export default VoucherScreen;