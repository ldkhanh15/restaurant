import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { 
  employeeApi,
  Employee,
  EmployeeFilters as ApiEmployeeFilters,
  CreateEmployeeRequest 
} from '../api/employeeApi';

// Định nghĩa local interfaces cho compatibility
interface EmployeeFilters {
  page?: number;
  limit?: number;
  department?: string;
  status?: 'active' | 'inactive' | 'terminated';
}

interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
  byDepartment: Record<string, number>;
}

// Employee shift types
export interface EmployeeShift {
  id: string;
  employee_id: string;
  employee_name: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'missed';
}

export interface AttendanceLog {
  id: string;
  employee_id: string;
  employee_name: string;
  check_in_time: string;
  check_out_time?: string;
  total_hours: number;
  status: 'present' | 'absent' | 'late' | 'early_leave';
}

export interface PayrollRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  period_start: string;
  period_end: string;
  base_salary: number;
  overtime_hours: number;
  overtime_pay: number;
  deductions: number;
  net_salary: number;
  status: 'pending' | 'approved' | 'paid';
}

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async (filters?: EmployeeFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('👥 Hook: Fetching employees with filters:', filters);
      const employeesData = await employeeApi.getEmployees(filters as ApiEmployeeFilters);
      
      setEmployees(employeesData);
      console.log('✅ Hook: Employees loaded successfully:', employeesData.length);
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi tải danh sách nhân viên';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
      console.error('❌ Hook: Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getEmployee = useCallback(async (id: string) => {
    try {
      console.log('👤 Hook: Fetching employee by ID:', id);
      const employee = await employeeApi.getEmployee(id);
      console.log('✅ Hook: Employee details loaded');
      return employee;
    } catch (err: any) {
      Alert.alert('Lỗi', 'Không thể tải thông tin nhân viên');
      console.error('❌ Hook: Error fetching employee:', err);
      throw err;
    }
  }, []);

  const createEmployee = useCallback(async (data: any) => {
    try {
      console.log('➕ Hook: Creating employee:', data);
      const newEmployee = await employeeApi.createEmployee(data);
      
      // Refresh danh sách
      await fetchEmployees();
      console.log('✅ Hook: Employee created successfully');
      return newEmployee;
    } catch (err: any) {
      Alert.alert('Lỗi', 'Không thể tạo nhân viên mới');
      console.error('❌ Hook: Error creating employee:', err);
      throw err;
    }
  }, [fetchEmployees]);

  const updateEmployee = useCallback(async (id: string, data: any) => {
    try {
      console.log('✏️ Hook: Updating employee:', id, data);
      const updatedEmployee = await employeeApi.updateEmployee(id, data);
      
      // Update local state
      if (updatedEmployee) {
        setEmployees(prev => prev.map(emp => 
          emp.id === id ? updatedEmployee : emp
        ));
      }
      console.log('✅ Hook: Employee updated successfully');
      return updatedEmployee;
    } catch (err: any) {
      Alert.alert('Lỗi', 'Không thể cập nhật nhân viên');
      console.error('❌ Hook: Error updating employee:', err);
      throw err;
    }
  }, []);

  const deleteEmployee = useCallback(async (id: string) => {
    try {
      console.log('🗑️ Hook: Deleting employee:', id);
      await employeeApi.deleteEmployee(id);
      
      // Remove from local state
      setEmployees(prev => prev.filter(emp => emp.id !== id));
      console.log('✅ Hook: Employee deleted successfully');
    } catch (err: any) {
      Alert.alert('Lỗi', 'Không thể xóa nhân viên');
      console.error('❌ Hook: Error deleting employee:', err);
      throw err;
    }
  }, []);

  const refresh = useCallback(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return {
    employees,
    loading,
    error,
    fetchEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    refresh
  };
};

export const useEmployeeStats = () => {
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📊 Hook: Fetching employee stats...');
      // TODO: Implement stats endpoint in swagger client
      // const statsData = await swaggerClient.employees.getStats();
      
      // Mock stats for now
      const statsData = {
        total: 0,
        active: 0,
        inactive: 0,
        byDepartment: {}
      };
      
      setStats(statsData);
      console.log('✅ Hook: Employee stats loaded:', statsData);
    } catch (err: any) {
      console.error('❌ Hook: Error fetching employee stats:', err);
      setStats({
        total: 0,
        active: 0,
        inactive: 0,
        byDepartment: {}
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    fetchStats
  };
};

export const useDepartments = () => {
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🏢 Hook: Fetching departments...');
      // TODO: Implement departments endpoint in swagger client
      const departmentsData = ['kitchen', 'service', 'management', 'cleaning'];
      
      setDepartments(departmentsData);
      console.log('✅ Hook: Departments loaded:', departmentsData);
    } catch (err: any) {
      console.error('❌ Hook: Error fetching departments:', err);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  return {
    departments,
    loading,
    fetchDepartments
  };
};

export const usePositions = () => {
  const [positions, setPositions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPositions = useCallback(async () => {
    try {
      setLoading(true);
      console.log('💼 Hook: Fetching positions...');
      // TODO: Implement positions endpoint in swagger client
      const positionsData = ['chef', 'cook', 'waiter', 'manager', 'cashier'];
      
      setPositions(positionsData);
      console.log('✅ Hook: Positions loaded:', positionsData);
    } catch (err: any) {
      console.error('❌ Hook: Error fetching positions:', err);
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  return {
    positions,
    loading,
    fetchPositions
  };
};

// Shifts hooks (Tạm thời return mock data vì chưa có API)
export const useTodayShifts = () => {
  const [shifts, setShifts] = useState<EmployeeShift[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTodayShifts = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📅 Hook: Fetching today shifts...');
      
      // TODO: Implement with real API when available
      // const shiftsData = await shiftsApi.getTodayShifts();
      
      // Mock data for now
      setShifts([]);
      console.log('⚠️ Hook: Today shifts - using mock data');
    } catch (err: any) {
      console.error('❌ Hook: Error fetching today shifts:', err);
      setShifts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayShifts();
  }, [fetchTodayShifts]);

  return {
    shifts,
    loading,
    fetchTodayShifts
  };
};

// Attendance hooks
export const useTodayAttendance = () => {
  const [attendance, setAttendance] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTodayAttendance = useCallback(async () => {
    try {
      setLoading(true);
      console.log('👥 Hook: Fetching today attendance...');
      
      // TODO: Implement with real API when available
      // const attendanceData = await attendanceApi.getTodayAttendance();
      
      // Mock data for now
      setAttendance([]);
      console.log('⚠️ Hook: Today attendance - using mock data');
    } catch (err: any) {
      console.error('❌ Hook: Error fetching today attendance:', err);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayAttendance();
  }, [fetchTodayAttendance]);

  return {
    attendance,
    loading,
    fetchTodayAttendance
  };
};

// Payroll hooks
export const useCurrentMonthPayroll = () => {
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCurrentMonthPayroll = useCallback(async () => {
    try {
      setLoading(true);
      console.log('💰 Hook: Fetching current month payroll...');
      
      // TODO: Implement with real API when available
      // const payrollData = await payrollApi.getCurrentMonthPayroll();
      
      // Mock data for now
      setPayroll([]);
      console.log('⚠️ Hook: Current month payroll - using mock data');
    } catch (err: any) {
      console.error('❌ Hook: Error fetching current month payroll:', err);
      setPayroll([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentMonthPayroll();
  }, [fetchCurrentMonthPayroll]);

  return {
    payroll,
    loading,
    fetchCurrentMonthPayroll
  };
};