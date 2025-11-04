import api from './axiosConfig';

// User interface (from users table)
export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  role: 'customer' | 'employee' | 'admin';
  full_name?: string;
  ranking: 'regular' | 'vip' | 'platinum';
  points: number;
  created_at: string;
  updated_at: string;
}

// Employee interface (from employees table)
export interface Employee {
  id: string;
  user_id?: string;
  position?: string;
  face_image_url?: string;
  created_at: string;
  deleted_at?: string | null;
  // Nested user data from JOIN
  user?: User;
  
  // Deprecated fields (for backward compatibility, will be removed)
  // Use employee.user.* instead
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  department?: string;
  salary?: number;
  hire_date?: string;
  status?: 'active' | 'inactive' | 'terminated';
  updated_at?: string;
}

export interface CreateEmployeeData {
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  salary: number;
  hire_date: string;
  status?: 'active' | 'inactive' | 'terminated';
}

export interface UpdateEmployeeData {
  user_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  salary?: number;
  hire_date?: string;
  status?: 'active' | 'inactive' | 'terminated';
}

export interface AttendanceLog {
  id: string;
  employee_id: string;
  employee_name?: string;
  check_in_time?: string;
  check_out_time?: string;
  status: string;
  hours_worked?: number;
  location?: string;
  verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Payroll {
  id: string;
  employee_id: string;
  employee_name?: string;
  period_start: string;
  period_end: string;
  base_salary: number;
  bonus?: number;
  deductions?: number;
  total: number;
  status: string;
  overtime_hours?: number;
  overtime_pay?: number;
  created_at?: string;
  updated_at?: string;
}

const employeeAPI = {
  // Employee Management
  getAllEmployees: (page: number = 1, limit: number = 10, search?: string) => {
    let url = `/employees?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return api.get(url);
  },

  getEmployeeById: (id: string) => 
    api.get(`/employees/${id}`),

  createEmployee: (employeeData: CreateEmployeeData) => 
    api.post('/employees', employeeData),

  updateEmployee: (id: string, employeeData: UpdateEmployeeData) => 
    api.put(`/employees/${id}`, employeeData),

  deleteEmployee: (id: string) => 
    api.delete(`/employees/${id}`),

  deleteEmployeeShift: (id: string) => 
    api.delete(`/shifts/${id}`),

  // Employee Shifts
  getShifts: (page: number = 1, limit: number = 10, date?: string) => {
    let url = `/shifts?page=${page}&limit=${limit}`;
    if (date) url += `&date=${date}`;
    return api.get(url);
  },

  getShiftById: (id: string) => 
    api.get(`/shifts/${id}`),

  createShift: (shiftData: any) => 
    api.post('/shifts', shiftData),

  updateShift: (id: string, shiftData: any) => 
    api.put(`/shifts/${id}`, shiftData),

  // Attendance Logs
  getAttendanceLogs: (page: number = 1, limit: number = 10) => 
    api.get(`/attendance?page=${page}&limit=${limit}`),

  getAttendanceLog: (id: string) => 
    api.get(`/attendance/${id}`),

  createAttendanceLog: (logData: any) => 
    api.post('/attendance', logData),

  updateAttendanceLog: (id: string, logData: any) => 
    api.put(`/attendance/${id}`, logData),

  deleteAttendanceLog: (id: string) => 
    api.delete(`/attendance/${id}`),

  // Payroll
  getPayrolls: (page: number = 1, limit: number = 10) => 
    api.get(`/payroll?page=${page}&limit=${limit}`),

  getPayroll: (id: string) => 
    api.get(`/payroll/${id}`),

  createPayroll: (payrollData: any) => 
    api.post('/payroll', payrollData),

  updatePayroll: (id: string, payrollData: any) => 
    api.put(`/payroll/${id}`, payrollData),

  deletePayroll: (id: string) => 
    api.delete(`/payroll/${id}`),

  // Users
  getAllUserUnassigned: () => 
    api.get('/users?role=employee&limit=1000&unassigned=true'),
};

export default employeeAPI;
