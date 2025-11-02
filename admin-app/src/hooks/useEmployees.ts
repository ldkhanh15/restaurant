import { useState, useEffect, useCallback, useMemo } from 'react';
import employeeAPI, { Employee } from '../api/employeeApi';
import { logger } from '../utils/logger';

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const limit = 30;

  const fetchEmployees = useCallback(async (page: number = 1, search: string = '') => {
    try {
      setLoading(true);
      setError(null);
      
      logger.info('Fetching employees from API...', { page, limit, search });
      const response: any = await employeeAPI.getAllEmployees(page, limit, search);
      
      // Handle response similar to admin-web
      // Response is already unwrapped by interceptor (response.data.data)
      if (response) {
        // Case 1: Direct array
        if (Array.isArray(response)) {
          setEmployees(response);
          setTotalPages(1);
          setTotalEmployees(response.length);
          logger.info('Employees fetched (direct array)', { count: response.length });
        } 
        // Case 2: Object with items property (pagination)
        else if (typeof response === 'object' && response.items && Array.isArray(response.items)) {
          setEmployees(response.items);
          
          // Handle pagination if exists
          if (response.pagination) {
            setTotalPages(response.pagination.totalPages || 1);
            setTotalEmployees(response.pagination.totalItems || 0);
          } else {
            setTotalPages(1);
            setTotalEmployees(response.items.length);
          }
          
          logger.info('Employees fetched (with pagination)', { 
            count: response.items.length,
            page: response.pagination?.currentPage,
            totalPages: response.pagination?.totalPages 
          });
        }
        // Case 3: Fallback - try to find any array in response
        else if (typeof response === 'object') {
          const possibleArrays = Object.values(response).filter(Array.isArray);
          if (possibleArrays.length > 0) {
            const employeesArray = possibleArrays[0] as Employee[];
            setEmployees(employeesArray);
            setTotalPages(1);
            setTotalEmployees(employeesArray.length);
            logger.info('Employees fetched (fallback array)', { count: employeesArray.length });
          } else {
            setEmployees([]);
            logger.warn('No array found in response', response);
          }
        }
        else {
          setEmployees([]);
          logger.warn('Unexpected response format', response);
        }
      } else {
        setEmployees([]);
        logger.warn('Empty response from API');
      }
    } catch (err: any) {
      logger.error('Failed to fetch employees', err);
      setError(err.message || 'Không thể tải danh sách nhân viên');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback((filters?: { page?: number; limit?: number; search?: string }) => {
    const page = filters?.page || currentPage;
    const search = filters?.search || '';
    setCurrentPage(page);
    return fetchEmployees(page, search);
  }, [currentPage, fetchEmployees]);

  useEffect(() => {
    fetchEmployees(currentPage);
  }, []);

  return {
    employees,
    loading,
    error,
    currentPage,
    totalPages,
    totalEmployees,
    refetch,
    fetchEmployees,
    setCurrentPage
  };
};

export const useEmployeeStats = () => {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    onLeave: 0,
    newThisMonth: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all employees (with high limit to get all)
        const response: any = await employeeAPI.getAllEmployees(1, 1000);
        
        // Parse response similar to useEmployees
        let allEmployees: Employee[] = [];
        if (response) {
          if (Array.isArray(response)) {
            allEmployees = response;
          } else if (typeof response === 'object' && response.items && Array.isArray(response.items)) {
            allEmployees = response.items;
          } else if (typeof response === 'object') {
            const possibleArrays = Object.values(response).filter(Array.isArray);
            if (possibleArrays.length > 0) {
              allEmployees = possibleArrays[0] as Employee[];
            }
          }
        }
        
        // Calculate stats
        const total = allEmployees.length;
        const active = allEmployees.filter(emp => {
          const status = emp.status || (emp.user ? 'active' : 'active');
          return status === 'active';
        }).length;
        
        const inactive = allEmployees.filter(emp => {
          const status = emp.status || (emp.user ? 'active' : 'active');
          return status === 'inactive';
        }).length;
        
        // Calculate new this month
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newThisMonth = allEmployees.filter(emp => {
          const createdAt = new Date(emp.created_at);
          return createdAt >= firstDayOfMonth;
        }).length;
        
        setStats({
          total,
          active,
          onLeave: inactive,
          newThisMonth
        });
        
        logger.info('Employee stats calculated', { total, active, onLeave: inactive, newThisMonth });
      } catch (err: any) {
        logger.error('Failed to fetch employee stats', err);
        setError(err.message || 'Không thể tải thống kê nhân viên');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  return { stats, loading, error };
};

export const useTodayShifts = () => {
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTodayShifts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        logger.info('Fetching today shifts', { date: today });
        const response: any = await employeeAPI.getShifts(1, 100, today);
        
        // Parse response
        let shiftsData: any[] = [];
        if (response) {
          if (Array.isArray(response)) {
            shiftsData = response;
          } else if (typeof response === 'object' && response.items && Array.isArray(response.items)) {
            shiftsData = response.items;
          } else if (typeof response === 'object') {
            const possibleArrays = Object.values(response).filter(Array.isArray);
            if (possibleArrays.length > 0) {
              shiftsData = possibleArrays[0] as any[];
            }
          }
        }
        
        setShifts(shiftsData);
        logger.info('Today shifts fetched', { count: shiftsData.length });
      } catch (err: any) {
        logger.error('Failed to fetch today shifts', err);
        setError(err.message || 'Không thể tải ca làm việc hôm nay');
        setShifts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTodayShifts();
  }, []);

  return { shifts, loading, error };
};

export const useTodayAttendance = () => {
  return useMemo(() => ({
    attendance: [
      {
        id: '1',
        employee_name: 'Nguyễn Văn A',
        check_in_time: '2024-01-15T08:00:00Z',
        check_out_time: '2024-01-15T16:00:00Z',
        status: 'present',
        hours_worked: 8,
        location: 'Tầng 1',
        verified: true
      },
      {
        id: '2',
        employee_name: 'Trần Thị B',
        check_in_time: '2024-01-15T16:05:00Z',
        check_out_time: null,
        status: 'late',
        hours_worked: 0,
        location: 'Tầng 2',
        verified: false
      },
      {
        id: '3',
        employee_name: 'Lê Văn C',
        check_in_time: null,
        check_out_time: null,
        status: 'absent',
        hours_worked: 0,
        location: 'Không xác định',
        verified: false
      }
    ],
    loading: false,
    error: null
  }), []);
};

export const useCurrentMonthPayroll = () => {
  return useMemo(() => ({
    payroll: [
      {
        id: '1',
        employee_name: 'Nguyễn Văn A',
        period_start: '2024-01-01',
        period_end: '2024-01-31',
        base_salary: 15000000,
        bonus: 2000000,
        deductions: 500000,
        total: 16500000,
        status: 'paid',
        overtime_hours: 10,
        overtime_pay: 1500000
      },
      {
        id: '2',
        employee_name: 'Trần Thị B',
        period_start: '2024-01-01',
        period_end: '2024-01-31',
        base_salary: 12000000,
        bonus: 1000000,
        deductions: 300000,
        total: 12700000,
        status: 'approved',
        overtime_hours: 5,
        overtime_pay: 750000
      },
      {
        id: '3',
        employee_name: 'Lê Văn C',
        period_start: '2024-01-01',
        period_end: '2024-01-31',
        base_salary: 10000000,
        bonus: 500000,
        deductions: 200000,
        total: 10300000,
        status: 'draft',
        overtime_hours: 2,
        overtime_pay: 300000
      }
    ],
    loading: false,
    error: null
  }), []);
};

export const useDepartments = () => {
  return useMemo(() => ({
    departments: [
      { id: '1', name: 'Quản lý', count: 5 },
      { id: '2', name: 'Bếp', count: 10 },
      { id: '3', name: 'Phục vụ', count: 8 },
      { id: '4', name: 'Thu ngân', count: 2 }
    ],
    loading: false,
    error: null
  }), []);
};