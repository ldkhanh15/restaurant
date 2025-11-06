import apiClient from "./apiClient";

// Định nghĩa interface cho response

const attendanceApi = {
  // Attendance CRUD
  getAllAttendanceLogs: async (
    page: number = 1,
    limit: number = 30,
    search?: string
  ) => {
    let url = `/attendance?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    const response = await apiClient.get(url);

    return response;
  },

  getAttendanceLog: async (id: string) => {
    const response = await apiClient.get(`/attendance/${id}`);
    return response;
  },

  createAttendanceLog: async (attendanceData: any) => {
    const response = await apiClient.post(
      "/attendance",
      attendanceData
    );
    return response;
  },

  updateAttendanceLog: async (id: string, attendanceData: any) => {
    const response = await apiClient.put(
      `/attendance/${id}`,
      attendanceData
    );
    return response;
  },

  deleteAttendanceLog: async (id: string) => {
    const response = await apiClient.delete(
      `/attendance/${id}`
    );
    return response;
  },
};

export default attendanceApi;
