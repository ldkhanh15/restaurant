"use client";

import apiClient from "./apiClient";

export const masterService = {
  get: () => apiClient.get(`/master/restaurant/`),
  create: (data: any) => apiClient.post("/master/restaurant/", data),
  update: (id: string, data: any) => apiClient.put(`/master/restaurant/${id}`, data),
};