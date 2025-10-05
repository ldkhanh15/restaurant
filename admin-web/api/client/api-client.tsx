import axios from "axios";

// Cấu hình cơ bản cho axios
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Tạo instance axios với cấu hình mặc định
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Thêm interceptor để xử lý token
apiClient.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
