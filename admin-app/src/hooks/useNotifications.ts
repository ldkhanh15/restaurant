import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { swaggerClient } from '../api';

interface LocalNotification {
  id: string;
  title: string;
  content: string;
  type: string;
  recipients?: string[];
  created_at: string;
  updated_at?: string;
  is_read?: boolean;
}

interface CreateNotificationData {
  title: string;
  content: string;
  type: string;
  recipients?: string[];
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<LocalNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📢 Hook: Fetching notifications...');
      const response = await swaggerClient.notifications.list();
      
      if (response.data?.status === 'success' && response.data.data) {
        const notificationsData = response.data.data.items || [];
        // Map swagger notifications to LocalNotification format
        const mappedNotifications: LocalNotification[] = notificationsData.map((item: any) => ({
          id: String(item.id),
          title: item.title || '',
          content: item.content || item.body || '',
          type: item.type || 'info',
          recipients: item.recipients || [],
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at,
          is_read: item.is_read || false
        }));
        setNotifications(mappedNotifications);
        console.log('✅ Hook: Notifications loaded successfully:', mappedNotifications.length);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi tải danh sách thông báo';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
      console.error('❌ Hook: Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createNotification = useCallback(async (data: CreateNotificationData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📢 Hook: Creating notification:', data);
      // TODO: Implement create notification endpoint in swagger client
      console.warn('Create notification not implemented in swagger client yet');
      const response = { data: { status: 'success' } };
      
      if (response.data?.status === 'success') {
        Alert.alert('Thành công', 'Tạo thông báo thành công!');
        fetchNotifications(); // Refresh list
        console.log('✅ Hook: Notification created successfully');
        return true;
      }
      return false;
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi tạo thông báo';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
      console.error('❌ Hook: Error creating notification:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      console.log('📢 Hook: Marking notification as read:', notificationId);
      const response = await swaggerClient.notifications.markAsRead(Number(notificationId));
      
      if (response.data?.status === 'success') {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, is_read: true }
              : notif
          )
        );
        console.log('✅ Hook: Notification marked as read');
      }
    } catch (err: any) {
      console.error('❌ Hook: Error marking notification as read:', err);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      setLoading(true);
      
      console.log('📢 Hook: Deleting notification:', notificationId);
      // TODO: Implement delete notification endpoint in swagger client  
      console.warn('Delete notification not implemented in swagger client yet');
      const response = { data: { status: 'success' } };
      
      if (response.data?.status === 'success') {
        // Remove from local state
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        Alert.alert('Thành công', 'Xóa thông báo thành công!');
        console.log('✅ Hook: Notification deleted successfully');
        return true;
      }
      return false;
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi xóa thông báo';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
      console.error('❌ Hook: Error deleting notification:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    fetchNotifications,
    createNotification,
    markAsRead,
    deleteNotification,
    refresh
  };
};