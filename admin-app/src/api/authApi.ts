import api from './axiosConfig';
import { logger } from '../utils/logger';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  username: string;
  email: string;
  password: string;
  phone?: string;
  full_name?: string;
  role?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  phone?: string;
  full_name?: string;
}

export interface AuthResponse {
  status: string;
  data: {
    user: User;
    token: string;
  };
}

export interface ValidateTokenResponse {
  status: string;
  data: {
    user: User;
  };
}

export class AuthAPI {
  private baseURL = '/auth'; // FIXED: Loại bỏ /api vì axiosConfig đã có baseURL với /api

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      logger.api.request('POST /api/auth/login', { email: credentials.email });
      
      const response: any = await api.post(`${this.baseURL}/login`, credentials);
      
      logger.api.response('POST /api/auth/login', {
        status: 200,
        userId: response?.user?.id
      });

      // Interceptor đã unwrap response.data.data -> response là { user, token }
      return response as AuthResponse;
    } catch (error: any) {
      logger.api.error('POST /api/auth/login failed', error);
      throw new Error(error.response?.data?.message || 'Đăng nhập thất bại');
    }
  }

  // Signup user
  async signup(userData: SignupData): Promise<AuthResponse> {
    try {
      logger.api.request('POST /api/auth/signup', { 
        email: userData.email, 
        username: userData.username 
      });
      
      const response: any = await api.post(`${this.baseURL}/signup`, userData);
      
      logger.api.response('POST /api/auth/signup', {
        status: 200,
        userId: response?.user?.id
      });

      // Interceptor đã unwrap response.data.data -> response là { user, token }
      return response as AuthResponse;
    } catch (error: any) {
      logger.api.error('POST /api/auth/signup failed', error);
      throw new Error(error.response?.data?.message || 'Đăng ký thất bại');
    }
  }

  // Validate token
  async validateToken(): Promise<ValidateTokenResponse> {
    try {
      logger.api.request('GET /api/auth/validate');
      
      const response: any = await api.get(`${this.baseURL}/validate`);
      
      logger.api.response('GET /api/auth/validate', {
        status: 200,
        userId: response?.user?.id
      });

      // Interceptor đã unwrap response.data.data -> response là { user: {...} }
      return response as ValidateTokenResponse;
    } catch (error: any) {
      logger.api.error('GET /api/auth/validate failed', error);
      throw new Error(error.response?.data?.message || 'Token không hợp lệ');
    }
  }
}

export const authAPI = new AuthAPI();
export default authAPI;