"use client";

import apiClient from "./apiClient";

export const blogService = {
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get("/blog", { params }),
  listPublished: () => apiClient.get("/blog/published"),
  getById: (id: string) => apiClient.get(`/blog/${id}`),
  create: (data: any) => apiClient.post("/blog", data),
  update: (id: string, data: any) => apiClient.put(`/blog/${id}`, data),
  remove: (id: string) => apiClient.delete(`/blog/${id}`),
};

export type BlogPost = {
  id: string;
  title: string;
  content: string;
  slug?: string;
  thumbnail_url?: string;
  cover_image_url?: string;
  tags?: string[];
  category?: string;
  status?: "draft" | "published" | "deleted";
  author_id?: string;
  created_at?: string;
  updated_at?: string;
};
