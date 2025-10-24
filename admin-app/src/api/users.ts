import api from './axiosConfig';

export interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  role: "customer" | "employee" | "admin";
  full_name: string;
  ranking: "regular" | "vip" | "platinum";
  points: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  preferences?: any;
}

export interface UsersResponse {
  users: User[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  ranking?: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  phone: string;
  role: User['role'];
  full_name: string;
  ranking?: User['ranking'];
}

export interface UpdateUserData extends Partial<CreateUserData> {
  points?: number;
  preferences?: any;
}

// Real API functions for users
export const getUsers = async (filters?: UserFilters): Promise<UsersResponse> => {
  try {
    const response = await api.get('/users', { params: filters });
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Lỗi khi tải danh sách người dùng';
    throw new Error(errorMessage);
  }
};

export const getUserById = async (id: number): Promise<User> => {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Lỗi khi tải thông tin người dùng';
    throw new Error(errorMessage);
  }
};

export const createUser = async (userData: CreateUserData): Promise<User> => {
  try {
    const response = await api.post('/users', userData);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Lỗi khi tạo người dùng';
    throw new Error(errorMessage);
  }
};

export const updateUser = async (id: number, userData: UpdateUserData): Promise<User> => {
  try {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Lỗi khi cập nhật người dùng';
    throw new Error(errorMessage);
  }
};

export const deleteUser = async (id: number): Promise<void> => {
  try {
    await api.delete(`/users/${id}`);
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Lỗi khi xóa người dùng';
    throw new Error(errorMessage);
  }
};

export const getUsersByRole = async (role: User['role']): Promise<User[]> => {
  try {
    const response = await api.get('/users', { params: { role } });
    return response.data.users;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Lỗi khi tải người dùng theo vai trò';
    throw new Error(errorMessage);
  }
};

export const getUsersByRanking = async (ranking: User['ranking']): Promise<User[]> => {
  try {
    const response = await api.get('/users', { params: { ranking } });
    return response.data.users;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Lỗi khi tải người dùng theo hạng';
    throw new Error(errorMessage);
  }
};

export const searchUsers = async (query: string): Promise<User[]> => {
  try {
    const response = await api.get('/users', { params: { search: query } });
    return response.data.users;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Lỗi khi tìm kiếm người dùng';
    throw new Error(errorMessage);
  }
};