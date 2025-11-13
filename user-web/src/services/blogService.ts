import apiClient from "../lib/apiClient";

export const blogService = {
  getAll: (params: any) => apiClient.get<any>("/blogs", { params }),
  getById: (id: string) => apiClient.get<any>(`/blogs/${id}`),
};

export default blogService;
