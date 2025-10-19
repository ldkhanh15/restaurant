import { get } from "http";
import apiClient from "./apiClient";

const complaintApi = {
  // User
  getAllComplaints: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ) => {
    let url = `/complaints?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    const response = await apiClient.get(url);
    console.log("Fetched complaints:", response);
    return response;
  },

  getComplaintById: async (id: string) => {
    const response = await apiClient.get(`/complaints/${id}`);
    return response;
  },

  createComplaint: async (complaintData: any) => {
    const response = await apiClient.post("/complaints", complaintData);
    return response;
  },

  updateComplaint: async (id: string, complaintData: any) => {
    const response = await apiClient.put(`/complaints/${id}`, complaintData);
    return response;
  },

  deleteComplaint: async (id: string) => {
    const response = await apiClient.delete(`/complaints/${id}`);
    return response;
  },
};

export default complaintApi;
