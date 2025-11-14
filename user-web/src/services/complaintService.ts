import apiClient from "../lib/apiClient";
import type { Complaint, CreateComplaintData } from "@/type/Complaint";

export const complaintService = {
  getAll: (params: any) => apiClient.get<any>("/complaints", { params }),
  getById: (id: string) => apiClient.get<any>(`/complaints/${id}`),
  create: (data: CreateComplaintData) =>
    apiClient.post<any>("/complaints", data),
  update: (id: string, data: Complaint) =>
    apiClient.put<any>(`/complaints/${id}`, data),
  delete: (id: string) => apiClient.delete<any>(`/complaints/${id}`),
};

export default complaintService;
