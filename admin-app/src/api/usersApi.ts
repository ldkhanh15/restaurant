import api from './axiosConfig';
import { logger } from '../utils/logger';

export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  full_name?: string;
  role: 'customer' | 'employee' | 'admin';
  ranking?: 'regular' | 'vip' | 'platinum';
  points?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  phone?: string;
  full_name?: string;
  role?: 'customer' | 'employee' | 'admin';
  ranking?: 'regular' | 'vip' | 'platinum';
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  password?: string;
  phone?: string;
  full_name?: string;
  role?: 'customer' | 'employee' | 'admin';
  ranking?: 'regular' | 'vip' | 'platinum';
}

export class UsersAPI {
  private baseURL = '/users'; // FIXED: Loại bỏ /api prefix

  // Get all users
  async getUsers(): Promise<User[]> {
    try {
      logger.api.request('GET /api/users');
      
      const response = await api.get(this.baseURL);
      
      logger.api.response('GET /api/users', {
        status: response.status,
        count: response.data.data?.length || 0
      });

      return response.data.data || [];
    } catch (error: any) {
      logger.api.error('GET /api/users failed', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách người dùng');
    }
  }

  // Get user by ID
  async getUserById(id: string): Promise<User> {
    try {
      logger.api.request(`GET /api/users/${id}`);
      
      const response = await api.get(`${this.baseURL}/${id}`);
      
      logger.api.response(`GET /api/users/${id}`, {
        status: response.status,
        userId: id
      });

      return response.data.data;
    } catch (error: any) {
      logger.api.error(`GET /api/users/${id} failed`, error);
      throw new Error(error.response?.data?.message || 'Không thể tải thông tin người dùng');
    }
  }

  // Create new user
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      logger.api.request('POST /api/users', { 
        email: userData.email,
        username: userData.username
      });
      
      const response = await api.post(this.baseURL, userData);
      
      logger.api.response('POST /api/users', {
        status: response.status,
        userId: response.data.data?.id
      });

      return response.data.data;
    } catch (error: any) {
      logger.api.error('POST /api/users failed', error);
      throw new Error(error.response?.data?.message || 'Không thể tạo người dùng');
    }
  }

  // Update user
  async updateUser(id: string, userData: UpdateUserData): Promise<User> {
    try {
      logger.api.request(`PUT /api/users/${id}`, userData);
      
      const response = await api.put(`${this.baseURL}/${id}`, userData);
      
      logger.api.response(`PUT /api/users/${id}`, {
        status: response.status,
        userId: id
      });

      return response.data.data;
    } catch (error: any) {
      logger.api.error(`PUT /api/users/${id} failed`, error);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật người dùng');
    }
  }

  // Delete user
  async deleteUser(id: string): Promise<void> {
    try {
      logger.api.request(`DELETE /api/users/${id}`);
      
      const response = await api.delete(`${this.baseURL}/${id}`);
      
      logger.api.response(`DELETE /api/users/${id}`, {
        status: response.status
      });
    } catch (error: any) {
      logger.api.error(`DELETE /api/users/${id} failed`, error);
      throw new Error(error.response?.data?.message || 'Không thể xóa người dùng');
    }
  }
}

export const usersAPI = new UsersAPI();
export default usersAPI;