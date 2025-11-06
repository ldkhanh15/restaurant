import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, type LoginCredentials, type SignupData, type AuthUser } from '../api';
import { STORAGE_KEYS } from '../config/appConfig';
import { logger } from '../utils/logger';
import { useAuthStore } from '../store/authStore'; // Import store để sync

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface UseAuthReturn extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  validateToken: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  // Get auth store methods to sync state
  const authStore = useAuthStore();
  
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true, // Start with loading true to check stored auth
    error: null,
  });

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Set loading state
  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  // Set error state
  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  // Set authenticated state + sync with store
  const setAuthenticated = useCallback((user: AuthUser, token: string) => {
    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
    
    // Sync with authStore to trigger navigation
    authStore.checkAuth();
  }, [authStore]);

  // Set unauthenticated state
  const setUnauthenticated = useCallback(() => {
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  // Store auth data
  const storeAuthData = useCallback(async (user: AuthUser, token: string) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token),
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
      ]);
      logger.info('Auth data stored successfully');
    } catch (error) {
      logger.auth.error('Failed to store auth data', error);
      throw new Error('Không thể lưu dữ liệu đăng nhập');
    }
  }, []);

  // Clear auth data
  const clearAuthData = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
      ]);
      logger.info('Auth data cleared successfully');
    } catch (error) {
      logger.auth.error('Failed to clear auth data', error);
    }
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      clearError();

      logger.auth.login('Login attempt', { email: credentials.email });

      const response = await authAPI.login(credentials);
      // authAPI.login now returns { user, token } directly (from auth.ts)
      const { user, token } = response;

      await storeAuthData(user, token);
      setAuthenticated(user, token);

      logger.auth.login('Login successful', { userId: user.id });
    } catch (error: any) {
      const errorMessage = error.message || 'Đăng nhập thất bại';
      logger.auth.error('Login failed', error);
      setError(errorMessage);
      throw error;
    }
  }, [setLoading, clearError, storeAuthData, setAuthenticated, setError]);

  // Signup function
  const signup = useCallback(async (userData: SignupData) => {
    try {
      setLoading(true);
      clearError();

      logger.info('Signup attempt', { email: userData.email });

      const response = await authAPI.signup(userData);
      // authAPI.signup() đã return unwrapped response: { user, token }
      const { user, token } = response;

      await storeAuthData(user, token);
      setAuthenticated(user, token);

      logger.info('Signup successful', { userId: user.id });
    } catch (error: any) {
      const errorMessage = error.message || 'Đăng ký thất bại';
      logger.auth.error('Signup failed', error);
      setError(errorMessage);
      throw error;
    }
  }, [setLoading, clearError, storeAuthData, setAuthenticated, setError]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      logger.auth.logout('Logout attempt');

      await clearAuthData();
      setUnauthenticated();

      logger.auth.logout('Logout successful');
    } catch (error: any) {
      logger.auth.error('Logout failed', error);
      // Even if logout fails, clear local state
      setUnauthenticated();
    }
  }, [setLoading, clearAuthData, setUnauthenticated]);

  // Validate token function
  const validateToken = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      
      if (!storedToken) {
        setUnauthenticated();
        return;
      }

      logger.info('Token validation');

      const response = await authAPI.validateToken();
      // authAPI.validateToken() đã return unwrapped response: { user: {...} }
      const { user } = response;

      setAuthenticated(user, storedToken);
      logger.info('Token validation successful', { userId: user.id });
    } catch (error: any) {
      logger.auth.error('Token validation failed', error);
      await clearAuthData();
      setUnauthenticated();
    }
  }, [setAuthenticated, setUnauthenticated, clearAuthData]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!state.isAuthenticated) return;

    try {
      await validateToken();
    } catch (error) {
      logger.auth.error('Failed to refresh user data', error);
    }
  }, [state.isAuthenticated, validateToken]);

  // Initialize auth state on mount
  useEffect(() => {
    validateToken();
  }, [validateToken]);

  return {
    ...state,
    login,
    signup,
    logout,
    validateToken,
    clearError,
    refreshUser,
  };
};