import apiClient from "./apiClient";

// Định nghĩa interface cho response

const employeeApi = {
  // Employee
  getAllEmployees: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ) => {
    let url = `/employees?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    const response = await apiClient.get(url);

    return response;
  },

  getAllNoPaging: () => apiClient.get("/employees?all=true"),

  getEmployeeById: async (id: string) => {
    const response = await apiClient.get(`/employees/${id}`);
    return response;
  },

  createEmployee: async (employeeData: any) => {
    const response = await apiClient.post(
      "/employees",
      employeeData
    );
    return response;
  },

  updateEmployee: async (id: string, employeeData: any) => {
    const response = await apiClient.put(
      `/employees/${id}`,
      employeeData
    );
    return response;
  },

  deleteEmployee: async (id: string) => {
    const response = await apiClient.delete(
      `/employees/${id}`
    );
    return response;
  },
  deleteEmployeeShift: async (id: string) => {
    const response = await apiClient.delete(`/shifts/${id}`);
    return response;
  },

  // Attendance Logs
  getAttendanceLogs: async (page: number = 1, limit: number = 10) => {
    const response = await apiClient.get(
      `/attendance?page=${page}&limit=${limit}`
    );
    return response;
  },

  getAttendanceLog: async (id: string) => {
    const response = await apiClient.get(`/attendance/${id}`);
    return response;
  },

  createAttendanceLog: async (logData: any) => {
    const response = await apiClient.post(
      "/attendance",
      logData
    );
    return response;
  },

  updateAttendanceLog: async (id: string, logData: any) => {
    const response = await apiClient.put(
      `/attendance/${id}`,
      logData
    );
    return response;
  },

  deleteAttendanceLog: async (id: string) => {
    const response = await apiClient.delete(
      `/attendance/${id}`
    );
    return response;
  },

  // Payroll
  getPayrolls: async (page: number = 1, limit: number = 10) => {
    const response = await apiClient.get(
      `/payroll?page=${page}&limit=${limit}`
    );
    return response;
  },

  getPayroll: async (id: string) => {
    const response = await apiClient.get(`/payroll/${id}`);
    return response;
  },

  createPayroll: async (payrollData: any) => {
    const response = await apiClient.post(
      "/payroll",
      payrollData
    );
    return response;
  },

  updatePayroll: async (id: string, payrollData: any) => {
    const response = await apiClient.put(
      `/payroll/${id}`,
      payrollData
    );
    return response;
  },

  deletePayroll: async (id: string) => {
    const response = await apiClient.delete(`/payroll/${id}`);
    return response;
  },

  //get all users with role employee and not assigned to any employee
  getAllUserUnassigned: async () => {
    const response = await apiClient.get(
      `/users?role=employee&limit=1000&unassigned=true`
    );
    return response;
  },
};

export default employeeApi;
