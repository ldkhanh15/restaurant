import 'local/mock_data_source.dart';
import 'remote/remote_app_user_data_source.dart';
import 'api_config.dart';

/// Adapter that switches between remote and mock datasource depending on ApiConfig.baseUrl
class DataSourceAdapter {
  static final MockDataSource _mock = MockDataSource();
  static RemoteAppUserDataSource? _remote;

  static RemoteAppUserDataSource get _ensureRemote {
    _remote ??= RemoteAppUserDataSource(ApiConfig.baseUrl);
    return _remote!;
  }

  static Future<List<dynamic>> getMenuItems() async {
    if (ApiConfig.baseUrl.isEmpty) return _mock.getMenuItems();
    return _ensureRemote.getMenuItems_app_user();
  }

  static Future<List<dynamic>> getTables() async {
    if (ApiConfig.baseUrl.isEmpty) return _mock.getTables();
    return _ensureRemote.getTables_app_user();
  }

  static Future<List<dynamic>> getReservations() async {
    if (ApiConfig.baseUrl.isEmpty) return _mock.getReservations();
    return _ensureRemote.getReservations_app_user();
  }

  static Future<dynamic> getReservationById(String id) async {
    if (ApiConfig.baseUrl.isEmpty) {
      final list = await _mock.getReservations();
      for (final r in list) {
        try {
          if ((r as dynamic).id == id) return r;
        } catch (_) {}
      }
      return null;
    }

    return _ensureRemote.getReservationById_app_user(id);
  }

  static Future<dynamic> createReservation(dynamic reservation) async {
    if (ApiConfig.baseUrl.isEmpty) return _mock.createReservation(reservation);
    return _ensureRemote.createReservation_app_user(reservation);
  }

  static Future<dynamic> updateReservation(String id, dynamic payload) async {
    if (ApiConfig.baseUrl.isEmpty) return _mock.updateReservation(id, payload);
    return _ensureRemote.updateReservation_app_user(id, payload);
  }

  static Future<dynamic> cancelReservation(String id) async {
    if (ApiConfig.baseUrl.isEmpty) return _mock.cancelReservation(id);
    return _ensureRemote.cancelReservation_app_user(id);
  }

  static Future<dynamic> confirmReservation(String id) async {
    if (ApiConfig.baseUrl.isEmpty) return _mock.confirmReservation(id);
    return _ensureRemote.confirmReservation_app_user(id);
  }

  static Future<dynamic> updateTableStatus(String id, String status) async {
    if (ApiConfig.baseUrl.isEmpty) return _mock.updateTableStatus(id, status);
    return _ensureRemote.updateTableStatus_app_user(id, status);
  }

  // --- New adapter methods for Notification, Event, User Info, Review ---

  // Notifications
  static Future<List<dynamic>> getNotifications({
    int? page,
    int? limit,
    String? sortBy,
    String? sortOrder,
  }) async {
    if (ApiConfig.baseUrl.isEmpty) return _mock.getNotifications();
    return _ensureRemote.getNotifications_app_user(
      page: page,
      limit: limit,
      sortBy: sortBy,
      sortOrder: sortOrder,
    );
  }

  static Future<dynamic> markNotificationAsRead(String id) async {
    if (ApiConfig.baseUrl.isEmpty) return _mock.markNotificationAsRead(id);
    return _ensureRemote.markNotificationAsRead_app_user(id);
  }

  static Future<int> getUnreadCount() async {
    if (ApiConfig.baseUrl.isEmpty) {
      final list = await _mock.getNotifications();
      return list.where((n) => !(n as dynamic).isRead).length;
    }
    return _ensureRemote.getUnreadCount_app_user();
  }

  static Future<dynamic> markAllNotificationsAsRead() async {
    if (ApiConfig.baseUrl.isEmpty) return _mock.getNotifications().then((list) {
      for (var i = 0; i < list.length; i++) {
        final n = list[i] as dynamic;
        list[i] = n.copyWith(isRead: true);
      }
      return list;
    });
    return _ensureRemote.markAllAsRead_app_user();
  }

  static Future<dynamic> deleteNotification(String id) async {
    if (ApiConfig.baseUrl.isEmpty) return _mock.getNotifications().then((list) {
      list.removeWhere((n) => (n as dynamic).id == id);
      return {};
    });
    return _ensureRemote.deleteNotification_app_user(id);
  }

  // Events
  static Future<List<dynamic>> getEvents() async {
    if (ApiConfig.baseUrl.isEmpty) return _mock.getEvents();
    return _ensureRemote.getEvents_app_user();
  }

  static Future<dynamic> getEventById(String id) async {
    // Assuming mock has a similar method
    if (ApiConfig.baseUrl.isEmpty) return _mock.getEventById(id);
    return _ensureRemote.getEventById_app_user(id);
  }

  static Future<dynamic> createEventBooking(dynamic booking) async {
    if (ApiConfig.baseUrl.isEmpty) return _mock.createEventBooking(booking);
    return _ensureRemote.createEventBooking_app_user(booking);
  }

  // User Info
  static Future<dynamic> getUserProfile() async {
    if (ApiConfig.baseUrl.isEmpty) return _mock.getUserProfile();
    return _ensureRemote.getUserProfile_app_user();
  }

  static Future<dynamic> updateUserProfile(dynamic payload) async {
    if (ApiConfig.baseUrl.isEmpty) return _mock.updateUserProfile(payload);
    return _ensureRemote.updateUserProfile_app_user(payload);
  }

  // Reviews
  static Future<List<dynamic>> getReviews() async {
    if (ApiConfig.baseUrl.isEmpty) return _mock.getReviews();
    return _ensureRemote.getReviews_app_user();
  }

  static Future<dynamic> createReview(dynamic review) async {
    if (ApiConfig.baseUrl.isEmpty) return _mock.createReview(review);
    return _ensureRemote.createReview_app_user(review);
  }
}
