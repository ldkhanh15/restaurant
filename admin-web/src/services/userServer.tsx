import apiClient from "./apiClient";

const userApi = {
  // User
  getAllUsers: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ) => {
    let url = `/users?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    const response = await apiClient.get(url);
    console.log("Fetched users:", response);
    return response;
  },

  getUserById: async (id: string) => {
    const response = await apiClient.get(`/users/${id}`);
    return response;
  },

  createUser: async (userData: any) => {
    const response = await apiClient.post("/users", userData);
    return response;
  },

  updateUser: async (id: string, userData: any) => {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response;
  },

  deleteUser: async (id: string) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response;
  },
};

export default userApi;
