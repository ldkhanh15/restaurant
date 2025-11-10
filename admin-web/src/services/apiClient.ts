"use client";

import axios from "axios";
// import { toast } from "sonner";
import { toast } from "react-toastify";

const apiClient = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api` || "http://localhost:8000/api",
  timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "30000"),
  withCredentials: false,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data.data,
  (error) => {
    const status = error?.response?.status;
    const message =
      error?.response?.data?.message || error.message || "Đã xảy ra lỗi";
    toast.error(message);
    if (status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
