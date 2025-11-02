import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Text as RNText
} from 'react-native';
import { 
  Text, 
  Card, 
  Button,
  TextInput,
  Menu,
  Badge,
  Portal,
  Modal,
  useTheme,
  IconButton,
  Snackbar,
  FAB
} from 'react-native-paper';
import { spacing } from '@/theme';
import { usersAPI as userApiInstance, User as ApiUser } from '../api/usersApi';

// Type definitions - mapping từ API sang UI
type User = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  username: string;
  role: 'customer' | 'employee' | 'admin';
  tier: 'Thường' | 'VIP' | 'Platinum';
  points: number;
  status: 'Hoạt động' | 'Đã xóa';
  created_at: string;
  last_login: string;
};

// Mapping function để convert API data sang UI format
const mapApiUserToUIUser = (apiUser: ApiUser): User => {
  if (!apiUser) {
    throw new Error('API user data is null or undefined');
  }
  
  return {
    id: apiUser.id || '',
    full_name: apiUser.full_name || '',
    email: apiUser.email || '',
    phone: apiUser.phone || '',
    username: apiUser.username || '',
    role: apiUser.role || 'customer',
    tier: apiUser.ranking === 'regular' ? 'Thường' : apiUser.ranking === 'vip' ? 'VIP' : 'Platinum',
    points: apiUser.points || 0,
    status: apiUser.deleted_at ? 'Đã xóa' : 'Hoạt động',
    created_at: apiUser.created_at ? new Date(apiUser.created_at).toLocaleDateString('vi-VN') : '',
    last_login: apiUser.updated_at ? new Date(apiUser.updated_at).toLocaleDateString('vi-VN') : ''
  };
};

const roleOptions = [
  { label: 'Tất cả vai trò', value: 'all' },
  { label: 'Khách hàng', value: 'customer' },
  { label: 'Nhân viên', value: 'employee' },
  { label: 'Quản trị', value: 'admin' }
];

console.log('📋 roleOptions defined:', roleOptions);

const tierOptions = [
  { label: 'Tất cả hạng', value: 'all' },
  { label: 'Thường', value: 'Thường' },
  { label: 'VIP', value: 'VIP' },
  { label: 'Platinum', value: 'Platinum' }
];

console.log('📋 tierOptions defined:', tierOptions);

export const UsersScreen = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [hideDeleted, setHideDeleted] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Fetch users từ API
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Fetching users...');
      console.log('📍 API Base URL:', "http://192.168.1.114:8000/api");
      
      const users = await userApiInstance.getUsers();
      console.log('📦 Raw users response:', JSON.stringify(users, null, 2));
      
      // Defensive programming - check response
      if (!users) {
        throw new Error('Users response is null or undefined');
      }
      
      if (!Array.isArray(users)) {
        throw new Error('Users response is not an array');
      }
      
      console.log('✅ Valid users response structure');
      console.log('👥 Users data:', users);
      console.log('📊 Users array length:', users.length);
      
      // Handle empty database gracefully
      if (users.length === 0) {
        console.log('📭 Database is empty - showing empty state');
        setUsers([]);
        setSnackbarMessage('Database hiện đang trống');
        setSnackbarVisible(true);
        return;
      }

      const mappedUsers = users
        .filter((user: any) => user != null) // Filter out null/undefined users
        .map((user: any, index: number) => {
          try {
            return mapApiUserToUIUser(user);
          } catch (mappingError) {
            console.error(`❌ Error mapping user at index ${index}:`, mappingError);
            console.error('🔍 Problematic user data:', user);
            return null;
          }
        })
        .filter((user: any) => user !== null) as User[]; // Remove failed mappings and cast type
      
      console.log('✅ Mapped users:', mappedUsers.length);
      setUsers(mappedUsers);
    } catch (error: any) {
      console.error('❌ Error fetching users:', error);
      
      // More detailed error message
      let errorMessage = 'Lỗi khi tải dữ liệu người dùng';
      if (error.message === 'Network Error') {
        errorMessage = '🌐 Không thể kết nối đến server.\n\n📋 Kiểm tra:\n1️⃣ Backend đã chạy chưa?\n2️⃣ Kết nối mạng\n3️⃣ URL API có đúng không?';
      } else if (error.response?.status === 404) {
        errorMessage = '🔍 API endpoint không tồn tại';
      } else if (error.response?.status === 500) {
        errorMessage = '🔥 Lỗi server nội bộ';
      } else if (error.message?.includes('undefined') || error.message?.includes('null')) {
        errorMessage = '📊 Dữ liệu từ server không hợp lệ:\n' + error.message;
      } else {
        errorMessage = `❌ ${error.message || 'Lỗi không xác định'}`;
      }
      
      showSnackbar(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Form state
  const [userForm, setUserForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    username: '',
    role: 'customer' as User['role'],
    tier: 'Thường' as User['tier'],
    status: 'Hoạt động' as User['status']
  });

  // Menu states
  const [roleMenuVisible, setRoleMenuVisible] = useState(false);
  const [tierMenuVisible, setTierMenuVisible] = useState(false);
  const [formRoleMenuVisible, setFormRoleMenuVisible] = useState(false);
  const [formTierMenuVisible, setFormTierMenuVisible] = useState(false);
  const [formStatusMenuVisible, setFormStatusMenuVisible] = useState(false);

  // Statistics
  const stats = useMemo(() => {
    const allUsers = users;
    const activeUsers = users.filter(u => u.status === 'Hoạt động');
    const customers = users.filter(u => u.role === 'customer' && u.status === 'Hoạt động');
    const employees = users.filter(u => u.role === 'employee' && u.status === 'Hoạt động');
    const admins = users.filter(u => u.role === 'admin' && u.status === 'Hoạt động');

    return {
      total: allUsers.length,
      active: activeUsers.length,
      customers: customers.length,
      employees: employees.length,
      admins: admins.length
    };
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    try {
      if (!Array.isArray(users)) {
        console.warn('Users is not an array:', users);
        return [];
      }

      return users.filter(user => {
        if (!user) {
          console.warn('Null user found in users array');
          return false;
        }

        try {
          const matchesSearch = (user.full_name?.toLowerCase()?.includes(searchQuery.toLowerCase()) || false) ||
                               (user.email?.toLowerCase()?.includes(searchQuery.toLowerCase()) || false) ||
                               (user.phone?.includes(searchQuery) || false) ||
                               (user.username?.toLowerCase()?.includes(searchQuery.toLowerCase()) || false);
          
          const matchesRole = selectedRole === 'all' || user.role === selectedRole;
          const matchesTier = selectedTier === 'all' || user.tier === selectedTier;
          const matchesStatus = !hideDeleted || user.status === 'Hoạt động';
          
          return matchesSearch && matchesRole && matchesTier && matchesStatus;
        } catch (filterError) {
          console.error('Error filtering user:', user, filterError);
          return false;
        }
      });
    } catch (error) {
      console.error('Error in filteredUsers:', error);
      return [];
    }
  }, [users, searchQuery, selectedRole, selectedTier, hideDeleted]);

  const refetch = () => {
    fetchUsers();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#ef4444';
      case 'employee': return '#3b82f6';
      case 'customer': return '#10b981';
      default: return theme.colors.outline;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return '#8b5cf6';
      case 'VIP': return '#f59e0b';
      case 'Thường': return '#6b7280';
      default: return theme.colors.outline;
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Quản trị';
      case 'employee': return 'Nhân viên';
      case 'customer': return 'Khách hàng';
      default: return role;
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleAddUser = async () => {
    if (!userForm.full_name.trim() || !userForm.email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ tên và email');
      return;
    }

    try {
      setIsLoading(true);
      const newUserData = {
        full_name: userForm.full_name.trim(),
        email: userForm.email.trim(),
        phone: userForm.phone.trim(),
        username: userForm.username.trim() || userForm.email.split('@')[0],
        password: 'defaultPassword123', // You might want to generate or ask for password
        role: userForm.role,
        ranking: userForm.tier === 'VIP' ? 'vip' as const : 
                userForm.tier === 'Platinum' ? 'platinum' as const : 'regular' as const,
      };

      const newUser = await userApiInstance.createUser(newUserData);
      const mappedUser = mapApiUserToUIUser(newUser);
      setUsers(prev => [mappedUser, ...prev]);
      resetForm();
      setShowAddModal(false);
      showSnackbar('Đã thêm người dùng mới thành công!');
    } catch (error) {
      console.error('Error creating user:', error);
      showSnackbar('Lỗi khi thêm người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    try {
      if (!user) {
        console.error('❌ User is null or undefined');
        showSnackbar('Lỗi: Thông tin người dùng không hợp lệ');
        return;
      }

      console.log('✏️ Editing user:', user);
      setEditingUser(user);
      setUserForm({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        username: user.username || '',
        role: user.role || 'customer',
        tier: user.tier || 'Thường',
        status: user.status || 'Hoạt động'
      });
      setShowAddModal(true);
    } catch (error) {
      console.error('❌ Error in handleEditUser:', error);
      showSnackbar('Lỗi khi mở form chỉnh sửa');
    }
  };

  const handleUpdateUser = async () => {
    if (!userForm.full_name.trim() || !userForm.email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ tên và email');
      return;
    }

    if (!editingUser) return;

    try {
      setIsLoading(true);
      const updateData = {
        full_name: userForm.full_name.trim(),
        email: userForm.email.trim(),
        phone: userForm.phone.trim(),
        username: userForm.username.trim(),
        role: userForm.role,
        ranking: userForm.tier === 'VIP' ? 'vip' as const : 
                userForm.tier === 'Platinum' ? 'platinum' as const : 'regular' as const,
      };

      const updatedUser = await userApiInstance.updateUser(editingUser.id, updateData);
      const mappedUpdatedUser = mapApiUserToUIUser(updatedUser);
      setUsers(prev => prev.map(user => 
        user.id === editingUser.id ? mappedUpdatedUser : user
      ));
      resetForm();
      setEditingUser(null);
      setShowAddModal(false);
      showSnackbar('Đã cập nhật thông tin người dùng!');
    } catch (error) {
      console.error('Error updating user:', error);
      showSnackbar('Lỗi khi cập nhật người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc muốn xóa người dùng này?',
      [
        { text: 'Không', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await userApiInstance.deleteUser(userId);
              setUsers(prev => prev.map(user => 
                user.id === userId 
                  ? { ...user, status: 'Đã xóa' as User['status'] }
                  : user
              ));
              showSnackbar('Đã xóa người dùng!');
            } catch (error) {
              console.error('Error deleting user:', error);
              showSnackbar('Lỗi khi xóa người dùng');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleRestoreUser = (userId: string) => {
    // Backend doesn't have restore API, so we'll just update locally
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, status: 'Hoạt động' as User['status'] }
        : user
    ));
    showSnackbar('Đã khôi phục người dùng!');
  };

  const resetForm = () => {
    setUserForm({
      full_name: '',
      email: '',
      phone: '',
      username: '',
      role: 'customer',
      tier: 'Thường',
      status: 'Hoạt động'
    });
  };

  const renderUserCard = ({ item }: { item: User }) => {
    if (!item) {
      console.warn('⚠️ Rendering null user item');
      return null;
    }

    try {
      return (
        <Card style={[
          styles.userCard, 
          { 
            backgroundColor: theme.colors.surface,
            opacity: item.status === 'Đã xóa' ? 0.6 : 1
          }
        ]} mode="outlined">
          <Card.Content style={styles.userContent}>
            {/* Header */}
            <View style={styles.userHeader}>
              <View style={styles.userInfo}>
                <Text variant="titleMedium" style={[
                  styles.userName, 
                  { 
                    color: item.status === 'Đã xóa' ? theme.colors.onSurfaceVariant : theme.colors.onSurface 
                  }
                ]}>
                  {item.full_name || 'Không có tên'}
                </Text>
                <Text variant="bodySmall" style={[
                  styles.userEmail, 
                  { color: theme.colors.onSurfaceVariant }
                ]}>
                  {item.email || 'Không có email'}
                </Text>
              </View>
              <Badge 
                style={[styles.statusBadge, { 
                  backgroundColor: item.status === 'Hoạt động' ? '#dcfce7' : '#fee2e2',
                }]}
              >
                {item.status || 'Không rõ'}
              </Badge>
            </View>

            {/* Details */}
            <View style={styles.userDetails}>
              <View style={styles.detailRow}>
                <Text variant="bodySmall" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Số điện thoại:
                </Text>
                <Text variant="bodySmall" style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                  {item.phone || 'Chưa có'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text variant="bodySmall" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Vai trò:
                </Text>
                <Badge style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role || 'customer') }]}>
                  {getRoleDisplayName(item.role || 'customer')}
                </Badge>
              </View>
              <View style={styles.detailRow}>
                <Text variant="bodySmall" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Hạng:
                </Text>
                <Badge style={[styles.tierBadge, { backgroundColor: getTierColor(item.tier || 'Thường') }]}>
                  {item.tier || 'Thường'}
                </Badge>
              </View>
              {item.role === 'customer' && (
                <View style={styles.detailRow}>
                  <Text variant="bodySmall" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Điểm:
                  </Text>
                  <Text variant="bodySmall" style={[styles.detailValue, { color: theme.colors.primary }]}>
                    {(item.points || 0).toLocaleString()} điểm
                  </Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={styles.userActions}>
              <IconButton
                icon="eye"
                size={20}
                onPress={() => {
                  try {
                    console.log('👁️ Xem chi tiết:', item.full_name);
                  } catch (error) {
                    console.error('❌ Error in view action:', error);
                  }
                }}
                style={styles.actionButton}
              />
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => handleEditUser(item)}
                style={styles.actionButton}
              />
              {item.status === 'Đã xóa' ? (
                <IconButton
                  icon="restore"
                  size={20}
                  onPress={() => {
                    try {
                      handleRestoreUser(item.id);
                    } catch (error) {
                      console.error('❌ Error in restore action:', error);
                      showSnackbar('Lỗi khi khôi phục người dùng');
                    }
                  }}
                  style={[styles.actionButton, styles.restoreButton]}
                  iconColor="white"
                />
              ) : (
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={() => {
                    try {
                      handleDeleteUser(item.id);
                    } catch (error) {
                      console.error('❌ Error in delete action:', error);
                      showSnackbar('Lỗi khi xóa người dùng');
                    }
                  }}
                  style={styles.actionButton}
                />
              )}
            </View>
          </Card.Content>
        </Card>
      );
    } catch (error) {
      console.error('❌ Error rendering user card for item:', item, error);
      return (
        <Card style={[styles.userCard, { backgroundColor: '#fee2e2' }]} mode="outlined">
          <Card.Content>
            <Text>Lỗi hiển thị thông tin người dùng</Text>
          </Card.Content>
        </Card>
      );
    }
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        Không tìm thấy người dùng nào
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
        Database hiện đang trống
      </Text>
      <Button 
        mode="contained" 
        onPress={() => setShowAddModal(true)}
        style={{ marginTop: 16 }}
      >
        Thêm người dùng đầu tiên
      </Button>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Statistics */}
      <View style={[styles.statsContainer, { backgroundColor: theme.colors.surface }]}>
        <RNText style={[styles.statsTitle, { color: theme.colors.onSurface }]}>
          Thống kê người dùng
        </RNText>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <RNText style={{ 
              fontSize: 24,
              fontWeight: 'bold',
              color: '#3b82f6'
            }}>
              {stats.total}
            </RNText>
            <RNText style={{ 
              fontSize: 14,
              color: theme.colors.onSurfaceVariant || '#666'
            }}>
              Tổng cộng
            </RNText>
          </View>
          <View style={styles.statItem}>
            <RNText style={{ 
              fontSize: 24,
              fontWeight: 'bold',
              color: '#10b981'
            }}>
              {stats.customers}
            </RNText>
            <RNText style={{ 
              fontSize: 14,
              color: theme.colors.onSurfaceVariant || '#666'
            }}>
              Khách hàng
            </RNText>
          </View>
          <View style={styles.statItem}>
            <RNText style={{ 
              fontSize: 24,
              fontWeight: 'bold',
              color: '#3b82f6'
            }}>
              {stats.employees}
            </RNText>
            <RNText style={{ 
              fontSize: 14,
              color: theme.colors.onSurfaceVariant || '#666'
            }}>
              Nhân viên
            </RNText>
          </View>
          <View style={styles.statItem}>
            <RNText style={{ 
              fontSize: 24,
              fontWeight: 'bold',
              color: '#ef4444'
            }}>
              {stats.admins}
            </RNText>
            <RNText style={{ 
              fontSize: 14,
              color: theme.colors.onSurfaceVariant || '#666'
            }}>
              Quản trị
            </RNText>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Tìm kiếm theo tên, email, số điện thoại..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchInput, { 
            backgroundColor: theme.colors.surface,
            color: theme.colors.onSurface
          }]}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          left={<TextInput.Icon icon="magnify" />}
          mode="outlined"
        />
      </View>
      
      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filtersRow}>
          {/* Role Filter */}
          <Menu
            visible={roleMenuVisible}
            onDismiss={() => setRoleMenuVisible(false)}
            anchor={
              <Button 
                mode="outlined" 
                onPress={() => {
                  try {
                    console.log('👤 Opening role menu - START');
                    console.log('👤 Current selectedRole:', selectedRole);
                    console.log('👥 Current users array length:', users?.length || 'undefined');
                    console.log('🔍 Current filteredUsers length:', filteredUsers?.length || 'undefined');
                    console.log('🎛️ About to set roleMenuVisible to true');
                    setRoleMenuVisible(true);
                    console.log('✅ Role menu opened successfully');
                  } catch (error) {
                    console.error('❌ Error opening role menu:', error);
                    console.error('🔍 Error context:', {
                      selectedRole,
                      usersLength: users?.length,
                      filteredUsersLength: filteredUsers?.length,
                      roleMenuVisible
                    });
                  }
                }}
                style={styles.filterButton}
                compact
              >
                {(() => {
                  const found = roleOptions.find(r => r.value === selectedRole);
                  console.log('🔍 Role button text lookup:', {
                    selectedRole,
                    found,
                    roleOptions: roleOptions.map(r => r.value)
                  });
                  return found?.label || 'Tất cả vai trò';
                })()}
              </Button>
            }
          >
            {roleOptions.map((option) => {
              console.log('🎯 Rendering role option:', option);
              return (
                <Menu.Item 
                  key={option.value}
                  onPress={() => {
                    try {
                      console.log('👤 Selecting role:', option.value, 'from:', selectedRole);
                      console.log('🔧 Role option object:', option);
                      setSelectedRole(option.value);
                      setRoleMenuVisible(false);
                      console.log('✅ Role selected successfully');
                    } catch (error) {
                      console.error('❌ Error selecting role:', error);
                      console.error('🔍 Error details:', {
                        optionValue: option.value,
                        selectedRole,
                        errorMessage: error instanceof Error ? error.message : String(error),
                        errorStack: error instanceof Error ? error.stack : 'No stack trace'
                      });
                      showSnackbar('Lỗi khi chọn vai trò');
                    }
                  }} 
                  title={option.label}
                />
              );
            })}
          </Menu>

          {/* Tier Filter */}
          <Menu
            visible={tierMenuVisible}
            onDismiss={() => setTierMenuVisible(false)}
            anchor={
              <Button 
                mode="outlined" 
                onPress={() => {
                  try {
                    console.log('🏷️ Opening tier menu, current selectedTier:', selectedTier);
                    setTierMenuVisible(true);
                  } catch (error) {
                    console.error('❌ Error opening tier menu:', error);
                  }
                }}
                style={styles.filterButton}
                compact
              >
                {tierOptions.find(t => t.value === selectedTier)?.label || 'Tất cả hạng'}
              </Button>
            }
          >
            {tierOptions.map((option) => (
              <Menu.Item 
                key={option.value}
                onPress={() => {
                  try {
                    console.log('🏷️ Selecting tier:', option.value, 'from:', selectedTier);
                    setSelectedTier(option.value);
                    setTierMenuVisible(false);
                    console.log('✅ Tier selected successfully');
                  } catch (error) {
                    console.error('❌ Error selecting tier:', error);
                    showSnackbar('Lỗi khi chọn hạng');
                  }
                }} 
                title={option.label}
              />
            ))}
          </Menu>

          {/* Hide Deleted Toggle */}
          <Button
            mode={hideDeleted ? "contained" : "outlined"}
            onPress={() => setHideDeleted(!hideDeleted)}
            style={[styles.filterButton, { 
              backgroundColor: hideDeleted ? '#10b981' : 'transparent' 
            }]}
            textColor={hideDeleted ? 'white' : theme.colors.primary}
            compact
          >
            {hideDeleted ? 'Ẩn đã xóa' : 'Hiện tất cả'}
          </Button>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={filteredUsers}
        renderItem={renderUserCard}
        keyExtractor={(item, index) => {
          try {
            return item?.id?.toString() || `user-${index}`;
          } catch (error) {
            console.error('❌ Error in keyExtractor:', error);
            return `error-${index}`;
          }
        }}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={[theme.colors.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB Add User */}
      <FAB
        icon="account-plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          resetForm();
          setEditingUser(null);
          setShowAddModal(true);
        }}
        label="Thêm người dùng"
      />

      {/* Add/Edit User Modal */}
      <Portal>
        <Modal 
          visible={showAddModal} 
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleLarge" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            {editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
          </Text>
          
          <TextInput
            label="Họ và tên *"
            value={userForm.full_name}
            onChangeText={(text) => setUserForm(prev => ({ ...prev, full_name: text }))}
            style={styles.input}
            mode="outlined"
          />
          
          <TextInput
            label="Email *"
            value={userForm.email}
            onChangeText={(text) => setUserForm(prev => ({ ...prev, email: text }))}
            style={styles.input}
            mode="outlined"
            keyboardType="email-address"
          />
          
          <TextInput
            label="Số điện thoại"
            value={userForm.phone}
            onChangeText={(text) => setUserForm(prev => ({ ...prev, phone: text }))}
            style={styles.input}
            mode="outlined"
            keyboardType="phone-pad"
          />
          
          <TextInput
            label="Tên đăng nhập"
            value={userForm.username}
            onChangeText={(text) => setUserForm(prev => ({ ...prev, username: text }))}
            style={styles.input}
            mode="outlined"
          />

          {/* Role Selection */}
          <Menu
            visible={formRoleMenuVisible}
            onDismiss={() => setFormRoleMenuVisible(false)}
            anchor={
              <Button 
                mode="outlined" 
                onPress={() => setFormRoleMenuVisible(true)}
                style={styles.menuButton}
              >
                Vai trò: {getRoleDisplayName(userForm.role)}
              </Button>
            }
          >
            <Menu.Item onPress={() => { setUserForm(prev => ({ ...prev, role: 'customer' })); setFormRoleMenuVisible(false); }} title="Khách hàng" />
            <Menu.Item onPress={() => { setUserForm(prev => ({ ...prev, role: 'employee' })); setFormRoleMenuVisible(false); }} title="Nhân viên" />
            <Menu.Item onPress={() => { setUserForm(prev => ({ ...prev, role: 'admin' })); setFormRoleMenuVisible(false); }} title="Quản trị" />
          </Menu>

          {/* Tier Selection */}
          <Menu
            visible={formTierMenuVisible}
            onDismiss={() => setFormTierMenuVisible(false)}
            anchor={
              <Button 
                mode="outlined" 
                onPress={() => setFormTierMenuVisible(true)}
                style={styles.menuButton}
              >
                Hạng: {userForm.tier}
              </Button>
            }
          >
            <Menu.Item onPress={() => { setUserForm(prev => ({ ...prev, tier: 'Thường' })); setFormTierMenuVisible(false); }} title="Thường" />
            <Menu.Item onPress={() => { setUserForm(prev => ({ ...prev, tier: 'VIP' })); setFormTierMenuVisible(false); }} title="VIP" />
            <Menu.Item onPress={() => { setUserForm(prev => ({ ...prev, tier: 'Platinum' })); setFormTierMenuVisible(false); }} title="Platinum" />
          </Menu>

          {/* Status Selection */}
          <Menu
            visible={formStatusMenuVisible}
            onDismiss={() => setFormStatusMenuVisible(false)}
            anchor={
              <Button 
                mode="outlined" 
                onPress={() => setFormStatusMenuVisible(true)}
                style={styles.menuButton}
              >
                Trạng thái: {userForm.status}
              </Button>
            }
          >
            <Menu.Item onPress={() => { setUserForm(prev => ({ ...prev, status: 'Hoạt động' })); setFormStatusMenuVisible(false); }} title="Hoạt động" />
            <Menu.Item onPress={() => { setUserForm(prev => ({ ...prev, status: 'Đã xóa' })); setFormStatusMenuVisible(false); }} title="Đã xóa" />
          </Menu>

          <View style={styles.modalActions}>
            <Button 
              mode="outlined" 
              onPress={() => setShowAddModal(false)}
              style={styles.cancelButton}
            >
              Hủy
            </Button>
            <Button 
              mode="contained" 
              onPress={editingUser ? handleUpdateUser : handleAddUser}
              style={[styles.confirmButton, { backgroundColor: theme.colors.primary }]}
            >
              {editingUser ? 'Cập nhật' : 'Thêm'}
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'Đóng',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  statsContainer: {
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  searchContainer: {
    marginBottom: spacing.md,
  },
  searchInput: {
    fontSize: 16,
  },
  filtersContainer: {
    marginBottom: spacing.md,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterButton: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100, // Space for FAB
  },
  userCard: {
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  userContent: {
    padding: spacing.md,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  userInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  userName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    opacity: 0.7,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userDetails: {
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  detailLabel: {
    fontWeight: '500',
  },
  detailValue: {
    fontWeight: '400',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actionButton: {
    margin: 0,
    marginLeft: spacing.xs,
  },
  restoreButton: {
    backgroundColor: '#10b981',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  fab: {
    position: 'absolute',
    margin: spacing.lg,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    padding: spacing.lg,
    margin: spacing.lg,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  input: {
    marginBottom: spacing.md,
  },
  menuButton: {
    marginBottom: spacing.md,
    justifyContent: 'flex-start',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 0.45,
  },
  confirmButton: {
    flex: 0.45,
  },
});

export default UsersScreen;
