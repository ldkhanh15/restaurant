import { Platform } from 'react-native';

// API Configuration  
export const API_CONFIG = {
  // IP của máy backend
  // Physical device with Expo Go: Use WiFi IP of your computer
  HOST: '10.0.108.226',  // WiFi IP từ ipconfig - Wireless LAN adapter Wi-Fi
  PORT: 8000,  // Backend port (be_restaurant runs on 8000)
  BASE_PATH: '/api',
  
  // Timeout cho API requests
  TIMEOUT: 30000,  // Tăng timeout lên 30s cho mobile
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
};

// Get the base URL
export const getBaseURL = (): string => {
  const url = `http://${API_CONFIG.HOST}:${API_CONFIG.PORT}${API_CONFIG.BASE_PATH}`;
  console.log('🌐 API Base URL:', url);
  console.log('📱 Platform:', Platform.OS);
  return url;
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