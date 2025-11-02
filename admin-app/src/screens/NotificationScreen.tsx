import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  FlatList,
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
  Modal,
  Portal,
  Snackbar
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing } from '@/theme';
import { useNotifications } from '../hooks/useNotifications';
import { useRealtimeNotifications, type RealtimeNotification } from '../hooks/useRealtimeNotifications';

// Notification types for filtering and creation

const notificationTypes = [
  "Tất cả loại",
  "Cảnh báo tồn kho",
  "Xác nhận đặt bàn",
  "Đơn hàng sẵn sàng",
  "Hệ thống",
  "Khuyến mãi",
  "Nhắc nhở"
];

const notificationStatuses = [
  "Tất cả trạng thái",
  "Đã gửi",
  "Đã lên lịch",
  "Bản nháp"
];

export const NotificationScreen = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('Tất cả loại');
  const [selectedStatus, setSelectedStatus] = useState('Tất cả trạng thái');
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Use notifications hook
  const { 
    notifications, 
    loading, 
    error, 
    fetchNotifications, 
    createNotification, 
    markAsRead, 
    deleteNotification, 
    refresh 
  } = useNotifications();

  // Real-time WebSocket integration
  const {
    onNewNotification,
  } = useRealtimeNotifications();

  // Setup real-time event listeners
  useEffect(() => {
    console.log('📡 Setting up real-time notification listeners');

    const unsubscribeNew = onNewNotification((notification: RealtimeNotification) => {
      console.log('✅ New notification:', notification.id);
      setSnackbarMessage(notification.title || 'Thông báo mới');
      setSnackbarVisible(true);
      setUnreadCount(prev => prev + 1);
      refresh();
    });

    return () => {
      console.log('🔌 Cleaning up real-time notification listeners');
      unsubscribeNew();
    };
  }, [onNewNotification, refresh]);

  // Calculate unread count
  useEffect(() => {
    const unread = notifications.filter(n => !n.is_read).length;
    setUnreadCount(unread);
  }, [notifications]);
  
  // Form state for creating new notification
  const [newNotificationForm, setNewNotificationForm] = useState({
    title: '',
    content: '',
    type: 'Cảnh báo tồn kho'
  });

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Safe check for theme
  if (!theme || !theme.colors) {
    return null;
  }

  // Filter notifications using useMemo for performance
  const filteredNotifications = useMemo(() => {
    return notifications.filter(item => {
      const matchesSearch = (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (item.content || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'Tất cả loại' || item.type === selectedType;
      // For now, assume all notifications are "sent" since API doesn't have status field
      const matchesStatus = selectedStatus === 'Tất cả trạng thái' || selectedStatus === 'Đã gửi';
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [notifications, searchQuery, selectedType, selectedStatus]);

  const onRefresh = () => {
    refresh();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Cảnh báo tồn kho': return '#FFEBEE'; // đỏ nhạt
      case 'Xác nhận đặt bàn': return '#E3F2FD'; // xanh dương nhạt
      case 'Khuyến mãi': return '#F3E5F5'; // tím nhạt
      case 'Hệ thống': return '#FAFAFA'; // xám
      case 'Nhắc nhở': return '#FFF3E0'; // cam nhạt
      case 'Đơn hàng sẵn sàng': return '#E8F5E8'; // xanh lá nhạt
      default: return '#F5F5F5';
    }
  };

  const getTypeTextColor = (type: string) => {
    switch (type) {
      case 'Cảnh báo tồn kho': return '#C62828';
      case 'Xác nhận đặt bàn': return '#1565C0';
      case 'Khuyến mãi': return '#7B1FA2';
      case 'Hệ thống': return '#424242';
      case 'Nhắc nhở': return '#E65100';
      case 'Đơn hàng sẵn sàng': return '#2E7D32';
      default: return '#616161';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Đã gửi': return '#4CAF50'; // xanh lá
      case 'Đã lên lịch': return '#FF9800'; // vàng
      case 'Bản nháp': return '#9E9E9E'; // xám nhạt
      default: return theme.colors.outline;
    }
  };

  const handleCreateNotification = async () => {
    console.log('Tạo thông báo mới:', newNotificationForm);
    
    const success = await createNotification(newNotificationForm);
    if (success) {
      setIsCreateModalVisible(false);
      setNewNotificationForm({
        title: '',
        content: '',
        type: 'Cảnh báo tồn kho'
      });
    }
  };

  const renderNotificationItem = ({ item }: { item: any }) => (
    <Card style={[styles.notificationCard, { backgroundColor: theme.colors.surface }]} mode="outlined">
      <Card.Content style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={styles.badgeRow}>
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
            <Badge 
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor('Đã gửi') }
              ]}
            >
              Đã gửi
            </Badge>
          </View>
        </View>

        <View style={styles.notificationBody}>
          <Text variant="titleMedium" style={[styles.notificationTitle, { color: theme.colors.onSurface }]}>
            {item.title || 'Không có tiêu đề'}
          </Text>
          <Text variant="bodyMedium" style={[styles.notificationContentText, { color: theme.colors.onSurfaceVariant }]}>
            {item.content || 'Không có nội dung'}
          </Text>
        </View>

        <View style={styles.notificationFooter}>
          <View style={styles.footerLeft}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Thời gian: <Text style={{ fontWeight: 'bold' }}>{new Date(item.created_at || new Date()).toLocaleString('vi-VN')}</Text>
            </Text>
          </View>
          <View style={styles.footerRight}>
            <Text variant="bodySmall" style={{ color: item.is_read ? theme.colors.primary : theme.colors.error, fontWeight: 'bold' }}>
              {item.is_read ? 'Đã đọc' : 'Chưa đọc'}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <Provider>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
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
                  Trung tâm thông báo
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                  Quản lý và theo dõi thông báo 🔔
                  {unreadCount > 0 && (
                    <Text style={{ color: theme.colors.error, fontWeight: 'bold' }}>
                      {' '}({unreadCount} chưa đọc)
                    </Text>
                  )}
                </Text>
              </View>
              <Button
                mode="contained"
                icon="plus"
                onPress={() => setIsCreateModalVisible(true)}
                style={styles.createButton}
                contentStyle={styles.createButtonContent}
              >
                Tạo mới
              </Button>
            </View>
          </View>

          {/* Search and Filter Section */}
          <View style={[styles.searchSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Tìm kiếm & Bộ lọc
            </Text>
            
            {/* Search Input */}
            <TextInput
              mode="outlined"
              label="Tìm kiếm thông báo..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              left={<TextInput.Icon icon="magnify" />}
              right={searchQuery ? <TextInput.Icon icon="close" onPress={() => setSearchQuery('')} /> : undefined}
            />

            {/* Filter Row */}
            <View style={styles.filterRow}>
              {/* Type Filter */}
              <View style={styles.filterItem}>
                <Text style={[styles.filterLabel, { color: theme.colors.onSurface }]}>Loại thông báo</Text>
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
                  {notificationTypes.map((type) => (
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
                  {notificationStatuses.map((status) => (
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
          </View>

          {/* Notifications List */}
          <View style={[styles.notificationListSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Danh sách thông báo ({filteredNotifications.length})
            </Text>
            <FlatList
              data={filteredNotifications}
              renderItem={renderNotificationItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                    Không có thông báo nào phù hợp 🔔
                  </Text>
                </View>
              }
            />
          </View>
        </ScrollView>

        {/* Create Notification Modal */}
        <Portal>
          <Modal
            visible={isCreateModalVisible}
            onDismiss={() => setIsCreateModalVisible(false)}
            contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                Tạo thông báo mới
              </Text>

              <View style={styles.formContainer}>
                <TextInput
                  label="Tiêu đề *"
                  value={newNotificationForm.title}
                  onChangeText={(text) => setNewNotificationForm(prev => ({ ...prev, title: text }))}
                  mode="outlined"
                  style={styles.formInput}
                />

                <TextInput
                  label="Nội dung *"
                  value={newNotificationForm.content}
                  onChangeText={(text) => setNewNotificationForm(prev => ({ ...prev, content: text }))}
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  style={styles.formInput}
                />

                <View style={styles.dropdownContainer}>
                  <Text style={[styles.filterLabel, { color: theme.colors.onSurface }]}>Loại thông báo *</Text>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      // Open type selection modal or use a separate dropdown
                      console.log('Select notification type');
                    }}
                    style={styles.filterButton}
                    contentStyle={styles.filterButtonContent}
                  >
                    {newNotificationForm.type}
                  </Button>
                </View>
              </View>

              <View style={styles.formActions}>
                <Button 
                  mode="outlined" 
                  onPress={() => setIsCreateModalVisible(false)}
                  style={styles.formButton}
                >
                  Hủy
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleCreateNotification}
                  style={styles.formButton}
                  disabled={!newNotificationForm.title || !newNotificationForm.content}
                >
                  Gửi
                </Button>
              </View>
            </ScrollView>
          </Modal>
        </Portal>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={4000}
          action={{
            label: 'Xem',
            onPress: () => {
              setSnackbarVisible(false);
              // Scroll to top to see new notification
            },
          }}
        >
          {snackbarMessage}
        </Snackbar>
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
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  createButton: {
    borderRadius: 8,
  },
  createButtonContent: {
    paddingVertical: spacing.xs,
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
  // Notification List Section
  notificationListSection: {
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
  // Notification Item Styles
  notificationCard: {
    marginBottom: spacing.md,
  },
  notificationContent: {
    padding: spacing.md,
  },
  notificationHeader: {
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typeChip: {
    height: 28,
    borderWidth: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  notificationBody: {
    marginBottom: spacing.md,
  },
  notificationTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    lineHeight: 22,
  },
  notificationContentText: {
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerLeft: {
    flex: 1,
  },
  footerRight: {
    alignItems: 'flex-end',
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
  dropdownContainer: {
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