/**
 * Hooks Index - Export all hooks
 */

// Auth hooks
export { useAuth } from './useAuthNew';
export type { AuthState, UseAuthReturn } from './useAuthNew';

// Real-time hooks (legacy)
export { useSocket } from './useSocket';
export type { UseSocketReturn } from './useSocket';
export { useRealtimeNotifications } from './useRealtimeNotifications';
export type { RealtimeNotification, UseRealtimeNotificationsReturn } from './useRealtimeNotifications';
export { useRealtimeOrders } from './useRealtimeOrders';
export type { OrderUpdate, UseRealtimeOrdersReturn } from './useRealtimeOrders';
export { useRealtimeReservations } from './useRealtimeReservations';
export type { ReservationUpdate, UseRealtimeReservationsReturn } from './useRealtimeReservations';

// WebSocket hooks (new namespace-based)
export { useOrderSocket } from './useOrderSocket';
export { useReservationSocket } from './useReservationSocket';
export { useDishSocket } from './useDishSocket';

// Data hooks
export { useDashboard } from './useDashboard';
export { useOrders } from './useOrders';
export { useEmployees, useEmployeeStats, useTodayShifts, useTodayAttendance, useCurrentMonthPayroll, useDepartments } from './useEmployees';
export { useMenuItems, useMenuCategories, useMenuItem, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem } from './useMenu';
export { useReservations } from './useReservations';
export { useNotifications } from './useNotifications';
export { useInventory } from './useInventory';
export { useBlogs } from './useBlogs';
export { useReviews } from './useReviews';
export { useVouchers } from './useVouchers';