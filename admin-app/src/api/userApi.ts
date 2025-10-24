import api from "./axiosConfig";

// Interface để match với backend
export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  role: "customer" | "employee" | "admin";
  full_name?: string;
  preferences?: any;
  ranking: "regular" | "vip" | "platinum";
  points: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface CreateUserData {
  username: string;
  email: string;
  phone?: string;
  password: string;
  role: User['role'];
  full_name?: string;
  ranking?: User['ranking'];
}

export interface UpdateUserData extends Partial<Omit<CreateUserData, 'password'>> {
  points?: number;
  preferences?: any;
}

// API functions
export const getUsers = async (params?: {
  page?: number;
  limit?: number;
  role?: string;
  unassigned?: boolean;
}) => {
  const response = await api.get("/users", { params });
  return response.data;
};

export const getUserById = async (id: string) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (data: CreateUserData) => {
  // Sử dụng signup endpoint thay vì users endpoint
  const response = await api.post("/auth/signup", data);
  return response.data;
};

export const updateUser = async (id: string, data: UpdateUserData) => {
  const response = await api.put(`/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id: string) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};