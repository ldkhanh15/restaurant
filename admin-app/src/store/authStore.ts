import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdminUser, login, logout as apiLogout, verifyToken, getCurrentUser, LoginRequest } from '../api/auth';
import { clearAuthData, saveAuthData, setLogoutHandler } from '../utils/authUtils';
import { STORAGE_KEYS } from '../config/appConfig';
import swaggerClient from '../api/swaggerClient';

interface AuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearAuth: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          // Clear old auth data first
          await clearAuthData();
          
          // Use swagger client for login
          const response = await swaggerClient.auth.login(credentials);
          
          if (response.data?.status === 'success' && response.data.data) {
            const authData = response.data.data;
            
            // Save new auth data
            await saveAuthData(authData.token, authData.user);
            
            set({
              user: authData.user as AdminUser,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error('Login response format invalid');
          }
        } catch (error: any) {
          await clearAuthData();
          const errorMessage = error.response?.data?.message || error.message || 'Đăng nhập thất bại';
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
            user: null,
          });
          throw new Error(errorMessage);
        }
      },
      
      logout: async () => {
        set({ isLoading: true });
        try {
          await apiLogout();
        } catch (error) {
          // Even if API logout fails, we clear local state
          console.log('Logout API error:', error);
        } finally {
          // Clear all auth data
          await clearAuthData();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },
      
      checkAuth: async () => {
        set({ isLoading: true });
        try {
          // Use swagger client to validate token
          const response = await swaggerClient.auth.validateToken();
          
          if (response.data?.status === 'success') {
            // Get user data from storage since validate doesn't return user
            const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
            const user = userJson ? JSON.parse(userJson) : null;
            
            if (user) {
              set({
                user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
            } else {
              throw new Error('User data not found');
            }
          } else {
            throw new Error('Token validation failed');
          }
        } catch (error) {
          // Token is invalid, clear everything
          await clearAuthData();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },
      
      clearAuth: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },
      
      clearError: () => set({ error: null }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Setup logout handler for axios interceptor
const authStore = useAuthStore.getState();
setLogoutHandler(() => {
  authStore.clearAuth();
});