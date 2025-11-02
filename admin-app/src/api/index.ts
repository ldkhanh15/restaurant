/**
 * API Module Index
 * 
 * Export tất cả API clients và configurations - Refactored version
 */

// New API Services - RECOMMENDED
export { default as authAPI } from './authApi';
export { default as usersAPI } from './usersApi';
export { default as dashboardAPI } from './dashboardApi';
export { default as dishesAPI } from './dishesApi';
export { default as blogAPI } from './blog';
export { default as reservationAPI } from './reservationApi';
export { default as voucherAPI } from './voucherApi';
export { default as employeeAPI } from './employeeApi';
export { default as ingredientAPI } from './ingredientApi';
export { default as reviewAPI } from './reviewApi';

// Export axios instance
export { default as api } from './axiosConfig';

// Export types from new API services
export type { 
  LoginCredentials, 
  SignupData, 
  User as AuthUser, 
  AuthResponse 
} from './authApi';

export type { 
  User, 
  CreateUserData, 
  UpdateUserData 
} from './usersApi';

export type { 
  DashboardStats, 
  RevenueStats, 
  DailyOrderStats, 
  PopularDish, 
  RecentOrder 
} from './dashboardApi';

export type { 
  Dish, 
  CreateDishData, 
  UpdateDishData, 
  DishFilters 
} from './dishesApi';

export type {
  Reservation,
  CreateReservationData,
  UpdateReservationData,
  ReservationFilters,
  TableAvailability
} from './reservationApi';

export type {
  Voucher,
  CreateVoucherData,
  UpdateVoucherData
} from './voucherApi';

export type {
  Employee,
  CreateEmployeeData,
  UpdateEmployeeData,
  AttendanceLog,
  Payroll
} from './employeeApi';

export type {
  Ingredient,
  CreateIngredientData,
  UpdateIngredientData
} from './ingredientApi';

export type {
  Review,
  CreateReviewData,
  UpdateReviewData
} from './reviewApi';

// Legacy exports (for backward compatibility)
export { default as swaggerClient } from './swaggerClient';
export { orderService } from './orderService';