import '../datasources/data_source_adapter.dart';

class NotificationAppUserService {
  static Future<List<dynamic>> fetchNotifications({
    int? page,
    int? limit,
    String? sortBy,
    String? sortOrder,
  }) async {
    return DataSourceAdapter.getNotifications(
      page: page,
      limit: limit,
      sortBy: sortBy,
      sortOrder: sortOrder,
    );
  }

  static Future<dynamic> markAsRead(String id) async {
    return DataSourceAdapter.markNotificationAsRead(id);
  }

  static Future<int> getUnreadCount() async {
    return DataSourceAdapter.getUnreadCount();
  }

  static Future<dynamic> markAllAsRead() async {
    return DataSourceAdapter.markAllNotificationsAsRead();
  }

  static Future<dynamic> deleteNotification(String id) async {
    return DataSourceAdapter.deleteNotification(id);
  }
}