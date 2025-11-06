import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';

export interface RealtimeNotification {
  id: string;
  type: 'order' | 'reservation' | 'review' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

export interface UseRealtimeNotificationsReturn {
  notifications: RealtimeNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
  onNewNotification: (callback: (notification: any) => void) => () => void;
}

export const useRealtimeNotifications = (): UseRealtimeNotificationsReturn => {
  const { socket, isConnected, on, off } = useSocket();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Handle new notification
  const handleNewNotification = useCallback((notification: RealtimeNotification) => {
    console.log('🔔 New realtime notification received:', notification);
    
    setNotifications(prev => [notification, ...prev]);
    
    // You can add sound/vibration here
    // Vibration.vibrate();
  }, []);

  // Listen to notification events
  useEffect(() => {
    if (!isConnected || !socket) return;

    console.log('🔔 Setting up realtime notification listeners...');

    // Listen to various notification types
    on('notification', handleNewNotification);
    
    on('orderCreated', (order: any) => {
      handleNewNotification({
        id: `order-${order.id}-${Date.now()}`,
        type: 'order',
        title: 'Đơn hàng mới',
        message: `Đơn hàng #${order.id} từ bàn ${order.table_id || 'N/A'}`,
        data: order,
        read: false,
        created_at: new Date().toISOString(),
      });
    });

    on('reservationCreated', (reservation: any) => {
      handleNewNotification({
        id: `reservation-${reservation.id}-${Date.now()}`,
        type: 'reservation',
        title: 'Đặt bàn mới',
        message: `Khách hàng ${reservation.customer_name} đặt bàn lúc ${reservation.reservation_time}`,
        data: reservation,
        read: false,
        created_at: new Date().toISOString(),
      });
    });

    on('reviewCreated', (review: any) => {
      handleNewNotification({
        id: `review-${review.id}-${Date.now()}`,
        type: 'review',
        title: 'Đánh giá mới',
        message: `Đánh giá ${review.rating} sao từ khách hàng`,
        data: review,
        read: false,
        created_at: new Date().toISOString(),
      });
    });

    return () => {
      off('notification');
      off('orderCreated');
      off('reservationCreated');
      off('reviewCreated');
    };
  }, [isConnected, socket, on, off, handleNewNotification]);

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Clear a notification
  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Expose onNewNotification for external use
  const onNewNotification = useCallback((callback: (notification: any) => void) => {
    on('notification', callback);
    return () => {
      off('notification', callback);
    };
  }, [on, off]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
    onNewNotification,
  };
};
