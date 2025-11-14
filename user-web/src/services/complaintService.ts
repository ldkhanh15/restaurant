import apiClient from "../lib/apiClient";
import type { Complaint, CreateComplaintData } from "@/type/Complaint";

export const complaintService = {
  getAll: (params: any) => apiClient.get<any>("/reviews", { params }),
  getById: (id: string) => apiClient.get<any>(`/reviews/${id}`),
  create: (data: CreateComplaintData) => apiClient.post<any>("/reviews", data),
  update: (id: string, data: Complaint) =>
    apiClient.put<any>(`/reviews/${id}`, data),
  delete: (id: string) => apiClient.delete<any>(`/reviews/${id}`),
};

export default complaintService;
