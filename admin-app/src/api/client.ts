import { Api } from './generated/RestaurantApi';
import { API_CONFIG, getDefaultHeaders } from './apiConfig';

/**
 * Main API Client Instance
 * Sử dụng code được sinh tự động từ Swagger
 */

// Khởi tạo API client với cấu hình
export const restaurantApi = new Api({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: getDefaultHeaders()
});

// Interceptor để tự động thêm auth token
restaurantApi.instance.interceptors.request.use((config) => {
  // Lấy token từ AsyncStorage hoặc store
  // Bạn có thể implement getAuthToken() tùy theo cách lưu trữ token
  const token = getAuthToken(); 
  
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers['Content-Type'] = 'application/json';
    config.headers['Accept'] = 'application/json';
  }
  
  // Log request trong development
  if (__DEV__) {
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.url, {
      headers: config.headers,
      data: config.data
    });
  }
  
  return config;
});

// Interceptor để xử lý response và error
restaurantApi.instance.interceptors.response.use(
  (response) => {
    // Log response trong development
    if (__DEV__) {
      console.log('✅ API Response:', response.config.url, {
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    // Log error trong development
    if (__DEV__) {
      console.error('❌ API Error:', error.config?.url, {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
    }
    
    // Handle common errors
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      // Implement handleUnauthorized() tùy theo navigation setup
      handleUnauthorized();
    }
    
    return Promise.reject(error);
  }
);

// Helper function để lấy auth token (implement theo cách lưu trữ của bạn)
function getAuthToken(): string | null {
  // TODO: Implement theo cách bạn lưu token (AsyncStorage, Zustand, etc.)
  // Ví dụ với AsyncStorage:
  // return AsyncStorage.getItem('auth_token');
  
  // Tạm thời return null, bạn cần implement
  return null;
}

// Helper function xử lý unauthorized (implement theo navigation setup)
function handleUnauthorized() {
  // TODO: Implement navigation to login screen
  // Ví dụ:
  // NavigationService.navigate('Login');
  console.warn('User unauthorized - redirect to login');
}

// Export các method chính để sử dụng trực tiếp
export const {
  // Core API modules 
  notifications,
  orders,
  reservations,
  payments
} = restaurantApi;

// Export default instance
export default restaurantApi;

/**
 * Cách sử dụng:
 * 
 * // Import
 * import { restaurantApi } from '../api/client';
 * 
 * // Sử dụng trực tiếp
 * const notifications = await restaurantApi.notifications.notificationsDetail();
 * const orders = await restaurantApi.orders.ordersList();
 * 
 * // Hoặc sử dụng method đã export
 * import { notifications } from '../api/client';
 * const notificationList = await notifications.notificationsDetail();
 */