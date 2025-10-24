/**
 * Employee API Module
 * 
 * Vì Employee endpoints chưa được định nghĩa trong swagger.yaml,
 * nên tôi tạo wrapper riêng cho Employee management
 */

import axios, { AxiosResponse } from 'axios';
import api from './axiosConfig'; // Use configured axios instance

// Employee Types (dựa vào backend Employee model)
export interface Employee {
  id: string;
  user_id: string;
  position: string;
  department: string;
  hire_date: string;
  salary: number;
  status: 'active' | 'inactive' | 'terminated';
  face_image_url?: string;
  created_at: string;
  updated_at?: string;
  // Data from User relationship
  user?: {
    full_name: string;
    email: string;
    phone: string;
  };
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
}

export interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
  terminated: number;
  departments: Record<string, number>;
  positions: Record<string, number>;
}

// Use the configured axios instance from axiosConfig
const employeeAxios = api;

/**
 * Employee API Client
 */
export class EmployeeApi {
  
  // Get all employees with filters
  async getEmployees(filters?: EmployeeFilters): Promise<Employee[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.department && filters.department !== 'all') params.append('department', filters.department);
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    
    const response: AxiosResponse<{data: Employee[]}> = await employeeAxios.get(
      `/employees?${params.toString()}`
    );
    
    // Transform backend data to frontend format
    return response.data.data?.map(emp => ({
      id: emp.id,
      user_id: emp.user_id,
      position: emp.position || '',
      department: emp.department || '',
      hire_date: emp.hire_date || new Date().toISOString().split('T')[0],
      salary: emp.salary || 0,
      status: emp.status || 'active',
      face_image_url: emp.face_image_url,
      created_at: emp.created_at || new Date().toISOString(),
      updated_at: emp.updated_at,
      user: emp.user
    })) || [];
  }

  // Get employee by ID
  async getEmployee(id: string): Promise<Employee> {
    const response: AxiosResponse<{data: Employee}> = await employeeAxios.get(
      `/employees/${id}`
    );
    
    const emp = response.data.data;
    return {
      id: emp.id,
      user_id: emp.user_id,
      position: emp.position || '',
      department: emp.department || '',
      hire_date: emp.hire_date || new Date().toISOString().split('T')[0],
      salary: emp.salary || 0,
      status: emp.status || 'active',
      face_image_url: emp.face_image_url,
      created_at: emp.created_at || new Date().toISOString(),
      updated_at: emp.updated_at,
      user: emp.user
    };
  }

  // Create new employee
  async createEmployee(data: CreateEmployeeRequest): Promise<Employee> {
    const response: AxiosResponse<{data: Employee}> = await employeeAxios.post(
      `/employees`,
      data
    );
    
    return response.data.data;
  }

  // Update employee
  async updateEmployee(id: string, data: UpdateEmployeeRequest): Promise<Employee> {
    const response: AxiosResponse<{data: Employee}> = await employeeAxios.put(
      `/employees/${id}`,
      data
    );
    
    return response.data.data;
  }

  // Delete employee
  async deleteEmployee(id: string): Promise<boolean> {
    await employeeAxios.delete(`/employees/${id}`);
    return true;
  }

  // Get employee statistics
  async getEmployeeStats(): Promise<EmployeeStats> {
    try {
      const response: AxiosResponse<{data: EmployeeStats}> = await employeeAxios.get(
        `/employees/stats`
      );
      
      return response.data.data;
    } catch (error) {
      // Return default stats on error
      return {
        total: 0,
        active: 0,
        inactive: 0,
        terminated: 0,
        departments: {},
        positions: {}
      };
    }
  }

  // Get departments list
  async getDepartments(): Promise<string[]> {
    try {
      const response: AxiosResponse<{data: string[]}> = await employeeAxios.get(
        `/employees/departments`
      );
      
      return response.data.data || [];
    } catch (error) {
      return [];
    }
  }

  // Get positions list
  async getPositions(): Promise<string[]> {
    try {
      const response: AxiosResponse<{data: string[]}> = await employeeAxios.get(
        `/employees/positions`
      );
      
      return response.data.data || [];
    } catch (error) {
      return [];
    }
  }
}

// Export singleton instance
export const employeeApi = new EmployeeApi();

// Helper function để lấy auth token - sync version cho interceptor
function getAuthToken(): string | null {
  // Trả về null để interceptor trong axiosConfig.ts xử lý async
  return null;
}

// Export default
export default employeeApi;