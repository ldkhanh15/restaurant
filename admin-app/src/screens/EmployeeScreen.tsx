import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ScrollView
} from 'react-native';
import { 
  Text, 
  FAB, 
  useTheme,
  Card,
  Menu,
  Button,
  Portal,
  Modal,
  Avatar,
  Badge,
  Divider,
  Chip,
  SegmentedButtons,
  TextInput as PaperTextInput
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { EmployeeCard } from '@/components';
import { DebugAuth } from '../components/DebugAuth';
import { 
  useEmployees, 
  useEmployeeStats,
  useTodayShifts,
  useTodayAttendance,
  useCurrentMonthPayroll,
  useDepartments
} from '@/hooks/useEmployees';
import { Employee } from '../api';

// Local interface definition to match useEmployees hook
interface EmployeeFilters {
  page?: number;
  limit?: number;
  department?: string;
  status?: 'active' | 'inactive' | 'terminated';
}
import { spacing } from '@/theme';
import { formatCurrency } from '@/utils';

export const EmployeeScreen = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('employees');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  
  // Menu states
  const [departmentMenuVisible, setDepartmentMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  
  // Add employee modal states
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newEmployeeForm, setNewEmployeeForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    salary: '',
    hire_date: new Date().toISOString().split('T')[0]
  });
  const [positionMenuVisible, setPositionMenuVisible] = useState(false);
  const [departmentFormMenuVisible, setDepartmentFormMenuVisible] = useState(false);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);

  const filters: EmployeeFilters = {
    department: selectedDepartment === 'all' ? undefined : selectedDepartment,
    status: selectedStatus === 'all' ? undefined : (selectedStatus as 'active' | 'inactive' | 'terminated'),
  };

  const { employees, loading: isLoading, fetchEmployees: refetch } = useEmployees();
  const { stats: employeeStats } = useEmployeeStats();
  const { shifts: todayShifts } = useTodayShifts();
  const { attendance: todayAttendance } = useTodayAttendance();
  const { payroll } = useCurrentMonthPayroll();
  
  // Load data when filters change
  useEffect(() => {
    refetch(filters);
  }, [filters, refetch]);
  
  // Debug logs
  console.log('Debug - Today Shifts:', todayShifts?.length || 0, todayShifts);
  console.log('Debug - Today Attendance:', todayAttendance?.length || 0, todayAttendance);
  console.log('Debug - Payroll:', payroll?.length || 0, payroll);
  console.log('Debug - Active Tab:', activeTab);
  
  // Static departments data as fallback
  const departments = ['Bếp', 'Phục vụ', 'Quản lý'];

  const tabButtons = [
    { value: 'employees', label: 'Nhân viên' },
    { value: 'shifts', label: 'Ca làm việc' },
    { value: 'attendance', label: 'Chấm công' },
    { value: 'payroll', label: 'Lương' },
  ];

  const handleEmployeePress = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsViewModalVisible(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge style={styles.activeBadge}>Đang làm việc</Badge>;
      case 'inactive':
        return <Badge style={styles.inactiveBadge}>Tạm nghỉ</Badge>;
      case 'terminated':
        return <Badge style={styles.terminatedBadge}>Đã nghỉ việc</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getShiftStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge style={styles.scheduledBadge}>Đã lên lịch</Badge>;
      case 'in_progress':
        return <Badge style={styles.inProgressBadge}>Đang làm</Badge>;
      case 'completed':
        return <Badge style={styles.completedBadge}>Hoàn thành</Badge>;
      case 'missed':
        return <Badge style={styles.missedBadge}>Vắng mặt</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const renderStatCard = (title: string, value: number, icon: string, color: string) => (
    <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]} mode="outlined">
      <Card.Content style={styles.statContent}>
        <View style={styles.statHeader}>
          <Icon name={icon} size={24} color={color} />
          <Text variant="titleLarge" style={[styles.statValue, { color }]}>
            {value}
          </Text>
        </View>
        <Text variant="bodySmall" style={[styles.statTitle, { color: theme.colors.onSurfaceVariant }]}>
          {title}
        </Text>
      </Card.Content>
    </Card>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Stats */}
      <View style={styles.statsContainer}>
        {renderStatCard('Tổng nhân viên', employeeStats?.total || 0, 'account-group', theme.colors.primary)}
        {renderStatCard('Đang làm việc', employeeStats?.active || 0, 'account-check', '#4caf50')}
        {renderStatCard('Ca hôm nay', todayShifts?.length || 0, 'calendar-today', '#2196f3')}
        {renderStatCard('Đang trong ca', todayShifts?.filter(s => s.status === 'in_progress').length || 0, 'clock', '#ff9800')}
      </View>

      {/* Tabs */}
      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={tabButtons}
        style={styles.tabs}
      />

      {/* Search and Filters */}
      {activeTab === 'employees' && (
        <View style={styles.filtersContainer}>
          <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
            <Icon name="magnify" size={20} color={theme.colors.onSurfaceVariant} style={styles.searchIcon} />
            <TextInput
              placeholder="Tìm kiếm nhân viên..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={[styles.searchInput, { color: theme.colors.onSurface }]}
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
          </View>

          <View style={styles.dropdownContainer}>
            {/* Department Dropdown */}
            <Button
              mode="outlined"
              onPress={() => setDepartmentMenuVisible(true)}
              style={styles.dropdownButton}
              contentStyle={styles.dropdownContent}
              icon="chevron-down"
            >
              {selectedDepartment === 'all' ? 'Tất cả phòng ban' : selectedDepartment}
            </Button>

            {/* Status Dropdown */}
            <Button
              mode="outlined"
              onPress={() => setStatusMenuVisible(true)}
              style={styles.dropdownButton}
              contentStyle={styles.dropdownContent}
              icon="chevron-down"
            >
              {selectedStatus === 'all' ? 'Tất cả trạng thái' :
               selectedStatus === 'active' ? 'Đang làm việc' :
               selectedStatus === 'inactive' ? 'Tạm nghỉ' :
               selectedStatus === 'terminated' ? 'Đã nghỉ việc' : selectedStatus}
            </Button>
          </View>
        </View>
      )}
    </View>
  );

  const renderEmployeesList = () => (
    <FlatList
      data={employees || []}
      renderItem={({ item }) => (
        <EmployeeCard
          employee={item as any}
          onPress={() => handleEmployeePress(item as any)}
          onView={() => handleEmployeePress(item as any)}
          onEdit={() => console.log('Edit employee:', item.id)}
        />
      )}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={renderHeader}
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
  );

  const renderShiftsList = () => (
    <FlatList
      data={todayShifts || []}
      renderItem={({ item }) => (
        <Card style={[styles.shiftCard, { backgroundColor: theme.colors.surface }]} mode="outlined">
          <Card.Content>
            <View style={styles.shiftHeader}>
              <View style={styles.shiftEmployeeInfo}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                  {item.employee_name}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {new Date(item.shift_date).toLocaleDateString('vi-VN')}
                </Text>
              </View>
              {getShiftStatusBadge(item.status)}
            </View>
            
            <View style={styles.shiftDetails}>
              <View style={styles.shiftTimeRow}>
                <View style={styles.shiftTimeItem}>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Ca làm việc
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                    {item.start_time} - {item.end_time}
                  </Text>
                </View>
                <View style={styles.shiftTimeItem}>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Nghỉ giải lao
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                    {(item as any).break_duration || 0} phút
                  </Text>
                </View>
              </View>
              
              {(item as any).actual_start && (
                <View style={styles.actualTimeContainer}>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Thời gian thực tế
                  </Text>
                  <View style={styles.actualTimeRow}>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                      Vào: {(item as any).actual_start}
                    </Text>
                    {(item as any).actual_end && (
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                        Ra: {(item as any).actual_end}
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>
      )}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refetch}
          colors={[theme.colors.primary]}
        />
      }
      ListEmptyComponent={() => (
        <View style={{ padding: spacing.lg, alignItems: 'center' }}>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            Không có ca làm việc nào hôm nay
          </Text>
        </View>
      )}
    />
  );

  const renderAttendanceList = () => (
    <FlatList
      data={todayAttendance || []}
      renderItem={({ item }) => (
        <Card style={[styles.attendanceCard, { backgroundColor: theme.colors.surface }]} mode="outlined">
          <Card.Content>
            <View style={styles.attendanceHeader}>
              <View style={styles.attendanceInfo}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                  {item.employee_name}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {new Date(item.check_in_time).toLocaleDateString('vi-VN')}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  📍 {(item as any).location || 'Không xác định'}
                </Text>
              </View>
              <Badge style={(item as any).verified ? styles.verifiedBadge : styles.unverifiedBadge}>
                {(item as any).verified ? 'Đã xác thực' : 'Chưa xác thực'}
              </Badge>
            </View>
            
            <View style={styles.attendanceTimeRow}>
              <View style={styles.timeCard}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Giờ vào
                </Text>
                <Text variant="bodyLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  {new Date(item.check_in_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={styles.timeCard}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Giờ ra
                </Text>
                <Text variant="bodyLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  {item.check_out_time 
                    ? new Date(item.check_out_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                    : '--:--'
                  }
                </Text>
              </View>
            </View>
            
            {item.check_out_time && (
              <View style={styles.workHoursContainer}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Tổng giờ làm việc
                </Text>
                <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  {Math.round((new Date(item.check_out_time).getTime() - new Date(item.check_in_time).getTime()) / (1000 * 60 * 60) * 10) / 10} giờ
                </Text>
              </View>
            )}
            
            {(item as any).notes && (
              <View style={{ marginTop: spacing.md }}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Ghi chú
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurface, marginTop: spacing.xs }}>
                  {(item as any).notes}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      )}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refetch}
          colors={[theme.colors.primary]}
        />
      }
      ListEmptyComponent={() => (
        <View style={{ padding: spacing.lg, alignItems: 'center' }}>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            Không có dữ liệu chấm công hôm nay
          </Text>
        </View>
      )}
    />
  );

  const renderPayrollList = () => (
    <FlatList
      data={payroll || []}
      renderItem={({ item }) => (
        <Card style={[styles.payrollCard, { backgroundColor: theme.colors.surface }]} mode="outlined">
          <Card.Content>
            <View style={styles.payrollHeader}>
              <View style={styles.payrollInfo}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                  {item.employee_name}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Từ {new Date(item.period_start).toLocaleDateString('vi-VN')} - {new Date(item.period_end).toLocaleDateString('vi-VN')}
                </Text>
              </View>
              <Badge style={
                item.status === 'paid' ? styles.paidBadge :
                item.status === 'approved' ? styles.approvedBadge : styles.draftBadge
              }>
                {item.status === 'paid' ? 'Đã trả' : 
                 item.status === 'approved' ? 'Đã duyệt' : 'Nháp'}
              </Badge>
            </View>
            
            <View style={{ marginTop: spacing.md }}>
              <View style={styles.salaryRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                  Lương cơ bản
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                  {formatCurrency(item.base_salary)}
                </Text>
              </View>
              
              <View style={styles.salaryRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                  Tăng ca ({item.overtime_hours}h)
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  +{formatCurrency(item.overtime_pay)}
                </Text>
              </View>
              
              <View style={styles.salaryRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                  Thưởng
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  +{formatCurrency((item as any).bonus || 0)}
                </Text>
              </View>
              
              <View style={styles.salaryRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                  Khấu trừ
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.error, fontWeight: 'bold' }}>
                  -{formatCurrency(item.deductions)}
                </Text>
              </View>
              
              <Divider style={{ marginVertical: spacing.sm }} />
              
              <View style={styles.totalSalaryContainer}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Tổng lương thực lĩnh
                </Text>
                <Text variant="headlineSmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  {formatCurrency((item as any).net_pay || 0)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refetch}
          colors={[theme.colors.primary]}
        />
      }
      ListEmptyComponent={() => (
        <View style={{ padding: spacing.lg, alignItems: 'center' }}>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            Không có dữ liệu lương tháng này
          </Text>
        </View>
      )}
    />
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'shifts':
        return renderShiftsList();
      case 'attendance':
        return renderAttendanceList();
      case 'payroll':
        return renderPayrollList();
      default:
        return renderEmployeesList();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <DebugAuth />
      {renderContent()}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setIsAddModalVisible(true)}
      />

      {/* Employee Detail Modal */}
      <Portal>
        <Modal
          visible={isViewModalVisible}
          onDismiss={() => setIsViewModalVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          {selectedEmployee && (
            <ScrollView>
              <View style={styles.modalHeader}>
                <Avatar.Image
                  size={80}
                  source={{ uri: selectedEmployee.user?.avatar || 'https://via.placeholder.com/80' }}
                />
                <View style={styles.modalEmployeeInfo}>
                  <Text variant="headlineSmall">{selectedEmployee.user?.full_name || 'N/A'}</Text>
                  <Text variant="bodyLarge" style={{ color: theme.colors.primary }}>
                    {selectedEmployee.position}
                  </Text>
                  {getStatusBadge(selectedEmployee.status)}
                </View>
              </View>

              <View style={styles.modalContent}>
                <View style={styles.infoSection}>
                  <Text variant="titleMedium">Thông tin liên hệ</Text>
                  <Text variant="bodyMedium">Email: {selectedEmployee.user?.email || 'N/A'}</Text>
                  <Text variant="bodyMedium">Điện thoại: {selectedEmployee.user?.phone || 'N/A'}</Text>
                </View>

                <View style={styles.infoSection}>
                  <Text variant="titleMedium">Thông tin công việc</Text>
                  <Text variant="bodyMedium">Phòng ban: {selectedEmployee.department}</Text>
                  <Text variant="bodyMedium">
                    Ngày vào làm: {new Date(selectedEmployee.hire_date).toLocaleDateString('vi-VN')}
                  </Text>
                  <Text variant="bodyMedium">Lương cơ bản: {formatCurrency(selectedEmployee.salary)}</Text>
                </View>
              </View>

              <Button 
                mode="contained" 
                onPress={() => setIsViewModalVisible(false)}
                style={styles.closeButton}
              >
                Đóng
              </Button>
            </ScrollView>
          )}
        </Modal>

        {/* Add Employee Modal */}
        <Modal
          visible={isAddModalVisible}
          onDismiss={() => setIsAddModalVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              Thêm nhân viên mới
            </Text>

            <View style={styles.formContainer}>
              {/* Họ và tên */}
              <PaperTextInput
                label="Họ và tên *"
                value={newEmployeeForm.full_name}
                onChangeText={(text) => setNewEmployeeForm(prev => ({ ...prev, full_name: text }))}
                mode="outlined"
                style={styles.formInput}
              />

              {/* Email */}
              <PaperTextInput
                label="Email *"
                value={newEmployeeForm.email}
                onChangeText={(text) => setNewEmployeeForm(prev => ({ ...prev, email: text }))}
                mode="outlined"
                keyboardType="email-address"
                style={styles.formInput}
              />

              {/* Số điện thoại */}
              <PaperTextInput
                label="Số điện thoại *"
                value={newEmployeeForm.phone}
                onChangeText={(text) => setNewEmployeeForm(prev => ({ ...prev, phone: text }))}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.formInput}
              />

              {/* Vị trí */}
              <View style={styles.formInput}>
                <Text variant="bodySmall" style={[styles.formLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Vị trí *
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => setPositionMenuVisible(true)}
                  style={styles.formDropdown}
                  contentStyle={styles.dropdownContent}
                  icon="chevron-down"
                >
                  {newEmployeeForm.position || 'Chọn vị trí'}
                </Button>
              </View>

              {/* Phòng ban */}
              <View style={styles.formInput}>
                <Text variant="bodySmall" style={[styles.formLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Phòng ban *
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => setDepartmentFormMenuVisible(true)}
                  style={styles.formDropdown}
                  contentStyle={styles.dropdownContent}
                  icon="chevron-down"
                >
                  {newEmployeeForm.department || 'Chọn phòng ban'}
                </Button>
              </View>

              {/* Lương cơ bản */}
              <PaperTextInput
                label="Lương cơ bản (VNĐ) *"
                value={newEmployeeForm.salary}
                onChangeText={(text) => setNewEmployeeForm(prev => ({ ...prev, salary: text }))}
                mode="outlined"
                keyboardType="numeric"
                style={styles.formInput}
              />

              {/* Ngày vào làm */}
              <PaperTextInput
                label="Ngày vào làm *"
                value={newEmployeeForm.hire_date}
                onChangeText={(text) => setNewEmployeeForm(prev => ({ ...prev, hire_date: text }))}
                mode="outlined"
                style={styles.formInput}
                placeholder="YYYY-MM-DD"
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.formActions}>
              <Button 
                mode="outlined" 
                onPress={() => {
                  setIsAddModalVisible(false);
                  setNewEmployeeForm({
                    full_name: '',
                    email: '',
                    phone: '',
                    position: '',
                    department: '',
                    salary: '',
                    hire_date: new Date().toISOString().split('T')[0]
                  });
                }}
                style={styles.formButton}
              >
                Hủy
              </Button>
              <Button 
                mode="contained" 
                onPress={() => {
                  // TODO: Implement add employee logic
                  console.log('Add employee:', newEmployeeForm);
                  setIsAddModalVisible(false);
                  setNewEmployeeForm({
                    full_name: '',
                    email: '',
                    phone: '',
                    position: '',
                    department: '',
                    salary: '',
                    hire_date: new Date().toISOString().split('T')[0]
                  });
                }}
                style={styles.formButton}
              >
                Thêm nhân viên
              </Button>
            </View>
          </ScrollView>
        </Modal>

        {/* All Menu Components */}
        {/* Department Filter Modal */}
        <Modal
          visible={departmentMenuVisible}
          onDismiss={() => setDepartmentMenuVisible(false)}
          contentContainerStyle={[styles.menuModal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleMedium" style={[styles.menuTitle, { color: theme.colors.onSurface }]}>
            Chọn phòng ban
          </Text>
          <Button
            mode="text"
            onPress={() => {
              setSelectedDepartment('all');
              setDepartmentMenuVisible(false);
            }}
            style={styles.menuItem}
          >
            Tất cả phòng ban
          </Button>
          <Button
            mode="text"
            onPress={() => {
              setSelectedDepartment('Bếp');
              setDepartmentMenuVisible(false);
            }}
            style={styles.menuItem}
          >
            Bếp
          </Button>
          <Button
            mode="text"
            onPress={() => {
              setSelectedDepartment('Phục vụ');
              setDepartmentMenuVisible(false);
            }}
            style={styles.menuItem}
          >
            Phục vụ
          </Button>
          <Button
            mode="text"
            onPress={() => {
              setSelectedDepartment('Quản lý');
              setDepartmentMenuVisible(false);
            }}
            style={styles.menuItem}
          >
            Quản lý
          </Button>
        </Modal>

        {/* Status Filter Modal */}
        <Modal
          visible={statusMenuVisible}
          onDismiss={() => setStatusMenuVisible(false)}
          contentContainerStyle={[styles.menuModal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleMedium" style={[styles.menuTitle, { color: theme.colors.onSurface }]}>
            Chọn trạng thái
          </Text>
          <Button
            mode="text"
            onPress={() => {
              setSelectedStatus('all');
              setStatusMenuVisible(false);
            }}
            style={styles.menuItem}
          >
            Tất cả trạng thái
          </Button>
          <Button
            mode="text"
            onPress={() => {
              setSelectedStatus('active');
              setStatusMenuVisible(false);
            }}
            style={styles.menuItem}
          >
            Đang làm việc
          </Button>
          <Button
            mode="text"
            onPress={() => {
              setSelectedStatus('inactive');
              setStatusMenuVisible(false);
            }}
            style={styles.menuItem}
          >
            Tạm nghỉ
          </Button>
          <Button
            mode="text"
            onPress={() => {
              setSelectedStatus('terminated');
              setStatusMenuVisible(false);
            }}
            style={styles.menuItem}
          >
            Đã nghỉ việc
          </Button>
        </Modal>

        {/* Position Form Modal */}
        <Modal
          visible={positionMenuVisible}
          onDismiss={() => setPositionMenuVisible(false)}
          contentContainerStyle={[styles.menuModal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleMedium" style={[styles.menuTitle, { color: theme.colors.onSurface }]}>
            Chọn vị trí
          </Text>
          <Button
            mode="text"
            onPress={() => {
              setNewEmployeeForm(prev => ({ ...prev, position: 'Bếp trưởng' }));
              setPositionMenuVisible(false);
            }}
            style={styles.menuItem}
          >
            Bếp trưởng
          </Button>
          <Button
            mode="text"
            onPress={() => {
              setNewEmployeeForm(prev => ({ ...prev, position: 'Phụ bếp' }));
              setPositionMenuVisible(false);
            }}
            style={styles.menuItem}
          >
            Phụ bếp
          </Button>
          <Button
            mode="text"
            onPress={() => {
              setNewEmployeeForm(prev => ({ ...prev, position: 'Phục vụ' }));
              setPositionMenuVisible(false);
            }}
            style={styles.menuItem}
          >
            Phục vụ
          </Button>
          <Button
            mode="text"
            onPress={() => {
              setNewEmployeeForm(prev => ({ ...prev, position: 'Thu ngân' }));
              setPositionMenuVisible(false);
            }}
            style={styles.menuItem}
          >
            Thu ngân
          </Button>
          <Button
            mode="text"
            onPress={() => {
              setNewEmployeeForm(prev => ({ ...prev, position: 'Quản lý' }));
              setPositionMenuVisible(false);
            }}
            style={styles.menuItem}
          >
            Quản lý
          </Button>
        </Modal>

        {/* Department Form Modal */}
        <Modal
          visible={departmentFormMenuVisible}
          onDismiss={() => setDepartmentFormMenuVisible(false)}
          contentContainerStyle={[styles.menuModal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleMedium" style={[styles.menuTitle, { color: theme.colors.onSurface }]}>
            Chọn phòng ban
          </Text>
          <Button
            mode="text"
            onPress={() => {
              setNewEmployeeForm(prev => ({ ...prev, department: 'Bếp' }));
              setDepartmentFormMenuVisible(false);
            }}
            style={styles.menuItem}
          >
            Bếp
          </Button>
          <Button
            mode="text"
            onPress={() => {
              setNewEmployeeForm(prev => ({ ...prev, department: 'Phục vụ' }));
              setDepartmentFormMenuVisible(false);
            }}
            style={styles.menuItem}
          >
            Phục vụ
          </Button>
          <Button
            mode="text"
            onPress={() => {
              setNewEmployeeForm(prev => ({ ...prev, department: 'Quản lý' }));
              setDepartmentFormMenuVisible(false);
            }}
            style={styles.menuItem}
          >
            Quản lý
          </Button>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    marginHorizontal: spacing.xs,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontWeight: 'bold',
  },
  statTitle: {
    textAlign: 'center',
  },
  tabs: {
    marginBottom: spacing.lg,
  },
  filtersContainer: {
    gap: spacing.md,
  },
  dropdownContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dropdownButton: {
    flex: 1,
  },
  dropdownContent: {
    justifyContent: 'flex-start',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0', // slate-200
    paddingHorizontal: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  chipContainer: {
    flexDirection: 'row',
  },
  filterChip: {
    marginRight: spacing.sm,
  },
  listContent: {
    paddingBottom: 80,
  },
  // Employee card styles in list
  shiftCard: {
    marginVertical: spacing.xs,
    marginHorizontal: spacing.md,
    elevation: 2,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actualTime: {
    marginTop: spacing.xs,
  },
  attendanceCard: {
    marginVertical: spacing.xs,
    marginHorizontal: spacing.md,
    elevation: 2,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  payrollCard: {
    marginVertical: spacing.xs,
    marginHorizontal: spacing.md,
    elevation: 2,
  },
  payrollHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  salaryDetails: {
    gap: spacing.xs,
  },
  divider: {
    marginVertical: spacing.sm,
  },
  fab: {
    position: 'absolute',
    margin: spacing.lg,
    right: 0,
    bottom: 0,
  },
  // Badge styles
  activeBadge: {
    backgroundColor: '#dcfce7', // green-100
    color: '#16a34a', // green-600
  },
  inactiveBadge: {
    backgroundColor: '#fef3c7', // amber-100
    color: '#d97706', // amber-600
  },
  terminatedBadge: {
    backgroundColor: '#fee2e2', // red-100
    color: '#dc2626', // red-600
  },
  scheduledBadge: {
    backgroundColor: '#dbeafe', // blue-100
    color: '#2563eb', // blue-600
  },
  inProgressBadge: {
    backgroundColor: '#dcfce7', // green-100
    color: '#16a34a', // green-600
  },
  completedBadge: {
    backgroundColor: '#dcfce7', // green-100
    color: '#16a34a', // green-600
  },
  missedBadge: {
    backgroundColor: '#fee2e2', // red-100
    color: '#dc2626', // red-600
  },
  verifiedBadge: {
    backgroundColor: '#dcfce7', // green-100
    color: '#16a34a', // green-600
  },
  unverifiedBadge: {
    backgroundColor: '#fee2e2', // red-100
    color: '#dc2626', // red-600
  },
  paidBadge: {
    backgroundColor: '#dcfce7', // green-100
    color: '#16a34a', // green-600
  },
  approvedBadge: {
    backgroundColor: '#dbeafe', // blue-100
    color: '#2563eb', // blue-600
  },
  draftBadge: {
    backgroundColor: '#fef3c7', // amber-100
    color: '#d97706', // amber-600
  },
  // Shift styles
  shiftEmployeeInfo: {
    flex: 1,
  },
  shiftDetails: {
    marginTop: spacing.md,
  },
  shiftTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  shiftTimeItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  actualTimeContainer: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
  },
  actualTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  // Attendance styles - enhanced
  attendanceInfo: {
    flex: 1,
  },
  attendanceTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  timeCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginHorizontal: 2,
  },
  workHoursContainer: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    alignItems: 'center',
  },
  // Payroll styles - enhanced
  payrollInfo: {
    flex: 1,
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  totalSalaryContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    alignItems: 'center',
  },
  // Modal styles
  modal: {
    margin: spacing.lg,
    borderRadius: 8,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  modalEmployeeInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  modalContent: {
    gap: spacing.lg,
  },
  infoSection: {
    gap: spacing.sm,
  },
  closeButton: {
    marginTop: spacing.lg,
  },
  // Form styles
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
  formLabel: {
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  formDropdown: {
    justifyContent: 'flex-start',
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  formButton: {
    flex: 1,
  },
  // Menu modal styles
  menuModal: {
    margin: spacing.lg,
    borderRadius: 8,
    padding: spacing.md,
    maxHeight: '60%',
  },
  menuTitle: {
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  menuItem: {
    justifyContent: 'flex-start',
    marginVertical: spacing.xs,
  },
});
