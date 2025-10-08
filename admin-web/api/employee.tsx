import apiClient from "./client/api-client";

// Định nghĩa interface cho response
interface ApiResponse<T> {
  status?: string;
  success?: boolean;
  data: T;
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems?: number;
  };
  message?: string;
}

const employeeApi = {
  // Employee
  getAllEmployees: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ) => {
    let url = `/employees?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    const response = await apiClient.get<ApiResponse<any>>(url);

    return response.data;
  },

  getEmployeeById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<any>>(`/employees/${id}`);
    return response.data;
  },

  createEmployee: async (employeeData: any) => {
    const response = await apiClient.post<ApiResponse<any>>(
      "/employees",
      employeeData
    );
    return response.data;
  },

  updateEmployee: async (id: string, employeeData: any) => {
    const response = await apiClient.put<ApiResponse<any>>(
      `/employees/${id}`,
      employeeData
    );
    return response.data;
  },

  deleteEmployee: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<any>>(
      `/employees/${id}`
    );
    return response.data;
  },
  deleteEmployeeShift: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<any>>(`/shifts/${id}`);
    return response.data;
  },

  // Attendance Logs
  getAttendanceLogs: async (page: number = 1, limit: number = 10) => {
    const response = await apiClient.get<ApiResponse<any[]>>(
      `/attendance?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  getAttendanceLog: async (id: string) => {
    const response = await apiClient.get<ApiResponse<any>>(`/attendance/${id}`);
    return response.data;
  },

  createAttendanceLog: async (logData: any) => {
    const response = await apiClient.post<ApiResponse<any>>(
      "/attendance",
      logData
    );
    return response.data;
  },

  updateAttendanceLog: async (id: string, logData: any) => {
    const response = await apiClient.put<ApiResponse<any>>(
      `/attendance/${id}`,
      logData
    );
    return response.data;
  },

  deleteAttendanceLog: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<any>>(
      `/attendance/${id}`
    );
    return response.data;
  },

  // Payroll
  getPayrolls: async (page: number = 1, limit: number = 10) => {
    const response = await apiClient.get<ApiResponse<any[]>>(
      `/payroll?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  getPayroll: async (id: string) => {
    const response = await apiClient.get<ApiResponse<any>>(`/payroll/${id}`);
    return response.data;
  },

  createPayroll: async (payrollData: any) => {
    const response = await apiClient.post<ApiResponse<any>>(
      "/payroll",
      payrollData
    );
    return response.data;
  },

  updatePayroll: async (id: string, payrollData: any) => {
    const response = await apiClient.put<ApiResponse<any>>(
      `/payroll/${id}`,
      payrollData
    );
    return response.data;
  },

  deletePayroll: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<any>>(`/payroll/${id}`);
    return response.data;
  },

  //get all users with role employee and not assigned to any employee
  getAllUserUnassigned: async () => {
    const response = await apiClient.get<ApiResponse<any[]>>(
      `/users?role=employee&limit=1000&unassigned=true`
    );
    return response.data;
  },
};

export default employeeApi;
