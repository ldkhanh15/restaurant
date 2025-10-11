import apiClient from "./apiClient";

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

const payrollApi = {
  // Payroll CRUD
  getAllPayrollRecords: async (
    page: number = 1,
    limit: number = 30,
    search?: string
  ) => {
    let url = `/payroll?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    const response = await apiClient.get<ApiResponse<any>>(url);

    return response.data;
  },

  getPayrollRecord: async (id: string) => {
    const response = await apiClient.get<ApiResponse<any>>(`/payroll/${id}`);
    return response.data;
  },

  createPayrollRecord: async (payrollData: any) => {
    const response = await apiClient.post<ApiResponse<any>>(
      "/payroll",
      payrollData
    );
    return response.data;
  },

  updatePayrollRecord: async (id: string, payrollData: any) => {
    const response = await apiClient.put<ApiResponse<any>>(
      `/payroll/${id}`,
      payrollData
    );
    return response.data;
  },

  deletePayrollRecord: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<any>>(
      `/payroll/${id}`
    );
    return response.data;
  },
};

export default payrollApi;
