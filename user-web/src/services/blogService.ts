import apiClient from "../lib/apiClient";

export const blogService = {
  getAll: (params: any) => apiClient.get<any>("/blogs", { params }),
  getById: (id: string) => apiClient.get<any>(`/blogs/${id}`),
  search: (query: string) => apiClient.get<any>(`/blogs/search?q=${query}`),
  getByCategory: (categoryId: string) =>
    apiClient.get<any>(`/blogs/category/${categoryId}`),
};

export default blogService;
