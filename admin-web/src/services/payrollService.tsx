import apiClient from "./apiClient";

const payrollApi = {
  // Payroll CRUD
  getAllPayrollRecords: async (
    page: number = 1,
    limit: number = 30,
    search?: string
  ) => {
    let url = `/payroll?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    const response = await apiClient.get(url);

    return response;
  },

  getPayrollRecord: async (id: string) => {
    const response = await apiClient.get(`/payroll/${id}`);
    return response;
  },

  createPayrollRecord: async (payrollData: any) => {
    const response = await apiClient.post("/payroll", payrollData);
    return response;
  },

  updatePayrollRecord: async (id: string, payrollData: any) => {
    const response = await apiClient.put(`/payroll/${id}`, payrollData);
    return response;
  },

  deletePayrollRecord: async (id: string) => {
    const response = await apiClient.delete(`/payroll/${id}`);
    return response;
  },
};

export default payrollApi;
