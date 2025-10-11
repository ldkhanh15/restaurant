import '../services/notification_app_user_service.dart';
import '../../domain/models/notification.dart';

abstract class INotificationRepository {
  Future<List<AppNotification>> getNotifications();
  Future<AppNotification> markAsRead(String id);
  Future<int> getUnreadCount();
  Future<List<AppNotification>> markAllAsRead();
  Future<void> deleteNotification(String id);
}

class NotificationRepository implements INotificationRepository {
  @override
  Future<List<AppNotification>> getNotifications() async {
    final rawData = await NotificationAppUserService.fetchNotifications();
    return rawData.map((n) => AppNotification.fromJson(n as Map<String, dynamic>)).toList();
  }

  @override
  Future<AppNotification> markAsRead(String id) async {
    final rawData = await NotificationAppUserService.markAsRead(id);
    return AppNotification.fromJson(rawData as Map<String, dynamic>);
  }

  @override
  Future<int> getUnreadCount() async {
    return await NotificationAppUserService.getUnreadCount();
  }

  @override
  Future<List<AppNotification>> markAllAsRead() async {
    final raw = await NotificationAppUserService.markAllAsRead();
    // raw might be a list or an object; try to interpret
    if (raw is List) {
      return raw.map((n) => AppNotification.fromJson(n as Map<String, dynamic>)).toList();
    }
    return [];
  }

  @override
  Future<void> deleteNotification(String id) async {
    await NotificationAppUserService.deleteNotification(id);
  }
}