import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  FlatList,
  RefreshControl,
  Alert,
  Dimensions,
  TouchableOpacity,
  Platform
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
  Switch,
  Snackbar
} from 'react-native-paper';
import { spacing } from '@/theme';
import { StatCard } from '@/components';
import { useReservations, CreateReservationRequest, Reservation } from '@/hooks/useReservations';
import { useReservationSocket } from '@/hooks';

// Helper function to transform API reservation to display format
const transformReservation = (reservation: Reservation) => {
  const preferences = reservation.preferences as any || {};
  return {
    ...reservation,
    customerName: preferences.customerName || `User ${reservation.user_id?.slice(0, 8)}` || 'Unknown',
    customerPhone: preferences.customerPhone || '',
    customerEmail: preferences.customerEmail || '',
    date: reservation.reservation_time?.split('T')[0] || '',
    time: reservation.reservation_time?.split('T')[1]?.substring(0, 5) || '',
    tableNumber: reservation.table_id ? `Table ${reservation.table_id}` : '',
    notes: preferences.notes || '',
    specialRequests: preferences.specialRequests || '',
  };
};

// Table interface for mock data
interface Table {
  id: string;
  table_number: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  capacity: number;
  location: string;
}

// Date/Time helper functions
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const formatTime = (date: Date): string => {
  return date.toTimeString().slice(0, 5);
};

// Format datetime for better UX
const formatReservationDateTime = (dateStr: string, timeStr: string): string => {
  if (!dateStr || !timeStr) return 'Chưa có thông tin';
  
  try {
    const date = new Date(`${dateStr}T${timeStr}`);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const reservationDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Check if today, tomorrow, or show full date
    let dayText = '';
    if (reservationDate.getTime() === today.getTime()) {
      dayText = 'Hôm nay';
    } else if (reservationDate.getTime() === tomorrow.getTime()) {
      dayText = 'Ngày mai';
    } else {
      // Format: Thứ X, DD/MM/YYYY
      const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const weekday = weekdays[date.getDay()];
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      dayText = `${weekday}, ${day}/${month}/${year}`;
    }
    
    // Format time
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const timeText = `${hours}:${minutes}`;
    
    return `${dayText} • ${timeText}`;
  } catch (error) {
    return `${dateStr} - ${timeStr}`;
  }
};

const mapStatusToVietnamese = (status: string): string => {
  switch (status) {
    case 'pending': return 'Chờ xác nhận';
    case 'confirmed': return 'Đã xác nhận';
    case 'cancelled': return 'Đã hủy';
    case 'no_show': return 'Không đến';
    default: return status;
  }
};

const mapStatusToEnglish = (status: string): 'pending' | 'confirmed' | 'cancelled' | 'no_show' => {
  switch (status) {
    case 'Chờ xác nhận': return 'pending';
    case 'Đã xác nhận': return 'confirmed';
    case 'Đã hủy': return 'cancelled';
    case 'Không đến': return 'no_show';
    default: return 'pending';
  }
};

const screenWidth = Dimensions.get('window').width;

const statusOptions = [
  "Tất cả trạng thái",
  "Chờ xác nhận", 
  "Đã xác nhận",
  "Đã nhận bàn",
  "Hoàn thành",
  "Đã hủy",
  "Không đến"
];

const tableStatusOptions = ["Tất cả bàn", "Trống", "Có khách", "Đã đặt", "Bảo trì"];

export const ReservationScreen = () => {
  const theme = useTheme();
  
  // Use API hooks
  const {
    reservations,
    loading: reservationsLoading,
    error: reservationsError,
    total: reservationsTotal,
    fetchReservations,
    createNewReservation,
    updateStatus,
    deleteReservationById,
    refresh: refreshReservations,
  } = useReservations();

  // Real-time WebSocket integration (new namespace-based)
  const {
    onReservationCreated,
    onReservationUpdated,
    onReservationConfirmed,
    onReservationCancelled,
    onTableAssigned,
    onCustomerArrived,
    isConnected: socketConnected,
  } = useReservationSocket();

  // Snackbar state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Setup real-time event listeners
  useEffect(() => {
    console.log('📡 Setting up real-time reservation listeners (namespace-based)');

    onReservationCreated((reservation: any) => {
      console.log('✅ New reservation created:', reservation.id);
      setSnackbarMessage(`Đặt bàn mới #${reservation.id}`);
      setSnackbarVisible(true);
      refreshReservations();
    });

    onReservationUpdated(({ reservation }: { reservation: any; changes?: any }) => {
      console.log('✅ Reservation updated:', reservation.id);
      refreshReservations();
    });

    onReservationConfirmed(({ reservationId }: { reservationId: string; confirmedAt: string }) => {
      console.log('✅ Reservation confirmed:', reservationId);
      setSnackbarMessage(`Đặt bàn #${reservationId} đã xác nhận`);
      setSnackbarVisible(true);
      refreshReservations();
    });

    onReservationCancelled(({ reservationId, reason }: { reservationId: string; reason?: string }) => {
      console.log('❌ Reservation cancelled:', reservationId, reason);
      setSnackbarMessage(`Đặt bàn #${reservationId} đã hủy`);
      setSnackbarVisible(true);
      refreshReservations();
    });

    onTableAssigned(({ reservationId, tableId, tableName }: { reservationId: string; tableId: string; tableName: string }) => {
      console.log('🪑 Table assigned:', reservationId, tableName);
      setSnackbarMessage(`Bàn ${tableName} đã được gán cho đặt bàn #${reservationId}`);
      setSnackbarVisible(true);
      refreshReservations();
    });

    onCustomerArrived(({ reservationId }: { reservationId: string; arrivedAt: string }) => {
      console.log('👋 Customer arrived:', reservationId);
      setSnackbarMessage(`Khách hàng đã đến - Đặt bàn #${reservationId}`);
      setSnackbarVisible(true);
      refreshReservations();
    });

    // Cleanup is automatic in useReservationSocket hook
    return () => {
      console.log('🔌 Cleaning up real-time reservation listeners');
    };
  }, [refreshReservations]);

  // Transform API data for UI
  const transformedReservations = useMemo(() => {
    return reservations.map(transformReservation);
  }, [reservations]);

  // Tables data will be implemented later when useTables hook is created
  const tables: any[] = [];
  const tablesLoading = false;
  const tablesError = null;
  const tablesTotal = 0;
  const fetchTables = () => console.log('fetchTables not implemented');
  const updateTableStatusById = () => console.log('updateTableStatusById not implemented');

  // Local state
  const [activeTab, setActiveTab] = useState('reservations');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Tất cả trạng thái');
  const [selectedTableStatus, setSelectedTableStatus] = useState('Tất cả bàn');
  const [selectedDate, setSelectedDate] = useState('');
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [tableStatusMenuVisible, setTableStatusMenuVisible] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [tableDropdownVisible, setTableDropdownVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Add reservation form state
  const [newReservationForm, setNewReservationForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    date: '',
    time: '19:00',
    partySize: '2',
    tableNumber: '',
    notes: '',
    specialRequests: ''
  });

  // Load data on mount
  useEffect(() => {
    console.log('🚀 ReservationScreen: Loading initial data...');
    console.log('🔧 Hooks available:', { 
      fetchReservations: !!fetchReservations, 
      fetchTables: !!fetchTables 
    });
    fetchReservations();
    fetchTables();
  }, []); // Empty dependency - only run once on mount



  // Safe check for theme
  if (!theme || !theme.colors) {
    return null;
  }

  // Calculate statistics using useMemo for performance
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const safeReservations = transformedReservations || [];
    const safeTables = tables || [];
    
    const totalReservations = safeReservations.length;
    const pendingReservations = safeReservations.filter((r: any) => r.status === 'pending').length;
    const confirmedReservations = safeReservations.filter((r: any) => r.status === 'confirmed').length;
    const todayReservations = safeReservations.filter((r: any) => r.date === today).length;
    const emptyTables = safeTables.filter((t: Table) => t.status === 'available').length;

    return [
      {
        title: "Tổng đặt bàn",
        value: totalReservations.toString(),
        change: "+3",
        icon: "📅",
        color: "#3b82f6", // primary
      },
      {
        title: "Chờ xác nhận",
        value: pendingReservations.toString(),
        change: "+1",
        icon: "⏳",
        color: "#f59e0b", // amber
      },
      {
        title: "Đã xác nhận",
        value: confirmedReservations.toString(),
        change: "+2",
        icon: "✅",
        color: "#10b981", // secondary
      },
      {
        title: "Hôm nay",
        value: todayReservations.toString(),
        change: "+1",
        icon: "🗓️",
        color: "#8b5cf6", // tertiary
      },
      {
        title: "Bàn trống",
        value: emptyTables.toString(),
        change: "-2",
        icon: "🪑",
        color: "#10b981", // secondary
      },
    ];
  }, [reservations, tables]);

  // Filter reservations using useMemo for performance
  const filteredReservations = useMemo(() => {
    if (!transformedReservations || !Array.isArray(transformedReservations)) {
      return [];
    }
    return transformedReservations.filter((item: any) => {
      const matchesSearch = (item.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (item.customerPhone || '').includes(searchQuery) ||
                           (item.customerEmail && item.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = selectedStatus === 'Tất cả trạng thái' || mapStatusToVietnamese(item.status || '') === selectedStatus;
      const matchesDate = !selectedDate || item.date === selectedDate;
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [transformedReservations, searchQuery, selectedStatus, selectedDate]);

  // Table status mapping
  const mapTableStatusToVietnamese = (status: string) => {
    switch(status) {
      case 'available': return 'Trống';
      case 'occupied': return 'Có khách';
      case 'reserved': return 'Đã đặt';
      case 'maintenance': return 'Bảo trì';
      default: return status;
    }
  };

  const mapTableStatusToEnglish = (status: string) => {
    switch(status) {
      case 'Trống': return 'available';
      case 'Có khách': return 'occupied';
      case 'Đã đặt': return 'reserved';
      case 'Bảo trì': return 'maintenance';
      default: return status;
    }
  };

  // Filter tables
  const filteredTables = useMemo(() => {
    if (!tables || !Array.isArray(tables)) {
      return [];
    }
    return tables.filter((table: Table) => {
      if (selectedTableStatus === 'Tất cả bàn') return true;
      return mapTableStatusToVietnamese(table.status) === selectedTableStatus;
    });
  }, [tables, selectedTableStatus]);

  // Debug data state - minimal logging only on success
  useEffect(() => {
    if (!reservationsLoading && reservations && reservations.length > 0) {
      console.log('📊 Reservations count:', reservations.length);
    }
  }, [reservations, reservationsLoading]);

  useEffect(() => {
    if (!tablesLoading && tables && tables.length > 0) {
      console.log('🏪 Tables count:', tables.length);
    }
  }, [tables, tablesLoading, tablesError, filteredTables]);

  const onRefresh = () => {
    fetchReservations();
    fetchTables();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Chờ xác nhận': return '#f59e0b'; // amber-500
      case 'Đã xác nhận': return '#3b82f6'; // blue-500 (primary)
      case 'Đã nhận bàn': return '#10b981'; // emerald-500 (secondary)
      case 'Hoàn thành': return '#10b981'; // emerald-500 (secondary)
      case 'Đã hủy': return '#ef4444'; // red-500 (error)
      case 'Không đến': return '#6b7280'; // gray-500
      default: return theme.colors.outline;
    }
  };

  const getTableStatusColor = (status: string) => {
    switch (status) {
      case 'Trống': return '#10b981'; // emerald-500 (secondary)
      case 'Có khách': return '#ef4444'; // red-500 (error)
      case 'Đã đặt': return '#3b82f6'; // blue-500 (primary)
      case 'Bảo trì': return '#6b7280'; // gray-500
      default: return theme.colors.outline;
    }
  };

  const handleAddReservation = async () => {
    console.log('🚀 handleAddReservation called');
    console.log('Form data:', newReservationForm);
    
    if (!newReservationForm?.customerName?.trim() || !newReservationForm?.customerPhone?.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên khách hàng và số điện thoại');
      return;
    }

    try {
      console.log('🔍 Raw form state:', newReservationForm);
      console.log('🔍 Form state type:', typeof newReservationForm);
      console.log('🔍 Form is null/undefined:', newReservationForm == null);
      
      // Extreme safety check
      if (!newReservationForm || typeof newReservationForm !== 'object') {
        throw new Error('Form state is invalid');
      }
      
      console.log('🔍 Individual field checks:', {
        date: {
          value: newReservationForm.date,
          type: typeof newReservationForm.date,
          isString: typeof newReservationForm.date === 'string',
          hasValue: !!newReservationForm.date
        },
        time: {
          value: newReservationForm.time,
          type: typeof newReservationForm.time,
          isString: typeof newReservationForm.time === 'string',
          hasValue: !!newReservationForm.time
        }
      });
      
      // Ultra safe date/time processing
      let date: string;
      let time: string;
      
      try {
        // Generate default date safely
        const now = new Date();
        const defaultDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        // Process date
        if (newReservationForm.date && 
            typeof newReservationForm.date === 'string' && 
            newReservationForm.date.trim().length > 0) {
          date = newReservationForm.date.trim();
        } else {
          date = defaultDate;
          console.log('📅 Using default date:', date);
        }
        
        // Process time  
        if (newReservationForm.time && 
            typeof newReservationForm.time === 'string' && 
            newReservationForm.time.trim().length > 0) {
          time = newReservationForm.time.trim();
        } else {
          time = '19:00';
          console.log('⏰ Using default time:', time);
        }
        
        console.log('📅 Final processed values:', { date, time });
        
        // Validate formats
        if (!date || typeof date !== 'string' || !date.includes('-')) {
          throw new Error(`Invalid date format: ${date}`);
        }
        if (!time || typeof time !== 'string' || !time.includes(':')) {
          throw new Error(`Invalid time format: ${time}`);
        }
        
      } catch (dateError) {
        console.error('❌ Date processing error:', dateError);
        throw new Error('Lỗi xử lý ngày/giờ: ' + (dateError as Error).message);
      }
      
      const reservationTime = `${date}T${time}:00.000Z`;
      
      const reservationData: CreateReservationRequest = {
        table_id: newReservationForm.tableNumber || '1', // Default to table 1 if not specified
        reservation_time: reservationTime,
        num_people: parseInt(newReservationForm.partySize || '2') || 2,
        duration_minutes: 120, // Default 2 hours
        preferences: {
          customerName: (newReservationForm.customerName || '').trim(),
          customerPhone: (newReservationForm.customerPhone || '').trim(),
          customerEmail: (newReservationForm.customerEmail || '').trim() || undefined,
          notes: (newReservationForm.notes || '').trim() || undefined,
          specialRequests: (newReservationForm.specialRequests || '').trim() || undefined,
        },
        status: 'pending',
      };

      console.log('📤 Sending reservation data:', reservationData);
      await createNewReservation(reservationData);
      
      // Reset form
      setNewReservationForm({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        date: '',
        time: '19:00',
        partySize: '2',
        tableNumber: '',
        notes: '',
        specialRequests: ''
      });
      setShowAddForm(false);
      setShowAddModal(false);
      Alert.alert('Thành công', 'Đã tạo đặt bàn mới!');
    } catch (error) {
      console.error('❌ Error in handleAddReservation:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi tạo đặt bàn: ' + (error as Error).message);
    }
  };

  const handleUpdateReservationStatus = async (reservationId: string, newStatus: string) => {
    try {
      const englishStatus = mapStatusToEnglish(newStatus);
      await updateStatus(reservationId, englishStatus);
    } catch (error) {
      // Error already handled by hook
    }
  };

  const handleDeleteReservation = (reservationId: string) => {
    Alert.alert(
      'Xác nhận hủy',
      'Bạn có chắc muốn hủy đặt bàn này?',
      [
        { text: 'Không', style: 'cancel' },
        { 
          text: 'Hủy đặt bàn', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReservationById(reservationId);
            } catch (error) {
              // Error already handled by hook
            }
          }
        }
      ]
    );
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

  const renderReservationItem = ({ item }: { item: any }) => (
    <Card style={[styles.reservationCard, { backgroundColor: theme.colors.surface }]} mode="outlined">
      <Card.Content style={styles.reservationContent}>
        {/* Header */}
        <View style={styles.reservationHeader}>
          <View style={styles.customerInfo}>
            <Text variant="titleMedium" style={[styles.customerName, { color: theme.colors.onSurface }]}>
              {item.customerName}
            </Text>
            <Text variant="bodySmall" style={[styles.customerContact, { color: theme.colors.onSurfaceVariant }]}>
              {item.customerPhone}
            </Text>
          </View>
          <Badge 
            style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status || '') }]}
          >
            {item.status}
          </Badge>
        </View>

        {/* Details */}
        <View style={styles.reservationDetails}>
          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
              📅 Thời gian:
            </Text>
            <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.onSurface, fontWeight: '600' }]}>
              {formatReservationDateTime(item.date, item.time)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
              Số người:
            </Text>
            <Text variant="bodySmall" style={[styles.detailValue, { color: theme.colors.onSurface }]}>
              {item.partySize} người
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
              Bàn:
            </Text>
            <Text variant="bodySmall" style={[styles.detailValue, { color: theme.colors.primary }]}>
              {item.tableNumber}
            </Text>
          </View>
          {item.notes && (
            <View style={styles.notesRow}>
              <Text variant="bodySmall" style={[styles.notesText, { color: theme.colors.onSurfaceVariant }]}>
                Ghi chú: {item.notes}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.reservationActions}>
          <IconButton
            icon="eye"
            size={20}
            onPress={() => console.log('Xem chi tiết:', item.customerName)}
            style={styles.actionButton}
          />
          <IconButton
            icon="pencil"
            size={20}
            onPress={() => console.log('Chỉnh sửa:', item.customerName)}
            style={styles.actionButton}
          />
          <IconButton
            icon="delete"
            size={20}
            onPress={() => handleDeleteReservation(item.id || '')}
            style={styles.actionButton}
          />
          {item.status === 'pending' && (
            <IconButton
              icon="check"
              size={20}
              onPress={() => handleUpdateReservationStatus(item.id || '', 'Đã xác nhận')}
              style={[styles.actionButton, styles.confirmButton]}
              iconColor="white"
            />
          )}
          {item.status === 'confirmed' && (
            <IconButton
              icon="account-check"
              size={20}
              onPress={() => handleUpdateReservationStatus(item.id || '', 'Đang phục vụ')}
              style={[styles.actionButton, { backgroundColor: '#10b981' }]}
              iconColor="white"
            />
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const renderTableItem = ({ item }: { item: Table }) => (
    <Card style={[styles.tableCard, { backgroundColor: theme.colors.surface }]} mode="outlined">
      <Card.Content style={styles.tableContent}>
        <View style={styles.tableHeader}>
          <Text variant="titleMedium" style={[styles.tableName, { color: theme.colors.onSurface }]}>
            Bàn {item.table_number}
          </Text>
          <Badge 
            style={[styles.tableStatusBadge, { backgroundColor: getTableStatusColor(mapTableStatusToVietnamese(item.status)) }]}
          >
            {mapTableStatusToVietnamese(item.status)}
          </Badge>
        </View>
        
        <Text variant="bodySmall" style={[styles.tableCapacity, { color: theme.colors.onSurfaceVariant }]}>
          {item.capacity} người
        </Text>
        
        <Text variant="bodySmall" style={[styles.tableDeposit, { color: theme.colors.onSurfaceVariant }]}>
          Đặt cọc: {(item as any).deposit?.toLocaleString() || 0} VND
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <Provider>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* WebSocket Connection Status */}
        <View style={styles.socketStatus}>
          <View style={[styles.socketIndicator, { backgroundColor: socketConnected ? '#10b981' : '#ef4444' }]} />
          <Text style={styles.socketText}>
            {socketConnected ? '🟢 Real-time' : '🔴 Offline'}
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={reservationsLoading || tablesLoading}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.onBackground }]}>
              Quản lý Đặt bàn
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Quản lý đặt bàn và sơ đồ nhà hàng 🍽️
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
          <View style={[styles.tabSection, { backgroundColor: theme.colors.surface }]}>
            <SegmentedButtons
              value={activeTab}
              onValueChange={setActiveTab}
              buttons={[
                { value: 'reservations', label: 'Danh sách đặt bàn', icon: 'calendar-check' },
                { value: 'tables', label: 'Sơ đồ bàn', icon: 'table-furniture' },
                { value: 'layout', label: 'Bố trí sàn', icon: 'floor-plan' }
              ]}
              style={styles.tabButtons}
            />
          </View>

          {activeTab === 'reservations' && (
            <View>
              {/* Search and Filter Section */}
              <View style={[styles.filterSection, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                  Tìm kiếm và lọc
                </Text>
                
                {/* Search Input */}
                <TextInput
                  mode="outlined"
                  label="Tìm kiếm đặt bàn..."
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
                      {statusOptions.map((status) => (
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

                  {/* Date Filter */}
                  <View style={styles.filterItem}>
                    <Text style={[styles.filterLabel, { color: theme.colors.onSurface }]}>Ngày đặt</Text>
                    <Button
                      mode="outlined"
                      onPress={() => setShowDatePicker(true)}
                      style={styles.dateButton}
                      contentStyle={styles.dateButtonContent}
                      icon="calendar"
                    >
                      {selectedDate || new Date().toLocaleDateString('vi-VN', { 
                        day: '2-digit',
                        month: '2-digit', 
                        year: 'numeric'
                      })}
                    </Button>
                    {selectedDate && (
                      <IconButton
                        icon="close"
                        size={16}
                        onPress={() => setSelectedDate('')}
                        style={styles.clearDateButton}
                      />
                    )}
                  </View>
                </View>

                {/* Add New Button */}
                <Button
                  mode="contained"
                  icon="plus"
                  onPress={() => setShowAddModal(true)}
                  style={styles.addButton}
                >
                  Đặt bàn mới
                </Button>
              </View>

              {/* Reservations List */}
              <View style={[styles.itemsListSection, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                  Danh sách đặt bàn ({filteredReservations.length})
                </Text>
                <FlatList
                  key="reservations-list"
                  data={filteredReservations}
                  renderItem={renderReservationItem}
                  keyExtractor={(item) => (item.id || Math.random()).toString()}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                        Không tìm thấy đặt bàn nào phù hợp 📅
                      </Text>
                    </View>
                  }
                />
              </View>
            </View>
          )}

          {activeTab === 'tables' && (
            <View>
              {/* Tables Filter */}
              <View style={[styles.filterSection, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                  Lọc theo trạng thái bàn
                </Text>
                
                <Menu
                  visible={tableStatusMenuVisible}
                  onDismiss={() => setTableStatusMenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setTableStatusMenuVisible(true)}
                      style={styles.filterButton}
                      contentStyle={styles.filterButtonContent}
                    >
                      {selectedTableStatus}
                    </Button>
                  }
                >
                  {tableStatusOptions.map((status) => (
                    <Menu.Item
                      key={status}
                      onPress={() => {
                        setSelectedTableStatus(status);
                        setTableStatusMenuVisible(false);
                      }}
                      title={status}
                    />
                  ))}
                </Menu>
              </View>

              {/* Tables Grid */}
              <View style={[styles.tablesListSection, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                  Sơ đồ bàn ({filteredTables.length})
                </Text>
                <FlatList
                  key="tables-grid"
                  data={filteredTables}
                  renderItem={renderTableItem}
                  keyExtractor={(item) => (item.id || Math.random()).toString()}
                  numColumns={2}
                  columnWrapperStyle={styles.tableRow}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                        Không có bàn nào phù hợp 🪑
                      </Text>
                    </View>
                  }
                />
              </View>
            </View>
          )}

          {activeTab === 'layout' && (
            <View style={[styles.layoutSection, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Bố trí sàn nhà hàng
              </Text>
              
              <View style={styles.layoutControls}>
                <Button
                  mode={editMode ? 'contained' : 'outlined'}
                  onPress={() => setEditMode(!editMode)}
                  style={styles.layoutButton}
                >
                  {editMode ? 'Thoát sắp xếp' : 'Chế độ sắp xếp'}
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => console.log('Đặt lại bố trí')}
                  style={styles.layoutButton}
                >
                  Đặt lại
                </Button>
                <Button
                  mode="contained"
                  onPress={() => console.log('Lưu bố trí')}
                  style={styles.layoutButton}
                >
                  Lưu bố trí
                </Button>
              </View>

              <View style={styles.layoutArea}>
                <Text style={[styles.areaTitle, { color: theme.colors.onSurface }]}>Tầng 1 - Khu vực chính</Text>
                <View style={styles.layoutGrid}>
                  {(tables || []).slice(0, 8).map((table) => (
                    <View key={table.id} style={[styles.layoutTable, { backgroundColor: getTableStatusColor(mapTableStatusToVietnamese(table.status)) }]}>
                      <Text style={styles.layoutTableText}>{table.table_number}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.layoutArea}>
                <Text style={[styles.areaTitle, { color: theme.colors.onSurface }]}>Tầng 2 - Khu VIP</Text>
                <View style={styles.layoutGrid}>
                  {(tables || []).filter((t: Table) => t.table_number.includes('VIP')).map((table) => (
                    <View key={table.id} style={[styles.layoutTable, styles.vipTable, { backgroundColor: getTableStatusColor(mapTableStatusToVietnamese(table.status)) }]}>
                      <Text style={styles.layoutTableText}>{table.table_number}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.layoutArea}>
                <Text style={[styles.areaTitle, { color: theme.colors.onSurface }]}>Sân vườn</Text>
                <View style={styles.layoutGrid}>
                  {(tables || []).filter((t: Table) => t.table_number.includes('B')).slice(0, 4).map((table) => (
                    <View key={table.id} style={[styles.layoutTable, styles.gardenTable, { backgroundColor: getTableStatusColor(mapTableStatusToVietnamese(table.status)) }]}>
                      <Text style={styles.layoutTableText}>{table.table_number}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Add Reservation Modal */}
        <Portal>
          <Modal
            visible={showAddModal}
            onDismiss={() => setShowAddModal(false)}
            contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                  Tạo đặt bàn mới
                </Text>
                <IconButton
                  icon="close"
                  onPress={() => setShowAddModal(false)}
                  style={styles.closeButton}
                />
              </View>

              <View style={styles.modalContent}>
                <View style={styles.formRow}>
                  <TextInput
                    mode="outlined"
                    label="Tên khách hàng *"
                    value={newReservationForm?.customerName || ''}
                    onChangeText={(text) => setNewReservationForm(prev => ({ ...(prev || {}), customerName: text }))}
                    style={[styles.formInput, styles.formInputHalf]}
                  />
                  <TextInput
                    mode="outlined"
                    label="Số điện thoại *"
                    value={newReservationForm?.customerPhone || ''}
                    onChangeText={(text) => setNewReservationForm(prev => ({ ...(prev || {}), customerPhone: text }))}
                    style={[styles.formInput, styles.formInputHalf]}
                    keyboardType="phone-pad"
                  />
                </View>

                <TextInput
                  mode="outlined"
                  label="Email (tùy chọn)"
                  value={newReservationForm?.customerEmail || ''}
                  onChangeText={(text) => setNewReservationForm(prev => ({ ...(prev || {}), customerEmail: text }))}
                  style={styles.formInput}
                  keyboardType="email-address"
                />

                <View style={styles.formRow}>
                  {/* Date picker */}
                  <View style={[styles.formInput, styles.formInputHalf]}>
                    <Text variant="bodySmall" style={styles.inputLabel}>Ngày đặt</Text>
                    <TouchableOpacity 
                      style={styles.dropdownButton}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text variant="bodyMedium" style={styles.dropdownButtonText}>
                        {newReservationForm?.date || 'Chọn ngày'}
                      </Text>
                      <IconButton icon="calendar" size={20} />
                    </TouchableOpacity>
                  </View>

                  {/* Time picker */}
                  <View style={[styles.formInput, styles.formInputHalf]}>
                    <Text variant="bodySmall" style={styles.inputLabel}>Giờ đặt</Text>
                    <TouchableOpacity 
                      style={styles.dropdownButton}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Text variant="bodyMedium" style={styles.dropdownButtonText}>
                        {newReservationForm?.time || 'Chọn giờ'}
                      </Text>
                      <IconButton icon="clock-outline" size={20} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formRow}>
                  {/* Số người với counter */}
                  <View style={[styles.formInput, styles.formInputHalf]}>
                    <Text variant="bodySmall" style={styles.inputLabel}>Số người</Text>
                    <View style={styles.counterContainer}>
                      <IconButton 
                        icon="minus" 
                        size={20}
                        onPress={() => {
                          const current = parseInt(newReservationForm?.partySize || '2');
                          const newValue = Math.max(1, current - 1);
                          setNewReservationForm(prev => ({ ...(prev || {}), partySize: newValue.toString() }));
                        }}
                        style={styles.counterButton}
                      />
                      <Text variant="titleMedium" style={styles.counterValue}>
                        {newReservationForm?.partySize || '2'} người
                      </Text>
                      <IconButton 
                        icon="plus" 
                        size={20}
                        onPress={() => {
                          const current = parseInt(newReservationForm?.partySize || '2');
                          const newValue = Math.min(20, current + 1);
                          setNewReservationForm(prev => ({ ...(prev || {}), partySize: newValue.toString() }));
                        }}
                        style={styles.counterButton}
                      />
                    </View>
                  </View>

                  {/* Dropdown cho bàn */}
                  <View style={[styles.formInput, styles.formInputHalf]}>
                    <Text variant="bodySmall" style={styles.inputLabel}>Bàn</Text>
                    <Menu
                      visible={tableDropdownVisible}
                      onDismiss={() => setTableDropdownVisible(false)}
                      anchor={
                        <TouchableOpacity 
                          style={styles.dropdownButton}
                          onPress={() => {
                            console.log('📋 Opening table dropdown. Available tables:', filteredTables?.length || 0);
                            console.log('🏪 Tables:', filteredTables);
                            setTableDropdownVisible(true);
                          }}
                        >
                          <Text variant="bodyMedium" style={styles.dropdownButtonText}>
                            {newReservationForm?.tableNumber || 'Chọn bàn'}
                          </Text>
                          <IconButton icon="chevron-down" size={20} />
                        </TouchableOpacity>
                      }
                    >
                      {(filteredTables && filteredTables.length > 0) ? filteredTables.slice(0, 10).map((table) => (
                        <Menu.Item
                          key={table.id}
                          title={`Bàn ${table.table_number} (${table.capacity} người)`}
                          onPress={() => {
                            setNewReservationForm(prev => ({ 
                              ...(prev || {}), 
                              tableNumber: table.table_number 
                            }));
                            setTableDropdownVisible(false);
                          }}
                        />
                      )) : (
                        <Menu.Item
                          title="Không có bàn nào"
                          disabled
                        />
                      )}
                    </Menu>
                  </View>
                </View>

                <TextInput
                  mode="outlined"
                  label="Ghi chú"
                  value={newReservationForm?.notes || ''}
                  onChangeText={(text) => setNewReservationForm(prev => ({ ...(prev || {}), notes: text }))}
                  style={styles.formInput}
                  multiline
                  numberOfLines={2}
                />

                <TextInput
                  mode="outlined"
                  label="Yêu cầu đặc biệt"
                  value={newReservationForm?.specialRequests || ''}
                  onChangeText={(text) => setNewReservationForm(prev => ({ ...(prev || {}), specialRequests: text }))}
                  style={styles.formInput}
                  multiline
                  numberOfLines={2}
                />

                <View style={styles.formActions}>
                  <Button
                    mode="outlined"
                    onPress={() => setShowAddModal(false)}
                    style={styles.formActionButton}
                  >
                    Hủy
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleAddReservation}
                    style={styles.formActionButton}
                  >
                    Tạo đặt bàn
                  </Button>
                </View>
              </View>
            </ScrollView>
          </Modal>

          {/* Date Picker Modal */}
          <Modal
            visible={showDatePicker}
            onDismiss={() => setShowDatePicker(false)}
            contentContainerStyle={styles.datePickerModal}
          >
            <View style={styles.datePickerContainer}>
              <Text variant="titleMedium" style={styles.datePickerTitle}>
                Chọn ngày đặt bàn
              </Text>
              
              <ScrollView showsVerticalScrollIndicator={false} style={{maxHeight: 300}}>
                <View style={styles.dateGridContainer}>
                {[...Array(30)].map((_, index) => {
                  const date = new Date();
                  date.setDate(date.getDate() + index);
                  const dateStr = formatDate(date);
                  const isToday = index === 0;
                  const isSelected = newReservationForm?.date === dateStr;
                  
                  return (
                    <TouchableOpacity
                      key={dateStr}
                      style={[
                        styles.dateItem,
                        isToday && styles.dateItemToday,
                        isSelected && styles.dateItemSelected
                      ]}
                      onPress={() => {
                        setNewReservationForm(prev => ({ 
                          ...(prev || {}), 
                          date: dateStr 
                        }));
                        setShowDatePicker(false);
                      }}
                    >
                      <Text variant="bodySmall" style={styles.dateDayName}>
                        {date.toLocaleDateString('vi-VN', { weekday: 'short' })}
                      </Text>
                      <Text variant="titleMedium" style={[
                        styles.dateDayNumber,
                        isSelected && styles.dateSelectedText
                      ]}>
                        {date.getDate()}
                      </Text>
                      <Text variant="bodySmall" style={styles.dateMonth}>
                        Th{date.getMonth() + 1}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                </View>
              </ScrollView>
              
              <Button 
                mode="outlined" 
                onPress={() => setShowDatePicker(false)}
                style={styles.datePickerCloseBtn}
              >
                Đóng
              </Button>
            </View>
          </Modal>

          {/* Time Picker Modal */}
          <Modal
            visible={showTimePicker}
            onDismiss={() => setShowTimePicker(false)}
            contentContainerStyle={styles.datePickerModal}
          >
            <View style={styles.datePickerContainer}>
              <Text variant="titleMedium" style={styles.datePickerTitle}>
                Chọn giờ đặt bàn
              </Text>
              
              <View style={styles.timeGridContainer}>
                {[
                  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
                  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
                  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
                  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
                ].map((time) => {
                  const isSelected = newReservationForm?.time === time;
                  
                  return (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeItem,
                        isSelected && styles.timeItemSelected
                      ]}
                      onPress={() => {
                        setNewReservationForm(prev => ({ 
                          ...(prev || {}), 
                          time: time 
                        }));
                        setShowTimePicker(false);
                      }}
                    >
                      <Text variant="bodyMedium" style={[
                        styles.timeItemText,
                        isSelected && styles.timeSelectedText
                      ]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              <Button 
                mode="outlined" 
                onPress={() => setShowTimePicker(false)}
                style={styles.datePickerCloseBtn}
              >
                Đóng
              </Button>
            </View>
          </Modal>

        </Portal>

        {/* Date Picker Modal for Filter */}
        <Portal>
          <Modal
            visible={showDatePicker && !showAddModal}
            onDismiss={() => setShowDatePicker(false)}
            contentContainerStyle={[styles.datePickerModal, { backgroundColor: theme.colors.surface }]}
          >
            <View style={[styles.datePickerContainer, { backgroundColor: theme.colors.surface }]}>
              <Text variant="titleLarge" style={[styles.datePickerTitle, { color: theme.colors.onSurface }]}>
                📅 Chọn ngày lọc
              </Text>
              
              <ScrollView showsVerticalScrollIndicator={false} style={{maxHeight: 400}}>
                <View style={styles.dateGridContainer}>
                {/* Quick options */}
                <TouchableOpacity
                  style={[styles.quickDateButton, { backgroundColor: theme.colors.primaryContainer }]}
                  onPress={() => {
                    setSelectedDate('');
                    setShowDatePicker(false);
                  }}
                >
                  <Text variant="bodyMedium" style={[styles.quickDateText, { color: theme.colors.onPrimaryContainer }]}>
                    🔄 Tất cả ngày
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickDateButton, { backgroundColor: theme.colors.secondaryContainer }]}
                  onPress={() => {
                    const today = new Date();
                    const dateStr = today.toLocaleDateString('vi-VN', { 
                      day: '2-digit',
                      month: '2-digit', 
                      year: 'numeric'
                    });
                    setSelectedDate(dateStr);
                    setShowDatePicker(false);
                  }}
                >
                  <Text variant="bodyMedium" style={[styles.quickDateText, { color: theme.colors.onSecondaryContainer }]}>
                    📍 Hôm nay
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickDateButton, { backgroundColor: theme.colors.tertiaryContainer }]}
                  onPress={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const dateStr = tomorrow.toLocaleDateString('vi-VN', { 
                      day: '2-digit',
                      month: '2-digit', 
                      year: 'numeric'
                    });
                    setSelectedDate(dateStr);
                    setShowDatePicker(false);
                  }}
                >
                  <Text variant="bodyMedium" style={[styles.quickDateText, { color: theme.colors.onTertiaryContainer }]}>
                    ⏭️ Ngày mai
                  </Text>
                </TouchableOpacity>

                {/* Date grid */}
                {[...Array(60)].map((_, index) => {
                  const date = new Date();
                  date.setDate(date.getDate() - 30 + index); // Show last 30 days and next 30 days
                  const dateStr = date.toLocaleDateString('vi-VN', { 
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric'
                  });
                  const isToday = index === 30;
                  const isSelected = selectedDate === dateStr;
                  
                  return (
                    <TouchableOpacity
                      key={`filter-${index}`}
                      style={[
                        styles.dateItem,
                        { backgroundColor: theme.colors.surfaceVariant },
                        isToday && { backgroundColor: theme.colors.primaryContainer },
                        isSelected && { backgroundColor: theme.colors.primary }
                      ]}
                      onPress={() => {
                        setSelectedDate(dateStr);
                        setShowDatePicker(false);
                      }}
                    >
                      <Text 
                        variant="bodySmall" 
                        style={[
                          styles.dateDayName, 
                          { color: theme.colors.onSurfaceVariant },
                          isToday && { color: theme.colors.onPrimaryContainer },
                          isSelected && { color: 'white' }
                        ]}
                      >
                        {date.toLocaleDateString('vi-VN', { weekday: 'short' })}
                      </Text>
                      <Text 
                        variant="titleMedium" 
                        style={[
                          styles.dateDay,
                          { color: theme.colors.onSurfaceVariant },
                          isToday && { color: theme.colors.onPrimaryContainer, fontWeight: 'bold' },
                          isSelected && { color: 'white', fontWeight: 'bold' }
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                      <Text 
                        variant="bodySmall" 
                        style={[
                          styles.dateMonth,
                          { color: theme.colors.onSurfaceVariant },
                          isToday && { color: theme.colors.onPrimaryContainer },
                          isSelected && { color: 'white' }
                        ]}
                      >
                        Th{date.getMonth() + 1}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                </View>
              </ScrollView>
              
              <Button 
                mode="outlined" 
                onPress={() => setShowDatePicker(false)}
                style={styles.datePickerCloseBtn}
              >
                Đóng
              </Button>
            </View>
          </Modal>
        </Portal>

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
  // Stats Grid
  statGrid: {
    paddingHorizontal: spacing.md,
    paddingTop: 0,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
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
    marginBottom: 0,
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
    alignItems: 'flex-end',
    marginBottom: spacing.md,
    gap: spacing.sm,
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
  dateInput: {
    flex: 1,
  },
  addButton: {
    alignSelf: 'flex-end',
  },
  // Add Form Section
  addFormSection: {
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
  formRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  formInput: {
    marginBottom: spacing.md,
  },
  formInputHalf: {
    flex: 1,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  formActionButton: {
    minWidth: 100,
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
  // Reservation Card
  reservationCard: {
    marginBottom: spacing.md,
  },
  reservationContent: {
    padding: spacing.md,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  customerContact: {
    fontSize: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  reservationDetails: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  detailLabel: {
    width: 80,
    fontSize: 12,
  },
  detailValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  notesRow: {
    marginTop: spacing.xs,
  },
  notesText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  reservationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  actionButton: {
    margin: 0,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  // Tables List Section
  tablesListSection: {
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
  tableRow: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  // Table Card
  tableCard: {
    flex: 1,
    marginBottom: spacing.md,
    marginHorizontal: spacing.xs,
  },
  tableContent: {
    padding: spacing.md,
    alignItems: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.sm,
  },
  tableName: {
    fontWeight: 'bold',
  },
  tableStatusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  tableCapacity: {
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  tableLocation: {
    textAlign: 'center',
    fontSize: 11,
  },
  // Layout Section
  layoutSection: {
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    flex: 1,
  },
  layoutControls: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  layoutButton: {
    flex: 1,
    minWidth: 100,
  },
  layoutArea: {
    marginBottom: spacing.lg,
  },
  areaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  layoutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  layoutTable: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: spacing.xs,
  },
  vipTable: {
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  gardenTable: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  layoutTableText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
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
  modal: {
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
    flex: 1,
  },
  // Legacy styles for compatibility
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  list: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statusChip: {
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    color: '#666',
  },
  notesContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  notesLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  notes: {
    color: '#666',
  },
  cancelButton: {
    borderColor: '#F44336',
  },
  completeButton: {
    backgroundColor: '#2196F3',
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tabDescription: {
    fontSize: 14,
    marginBottom: 20,
  },
  tablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tableCardContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  tableNumber: {
    fontWeight: 'bold',
    marginVertical: 8,
  },
  tableStatus: {
    marginTop: 4,
  },
  layoutCard: {
    flex: 1,
  },
  layoutTables: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  // New styles for improved form
  inputLabel: {
    marginBottom: 8,
    color: '#666',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 8,
    minHeight: 56,
  },
  counterButton: {
    margin: 0,
  },
  counterValue: {
    textAlign: 'center',
    minWidth: 80,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 56,
  },
  dropdownButtonText: {
    flex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  timeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  timeButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  timeButtonText: {
    fontSize: 12,
  },
  // Date/Time Picker Styles
  datePickerModal: {
    margin: 16,
    borderRadius: 16,
    backgroundColor: 'white',
    maxHeight: '75%',
    minHeight: 400,
  },
  datePickerContainer: {
    padding: 16,
    maxHeight: '100%',
  },
  datePickerTitle: {
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  datePickerCloseBtn: {
    marginTop: 16,
  },
  quickDateButton: {
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickDateText: {
    fontWeight: '600',
    fontSize: 16,
  },
  dateButton: {
    marginTop: spacing.xs,
  },
  dateButtonContent: {
    paddingVertical: spacing.xs,
  },
  clearDateButton: {
    position: 'absolute',
    right: 0,
    top: 20,
  },
  dateGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  dateItem: {
    width: '13.5%',
    aspectRatio: 0.9,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginBottom: 8,
    paddingVertical: 4,
  },
  dateItemToday: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  dateItemSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dateDayName: {
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
  },
  dateDay: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 2,
  },
  dateDayNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 1,
  },
  dateMonth: {
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
  },
  dateSelectedText: {
    color: 'white',
  },
  timeGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  timeItem: {
    width: '23%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  timeItemSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  timeItemText: {
    fontSize: 14,
  },
  timeSelectedText: {
    color: 'white',
  },
  tableDeposit: {
    fontSize: 12,
    marginTop: 4,
  },
  // Socket status indicator
  socketStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  socketIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  socketText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
});

export default ReservationScreen;