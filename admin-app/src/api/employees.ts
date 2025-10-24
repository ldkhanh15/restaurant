import api from './axiosConfig';

// Employee interfaces matching backend
export interface Employee {
  id: string; // Backend uses UUID strings
  user_id: string;
  position: string;
  department: string;
  hire_date: string;
  salary: number;
  status: 'active' | 'inactive' | 'terminated';
  face_image_url?: string;
  created_at: string;
  updated_at?: string;
  // User relationship data
  user?: {
    full_name: string;
    email: string;
    phone: string;
  };
  // Computed fields for UI
  full_name?: string;
  email?: string;
  phone?: string;
}

export interface CreateEmployeeRequest {
  user_id?: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hire_date: string;
  salary: number;
  face_image_url?: string;
}

export interface UpdateEmployeeRequest extends Partial<CreateEmployeeRequest> {
  status?: 'active' | 'inactive' | 'terminated';
}

export interface EmployeeFilters {
  search?: string;
  department?: string;
  status?: string;
  position?: string;
  page?: number;
  limit?: number;
}

export interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
  terminated: number;
  departments: Record<string, number>;
  positions: Record<string, number>;
  overtime_pay: number;
  bonus: number;
  deductions: number;
  net_pay: number;
  status: 'draft' | 'approved' | 'paid';
}

export interface CreateEmployeeRequest {
  user_id?: number;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hire_date: string;
  salary: number;
  face_image_url?: string;
}

export interface UpdateEmployeeRequest extends Partial<CreateEmployeeRequest> {
  status?: 'active' | 'inactive' | 'terminated';
}

export interface EmployeeFilters {
  search?: string;
  department?: string;
  status?: string;
  position?: string;
}

// Mock data
export const mockEmployees: Employee[] = [
  {
    id: 1,
    user_id: 3,
    full_name: "Lê Quân C",
    email: "lequanc@email.com",
    phone: "0912345678",
    position: "Bếp trưởng",
    department: "Bếp",
    hire_date: "2024-01-15",
    salary: 15000000,
    status: "active",
    face_image_url: "/placeholder-user.jpg",
    created_at: "2024-01-15",
  },
  {
    id: 2,
    user_id: 5,
    full_name: "Nguyễn Thị D",
    email: "nguyenthid@email.com",
    phone: "0923456789",
    position: "Phục vụ",
    department: "Phục vụ",
    hire_date: "2024-02-01",
    salary: 8000000,
    status: "active",
    created_at: "2024-02-01",
  },
  {
    id: 3,
    user_id: 6,
    full_name: "Trần Văn E",
    email: "tranvane@email.com",
    phone: "0934567890",
    position: "Thu ngân",
    department: "Phục vụ",
    hire_date: "2024-02-15",
    salary: 9000000,
    status: "active",
    created_at: "2024-02-15",
  },
  {
    id: 4,
    user_id: 7,
    full_name: "Phạm Thị F",
    email: "phamthif@email.com",
    phone: "0945678901",
    position: "Phụ bếp",
    department: "Bếp",
    hire_date: "2024-03-01",
    salary: 7000000,
    status: "inactive",
    created_at: "2024-03-01",
  },
  {
    id: 5,
    user_id: 8,
    full_name: "Hoàng Văn G",
    email: "hoangvang@email.com",
    phone: "0956789012",
    position: "Quản lý ca",
    department: "Quản lý",
    hire_date: "2024-01-10",
    salary: 12000000,
    status: "active",
    created_at: "2024-01-10",
  },
];

export const mockShifts: EmployeeShift[] = [
  {
    id: 1,
    employee_id: 1,
    employee_name: "Lê Quân C",
    shift_date: new Date().toISOString().split('T')[0], // Today
    start_time: "08:00",
    end_time: "16:00",
    break_duration: 60,
    status: "completed",
    actual_start: "07:55",
    actual_end: "16:10",
  },
  {
    id: 2,
    employee_id: 2,
    employee_name: "Nguyễn Thị D",
    shift_date: new Date().toISOString().split('T')[0], // Today
    start_time: "10:00",
    end_time: "22:00",
    break_duration: 90,
    status: "in_progress",
    actual_start: "10:05",
  },
  {
    id: 3,
    employee_id: 3,
    employee_name: "Trần Văn E",
    shift_date: new Date().toISOString().split('T')[0], // Today
    start_time: "16:00",
    end_time: "24:00",
    break_duration: 60,
    status: "scheduled",
  },
  {
    id: 4,
    employee_id: 5,
    employee_name: "Hoàng Văn G",
    shift_date: new Date().toISOString().split('T')[0], // Today
    start_time: "06:00",
    end_time: "14:00",
    break_duration: 60,
    status: "completed",
    actual_start: "06:00",
    actual_end: "14:15",
  },
];

export const mockAttendance: AttendanceLog[] = [
  {
    id: 1,
    employee_id: 1,
    employee_name: "Lê Quân C",
    check_in_time: new Date().toISOString().split('T')[0] + "T07:55:00",
    check_out_time: new Date().toISOString().split('T')[0] + "T16:10:00",
    verified: true,
    face_image_url: "/placeholder-user.jpg",
    location: "Cửa chính",
    notes: "Đúng giờ",
  },
  {
    id: 2,
    employee_id: 2,
    employee_name: "Nguyễn Thị D",
    check_in_time: new Date().toISOString().split('T')[0] + "T10:05:00",
    verified: true,
    location: "Cửa chính",
  },
  {
    id: 3,
    employee_id: 5,
    employee_name: "Hoàng Văn G",
    check_in_time: new Date().toISOString().split('T')[0] + "T06:00:00",
    check_out_time: new Date().toISOString().split('T')[0] + "T14:15:00",
    verified: true,
    location: "Cửa chính",
    notes: "Tăng ca 15 phút",
  },
];

export const mockPayroll: PayrollRecord[] = [
  {
    id: 1,
    employee_id: 1,
    employee_name: "Lê Quân C",
    period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    base_salary: 15000000,
    overtime_hours: 8,
    overtime_pay: 500000,
    bonus: 1000000,
    deductions: 200000,
    net_pay: 16300000,
    status: "approved",
  },
  {
    id: 2,
    employee_id: 2,
    employee_name: "Nguyễn Thị D",
    period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    base_salary: 8000000,
    overtime_hours: 12,
    overtime_pay: 400000,
    bonus: 500000,
    deductions: 100000,
    net_pay: 8800000,
    status: "paid",
  },
  {
    id: 3,
    employee_id: 3,
    employee_name: "Trần Văn E",
    period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    base_salary: 9000000,
    overtime_hours: 6,
    overtime_pay: 300000,
    bonus: 300000,
    deductions: 150000,
    net_pay: 9450000,
    status: "draft",
  },
];

// Mock API functions
export const employeeApi = {
  // Employees
  getEmployees: async (filters?: EmployeeFilters): Promise<Employee[]> => {
    let employees = [...mockEmployees];
    
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      employees = employees.filter(emp => 
        emp.full_name.toLowerCase().includes(search) ||
        emp.email.toLowerCase().includes(search) ||
        emp.phone.includes(search) ||
        emp.position.toLowerCase().includes(search)
      );
    }
    
    if (filters?.department && filters.department !== 'all') {
      employees = employees.filter(emp => emp.department === filters.department);
    }
    
    if (filters?.status && filters.status !== 'all') {
      employees = employees.filter(emp => emp.status === filters.status);
    }
    
    if (filters?.position) {
      employees = employees.filter(emp => emp.position === filters.position);
    }
    
    return Promise.resolve(employees);
  },

  getEmployee: async (id: number): Promise<Employee | null> => {
    const employee = mockEmployees.find(emp => emp.id === id);
    return Promise.resolve(employee || null);
  },

  createEmployee: async (data: CreateEmployeeRequest): Promise<Employee> => {
    const newEmployee: Employee = {
      id: Math.max(...mockEmployees.map(e => e.id)) + 1,
      user_id: data.user_id || 0,
      ...data,
      status: 'active',
      created_at: new Date().toISOString(),
    };
    mockEmployees.push(newEmployee);
    return Promise.resolve(newEmployee);
  },

  updateEmployee: async (id: number, data: UpdateEmployeeRequest): Promise<Employee | null> => {
    const index = mockEmployees.findIndex(emp => emp.id === id);
    if (index === -1) return Promise.resolve(null);
    
    mockEmployees[index] = { ...mockEmployees[index], ...data, updated_at: new Date().toISOString() };
    return Promise.resolve(mockEmployees[index]);
  },

  deleteEmployee: async (id: number): Promise<boolean> => {
    const index = mockEmployees.findIndex(emp => emp.id === id);
    if (index === -1) return Promise.resolve(false);
    
    mockEmployees.splice(index, 1);
    return Promise.resolve(true);
  },

  // Shifts
  getShifts: async (date?: string): Promise<EmployeeShift[]> => {
    let shifts = [...mockShifts];
    
    if (date) {
      shifts = shifts.filter(shift => shift.shift_date === date);
    }
    
    return Promise.resolve(shifts);
  },

  getEmployeeShifts: async (employeeId: number, startDate?: string, endDate?: string): Promise<EmployeeShift[]> => {
    let shifts = mockShifts.filter(shift => shift.employee_id === employeeId);
    
    if (startDate) {
      shifts = shifts.filter(shift => shift.shift_date >= startDate);
    }
    
    if (endDate) {
      shifts = shifts.filter(shift => shift.shift_date <= endDate);
    }
    
    return Promise.resolve(shifts);
  },

  // Attendance
  getAttendance: async (date?: string): Promise<AttendanceLog[]> => {
    let attendance = [...mockAttendance];
    
    if (date) {
      attendance = attendance.filter(log => log.check_in_time.startsWith(date));
    }
    
    return Promise.resolve(attendance);
  },

  getEmployeeAttendance: async (employeeId: number, startDate?: string, endDate?: string): Promise<AttendanceLog[]> => {
    let attendance = mockAttendance.filter(log => log.employee_id === employeeId);
    
    if (startDate) {
      attendance = attendance.filter(log => log.check_in_time >= startDate);
    }
    
    if (endDate) {
      attendance = attendance.filter(log => log.check_in_time <= endDate);
    }
    
    return Promise.resolve(attendance);
  },

  // Payroll
  getPayroll: async (period?: string): Promise<PayrollRecord[]> => {
    let payroll = [...mockPayroll];
    
    if (period) {
      payroll = payroll.filter(record => 
        record.period_start <= period && record.period_end >= period
      );
    }
    
    return Promise.resolve(payroll);
  },

  getEmployeePayroll: async (employeeId: number): Promise<PayrollRecord[]> => {
    const payroll = mockPayroll.filter(record => record.employee_id === employeeId);
    return Promise.resolve(payroll);
  },

  // Statistics
  getEmployeeStats: async () => {
    const total = mockEmployees.length;
    const active = mockEmployees.filter(e => e.status === 'active').length;
    const inactive = mockEmployees.filter(e => e.status === 'inactive').length;
    const terminated = mockEmployees.filter(e => e.status === 'terminated').length;
    
    const departments: Record<string, number> = {};
    const positions: Record<string, number> = {};
    
    mockEmployees.forEach(emp => {
      departments[emp.department] = (departments[emp.department] || 0) + 1;
      positions[emp.position] = (positions[emp.position] || 0) + 1;
    });
    
    return Promise.resolve({
      total,
      active,
      inactive,
      terminated,
      departments,
      positions,
    });
  },

  getDepartments: async (): Promise<string[]> => {
    const departments = [...new Set(mockEmployees.map(e => e.department))];
    return Promise.resolve(departments);
  },

  getPositions: async (): Promise<string[]> => {
    const positions = [...new Set(mockEmployees.map(e => e.position))];
    return Promise.resolve(positions);
  },
};