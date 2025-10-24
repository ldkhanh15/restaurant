/**
 * API Configuration for Restaurant Admin App
 * 
 * ⚠️ QUAN TRỌNG:
 * - Khi chạy với Expo, cần sử dụng IP LAN thay cho localhost
 * - Để lấy IP LAN: ipconfig (Windows) hoặc ifconfig (Mac/Linux)
 * - Ví dụ: http://192.168.1.100:3000/api thay vì http://localhost:3000/api
 */

// Lấy IP từ environment hoặc mặc định localhost
const getBaseURL = () => {
  // Trong môi trường development với backend mới
  const LOCAL_IP = '10.0.235.235'; // ⚠️ IP của backend server
  const PORT = '8000';
  
  // Kiểm tra nếu đang chạy trên device/emulator
  const isExpoClient = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
  
  if (__DEV__ && isExpoClient) {
    // Sử dụng IP backend khi chạy trên device/emulator
    return `http://${LOCAL_IP}:${PORT}/api`;
  }
  
  // Mặc định cho web hoặc production
  return process.env.NODE_ENV === 'production' 
    ? 'https://api.restaurant.com/api'  // Production API URL
    : `http://${LOCAL_IP}:${PORT}/api`;   // Development - sử dụng backend IP
};

export const API_CONFIG = {
  BASE_URL: getBaseURL(),
  TIMEOUT: 10000, // 10 seconds
  ENDPOINTS: {
    // Auth
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout', 
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    
    // Core entities
    EMPLOYEES: '/employees',
    USERS: '/users',
    ORDERS: '/orders',
    RESERVATIONS: '/reservations',
    DISHES: '/dishes',
    CATEGORIES: '/categories',
    TABLES: '/tables',
    
    // Operational
    NOTIFICATIONS: '/notifications',
    PAYMENTS: '/payments',
    REVIEWS: '/reviews',
    EVENTS: '/events',
    VOUCHERS: '/vouchers',
    
    // Employee management
    SHIFTS: '/shifts',
    ATTENDANCE: '/attendance', 
    PAYROLL: '/payroll',
    
    // Dashboard & Analytics
    DASHBOARD: '/dashboard',
    
    // Utilities
    HEALTH: '/health',
    API_DOCS: '/api-docs'
  }
} as const;

// Export cho backward compatibility với code hiện tại
export default API_CONFIG;

// Helper để build full URL
export const buildApiUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Headers mặc định
export const getDefaultHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * Cách cập nhật IP LAN:
 * 
 * 1. Mở Command Prompt/Terminal
 * 2. Chạy lệnh: ipconfig (Windows) hoặc ifconfig (Mac/Linux)
 * 3. Tìm IP address của WiFi adapter (thường bắt đầu bằng 192.168.x.x)
 * 4. Thay đổi giá trị LOCAL_IP ở trên
 * 5. Khởi động lại ứng dụng Expo
 */