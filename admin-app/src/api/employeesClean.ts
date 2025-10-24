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
}

// Transform employee data to include computed fields
const transformEmployee = (emp: any): Employee => {
  return {
    ...emp,
    full_name: emp.user?.full_name || emp.full_name || 'N/A',
    email: emp.user?.email || emp.email || '',
    phone: emp.user?.phone || emp.phone || ''
  };
};

// Pure API functions
export const getEmployees = async (filters?: EmployeeFilters) => {
  try {
    console.log('👥 API: Fetching employees...', filters);
    
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.department) params.append('department', filters.department);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.position) params.append('position', filters.position);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response = await api.get(`/employees?${params.toString()}`);
    console.log('✅ Employees API response:', response.data);
    
    const employees = (response.data?.data?.data || []).map(transformEmployee);
    const pagination = response.data?.data?.pagination || {};
    
    return {
      employees,
      total: pagination.total || 0,
      pagination
    };
  } catch (error: any) {
    console.error('❌ API Error fetching employees:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch employees');
  }
};

export const getEmployee = async (id: string) => {
  try {
    console.log('👥 API: Fetching employee:', id);
    const response = await api.get(`/employees/${id}`);
    console.log('✅ Employee API response:', response.data);
    
    return transformEmployee(response.data?.data);
  } catch (error: any) {
    console.error('❌ API Error fetching employee:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch employee');
  }
};

export const createEmployee = async (data: CreateEmployeeRequest) => {
  try {
    console.log('👥 API: Creating employee:', data);
    const response = await api.post('/employees', data);
    console.log('✅ Create employee API response:', response.data);
    
    return transformEmployee(response.data?.data);
  } catch (error: any) {
    console.error('❌ API Error creating employee:', error);
    throw new Error(error.response?.data?.message || 'Failed to create employee');
  }
};

export const updateEmployee = async (id: string, data: UpdateEmployeeRequest) => {
  try {
    console.log('👥 API: Updating employee:', id, data);
    const response = await api.put(`/employees/${id}`, data);
    console.log('✅ Update employee API response:', response.data);
    
    return transformEmployee(response.data?.data);
  } catch (error: any) {
    console.error('❌ API Error updating employee:', error);
    throw new Error(error.response?.data?.message || 'Failed to update employee');
  }
};

export const deleteEmployee = async (id: string) => {
  try {
    console.log('👥 API: Deleting employee:', id);
    const response = await api.delete(`/employees/${id}`);
    console.log('✅ Delete employee API response:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('❌ API Error deleting employee:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete employee');
  }
};

export const getEmployeeStats = async (): Promise<EmployeeStats> => {
  try {
    console.log('👥 API: Fetching employee stats...');
    const response = await api.get('/employees/stats');
    console.log('✅ Employee stats API response:', response.data);
    
    return response.data?.data || {
      total: 0,
      active: 0,
      inactive: 0,
      terminated: 0,
      departments: {},
      positions: {}
    };
  } catch (error: any) {
    console.error('❌ API Error fetching employee stats:', error);
    // Return mock data for now
    return {
      total: 0,
      active: 0,
      inactive: 0,
      terminated: 0,
      departments: {},
      positions: {}
    };
  }
};