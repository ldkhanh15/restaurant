import { Platform } from 'react-native';

// API Configuration  
export const API_CONFIG = {
  // IP của máy backend
  LOCAL_IP: '10.0.235.235', // 🔧 IP của backend server
  
  // Cổng backend
  PORT: 8000,
  
  // Timeout cho API requests
  TIMEOUT: 15000,
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
};

// Network Configuration
export const NETWORK_CONFIG = {
  // Development URLs
  DEVELOPMENT: {
    ANDROID_EMULATOR: `http://${API_CONFIG.LOCAL_IP}:${API_CONFIG.PORT}/api`,
    IOS_SIMULATOR: `http://${API_CONFIG.LOCAL_IP}:${API_CONFIG.PORT}/api`,
    PHYSICAL_DEVICE: `http://${API_CONFIG.LOCAL_IP}:${API_CONFIG.PORT}/api`,
  },
  
  // Production URL
  PRODUCTION: 'https://your-production-api.com/api',
};

// Get the appropriate base URL based on environment and platform
export const getBaseURL = (): string => {
  if (__DEV__) {
    // Development mode - sử dụng IP backend thật
    return `http://${API_CONFIG.LOCAL_IP}:${API_CONFIG.PORT}/api`;
  }
  
  // Production mode
  return NETWORK_CONFIG.PRODUCTION;
};

// Debug configuration
export const DEBUG_CONFIG = {
  ENABLE_LOGGING: __DEV__,
  LOG_REQUESTS: __DEV__,
  LOG_RESPONSES: __DEV__,
  LOG_ERRORS: true,
};

// App Configuration
export const APP_CONFIG = {
  // App name
  APP_NAME: 'Restaurant Admin',
  
  // Version
  VERSION: '1.0.0',
  
  // Features flags
  FEATURES: {
    ENABLE_PUSH_NOTIFICATIONS: true,
    ENABLE_OFFLINE_MODE: false,
    ENABLE_BIOMETRIC_LOGIN: false,
  },
};

// Storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  LAST_LOGIN: 'lastLogin',
};