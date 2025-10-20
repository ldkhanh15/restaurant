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

const attendanceApi = {
  // Attendance CRUD
  getAllAttendanceLogs: async (
    page: number = 1,
    limit: number = 30,
    search?: string
  ) => {
    let url = `/attendance?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    const response = await apiClient.get<ApiResponse<any>>(url);

    return response;
  },

  getAttendanceLog: async (id: string) => {
    const response = await apiClient.get<ApiResponse<any>>(`/attendance/${id}`);
    return response;
  },

  createAttendanceLog: async (attendanceData: any) => {
    const response = await apiClient.post<ApiResponse<any>>(
      "/attendance",
      attendanceData
    );
    return response;
  },

  updateAttendanceLog: async (id: string, attendanceData: any) => {
    const response = await apiClient.put<ApiResponse<any>>(
      `/attendance/${id}`,
      attendanceData
    );
    return response;
  },

  deleteAttendanceLog: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<any>>(
      `/attendance/${id}`
    );
    return response;
  },
};

export default attendanceApi;
