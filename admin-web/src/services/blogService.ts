"use client";

import apiClient from "./apiClient";

export const blogService = {
  list: (params?: { page?: number; limit?: number; status?: string; search?: string; category?: string }) =>
    apiClient.get("/blogs", { params }),
  listPublished: () => apiClient.get("/blogs/published"),
  getById: (id: string) => apiClient.get(`/blogs/${id}`),
  create: (data: any) => apiClient.post("/blogs", data),
  update: (id: string, data: any) => apiClient.put(`/blogs/${id}`, data),
  remove: (id: string) => apiClient.delete(`/blogs/${id}`),
};