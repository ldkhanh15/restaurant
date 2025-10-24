/**
 * API Module Index
 * 
 * Export tất cả API clients và configurations
 */

// Main configuration
export { default as API_CONFIG, buildApiUrl, getDefaultHeaders } from './apiConfig';

// Swagger API Client - RECOMMENDED
export { default as swaggerClient, swaggerClient as api } from './swaggerClient';

// Auto-generated API client từ Swagger (legacy)
export { default as restaurantApi, notifications, orders, reservations, payments } from './client';

// Employee API (tùy chỉnh vì chưa có trong Swagger)
export { default as employeeApi, EmployeeApi } from './employeeApi';

// Types from Swagger Client - RECOMMENDED
export type {
  ApiResponse,
  AuthResponse,
  User,
  Order,
  OrderItem,
  Employee,
  Payment,
  Notification,
  LoginRequest,
  SignupRequest
} from './swaggerClient';

// Legacy types from generated API (with aliases to avoid conflicts)
export type {
  Notification as GeneratedNotification,
  Order as GeneratedOrder,
  Reservation,
  Payment as GeneratedPayment,
  Pagination,
  Error as ApiError
} from './generated/RestaurantApi';

// Employee types from custom API
export type {
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  EmployeeFilters,
  EmployeeStats
} from './employeeApi';

// Legacy API clients (backward compatibility)
export { default as axiosConfig } from './axiosConfig';

/**
 * Quick Usage Examples:
 * 
 * // Sử dụng auto-generated API
 * import { restaurantApi, notifications } from '../api';
 * const notifs = await notifications.notificationsList();
 * 
 * // Sử dụng Employee API
 * import { employeeApi } from '../api';
 * const employees = await employeeApi.getEmployees();
 * 
 * // Configuration
 * import { API_CONFIG } from '../api';
 * console.log(API_CONFIG.BASE_URL);
 */