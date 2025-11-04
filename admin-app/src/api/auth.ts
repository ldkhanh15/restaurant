import api from './axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/appConfig';

export interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'employee';
  avatar?: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AdminUser;
  token: string;
  expires_in: number;
}

// Real API authentication functions
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    console.log('🚀 Attempting login with:', credentials.email);
    const response = await api.post('/auth/login', credentials);
    
    console.log('✅ Unwrapped response (after interceptor):', response);
    
    // Interceptor đã unwrap response.data.data
    // response giờ là { user, token } trực tiếp
    const user = response.user;
    const token = response.token;
    
    if (!user || !token) {
      console.error('❌ Missing user or token');
      console.error('response:', response);
      throw new Error('Invalid response: missing user or token');
    }
    
    console.log('✅ Extracted user:', user);
    console.log('✅ Extracted token:', token.substring(0, 20) + '...');
    
    // Lưu token và user info vào AsyncStorage
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    console.log('💾 Saved token and user to AsyncStorage');
    
    return { user, token, expires_in: 3600 }; // Default 1 hour
  } catch (error: any) {
    console.log('❌ Login error:', error);
    console.log('❌ Error response:', error.response?.data);
    const errorMessage = error.response?.data?.message || error.message || 'Đăng nhập thất bại';
    throw new Error(errorMessage);
  }
};

export const logout = async (): Promise<void> => {
  try {
    // Call backend logout API (optional)
    await api.post('/auth/logout');
  } catch (error) {
    // Even if API fails, we still clear local storage
    console.log('Logout API error:', error);
  } finally {
    // Clear local storage
    await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
  }
};

export const verifyToken = async (): Promise<AdminUser> => {
  try {
    const response = await api.get('/auth/validate');
    // Response interceptor đã trả về data.data rồi, nên response chính là user object
    const user = response?.user || response;
    return user;
  } catch (error: any) {
    throw new Error('Token không hợp lệ');
  }
};

export const getCurrentUser = async (): Promise<AdminUser | null> => {
  try {
    const userStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    return null;
  }
};

export const refreshToken = async (): Promise<string> => {
  try {
    const response = await api.post('/auth/refresh');
    // Response interceptor đã trả về data.data rồi
    const newToken = response?.token || response;
    
    if (newToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, newToken);
    }
    
    return newToken;
  } catch (error: any) {
    throw new Error('Không thể làm mới token');
  }
};