"use client";

import apiClient from "./apiClient";

export const blogService = {
  list: (params?: { page?: number; limit?: number; status?: string; search?: string; category?: string }) =>
    apiClient.get("/blog", { params }),
  listPublished: () => apiClient.get("/blog/published"),
  getById: (id: string) => apiClient.get(`/blog/${id}`),
  create: (data: any) => apiClient.post("/blog", data),
  update: (id: string, data: any) => apiClient.put(`/blog/${id}`, data),
  remove: (id: string) => apiClient.delete(`/blog/${id}`),
};