import apiClient from "./client/api-client";
import employeeApi from "./employee";

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

const employeeShiftApi = {
  // EmployeeShifts CRUD
  getAllEmployeeShifts: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ) => {
    let url = `/shifts?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    const response = await apiClient.get<ApiResponse<any>>(url);
    
    return response.data;
  },

  // Employee Shifts
  getEmployeeShifts: async (page: number = 1, limit: number = 10) => {
    const response = await apiClient.get<ApiResponse<any[]>>(
      `/shifts?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  getEmployeeShift: async (id: string) => {
    const response = await apiClient.get<ApiResponse<any>>(`/shifts/${id}`);
    return response.data;
  },

  createEmployeeShift: async (shiftData: any) => {
    const response = await apiClient.post<ApiResponse<any>>(
      "/shifts",
      shiftData
    );
    return response.data;
  },

  updateEmployeeShift: async (id: string, shiftData: any) => {
    const response = await apiClient.put<ApiResponse<any>>(
      `/shifts/${id}`,
      shiftData
    );
    return response.data;
  },
  
  deleteEmployeeShift: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<any>>(`/shifts/${id}`);
    return response.data;
  },
};

export default employeeShiftApi;
