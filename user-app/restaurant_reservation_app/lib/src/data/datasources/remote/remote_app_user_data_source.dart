import 'dart:convert';
import '../http_client_app_user.dart';

// This class will now be the single remote data source for all app_user APIs
class RemoteAppUserDataSource {
  final String baseUrl;

  RemoteAppUserDataSource(this.baseUrl);

  Uri _uri(String path, {Map<String, String>? queryParams}) {
    final uri = Uri.parse(baseUrl + path);
    if (queryParams != null && queryParams.isNotEmpty) {
      return uri.replace(queryParameters: queryParams);
    }
    return uri;
  }

  Future<List<dynamic>> getMenuItems_app_user() async {
    final client = HttpClientAppUser();
    final res = await client.get(_uri('/api/app_user/menu'));
    if (res.statusCode == 200) {
      final decoded = json.decode(res.body);
      if (decoded is List<dynamic>) return decoded;
      if (decoded is Map<String, dynamic>) {
        if (decoded['rows'] is List<dynamic>) return decoded['rows'] as List<dynamic>;
        if (decoded['data'] is List<dynamic>) return decoded['data'] as List<dynamic>;
      }
      // fallback: wrap single object into a list
      return [decoded];
    }
    throw Exception('Failed to load menu items: ${res.statusCode}');
  }

  Future<List<dynamic>> getTables_app_user() async {
    final client = HttpClientAppUser();
    final res = await client.get(_uri('/api/app_user/tables'));
    if (res.statusCode == 200) {
      final decoded = json.decode(res.body);
      if (decoded is List<dynamic>) return decoded;
      if (decoded is Map<String, dynamic>) {
        if (decoded['rows'] is List<dynamic>) return decoded['rows'] as List<dynamic>;
        if (decoded['data'] is List<dynamic>) return decoded['data'] as List<dynamic>;
        if (decoded.values.any((v) => v is List<dynamic>)) {
          return decoded.values.firstWhere((v) => v is List<dynamic>) as List<dynamic>;
        }
      }
      return [decoded];
    }
    throw Exception('Failed to load tables: ${res.statusCode}');
  }

  Future<List<dynamic>> getReservations_app_user() async {
    final client = HttpClientAppUser();
    final res = await client.get(_uri('/api/app_user/reservations'));
    if (res.statusCode == 200) {
      final decoded = json.decode(res.body);
      if (decoded is List<dynamic>) return decoded;
      if (decoded is Map<String, dynamic>) {
        if (decoded['rows'] is List<dynamic>) return decoded['rows'] as List<dynamic>;
        if (decoded['data'] is List<dynamic>) return decoded['data'] as List<dynamic>;
      }
      return [decoded];
    }
    throw Exception('Failed to load reservations: ${res.statusCode}');
  }

  Future<Map<String, dynamic>> getReservationById_app_user(String id) async {
    final client = HttpClientAppUser();
    final res = await client.get(_uri('/api/app_user/reservations/$id'));
    if (res.statusCode == 200) {
      final decoded = json.decode(res.body);
      if (decoded is Map<String, dynamic>) {
        if (decoded.containsKey('data') && decoded['data'] is Map<String, dynamic>) {
          return decoded['data'] as Map<String, dynamic>;
        }
        return decoded;
      }
      throw Exception('Unexpected response shape when getting reservation by id');
    }
    throw Exception('Failed to load reservation: ${res.statusCode}');
  }

  Future<Map<String, dynamic>> createReservation_app_user(dynamic reservation) async {
    final client = HttpClientAppUser();
    // debug: log request payload and target
    // ignore: avoid_print
    print('[RemoteAppUserDataSource] POST /api/app_user/reservations payload=${json.encode(reservation)}');
    final res = await client.post(_uri('/api/app_user/reservations'), body: json.encode(reservation));
    // debug: log response
    // ignore: avoid_print
    print('[RemoteAppUserDataSource] response status=${res.statusCode} body=${res.body}');
    if (res.statusCode == 201 || res.statusCode == 200) {
      final decoded = json.decode(res.body);
      if (decoded is Map<String, dynamic>) {
        if (decoded.containsKey('data') && decoded['data'] is Map<String, dynamic>) return decoded['data'] as Map<String, dynamic>;
        if (decoded.containsKey('rows') && decoded['rows'] is List && decoded['rows'].isNotEmpty) {
          return decoded['rows'][0] as Map<String, dynamic>;
        }
        return decoded;
      }
      throw Exception('Unexpected response shape when creating reservation');
    }
    throw Exception('Failed to create reservation: ${res.statusCode}');
  }

  Future<Map<String, dynamic>> updateReservation_app_user(String id, dynamic payload) async {
    final client = HttpClientAppUser();
    final res = await client.put(_uri('/api/app_user/reservations/$id'), body: json.encode(payload)); // Corrected path
    if (res.statusCode == 200) {
      final decoded = json.decode(res.body);
      if (decoded is Map<String, dynamic>) {
        if (decoded.containsKey('data') && decoded['data'] is Map<String, dynamic>) return decoded['data'] as Map<String, dynamic>;
        if (decoded.containsKey('reservation') && decoded['reservation'] is Map<String, dynamic>) return decoded['reservation'] as Map<String, dynamic>;
        return decoded;
      }
      throw Exception('Unexpected response shape when updating reservation');
    }
    throw Exception('Failed to update reservation: ${res.statusCode}');
  }

  Future<Map<String, dynamic>> cancelReservation_app_user(String id) async {
    final client = HttpClientAppUser();
    final res = await client.put(_uri('/api/app_user/reservations/$id/cancel')); // Corrected path
    if (res.statusCode == 200) {
      final decoded = json.decode(res.body);
      if (decoded is Map<String, dynamic>) {
        if (decoded.containsKey('data') && decoded['data'] is Map<String, dynamic>) return decoded['data'] as Map<String, dynamic>;
        return decoded;
      }
      throw Exception('Unexpected response shape when cancelling reservation'); // Corrected message
    }
    throw Exception('Failed to cancel reservation: ${res.statusCode}');
  }

  Future<Map<String, dynamic>> confirmReservation_app_user(String id) async {
    final client = HttpClientAppUser();
    final res = await client.put(_uri('/api/app_user/reservations/$id/confirm'));
    if (res.statusCode == 200) {
      final decoded = json.decode(res.body);
      if (decoded is Map<String, dynamic>) {
        if (decoded.containsKey('data') && decoded['data'] is Map<String, dynamic>) {
          return decoded['data'] as Map<String, dynamic>;
        }
        return decoded;
      }
      throw Exception('Unexpected response shape when confirming reservation');
    }
    throw Exception('Failed to confirm reservation: ${res.statusCode}');
  }

  Future<List<dynamic>> getAvailableTables_app_user() async {
    final client = HttpClientAppUser();
    final res = await client.get(_uri('/api/app_user/tables/available'));
    if (res.statusCode == 200) {
      final decoded = json.decode(res.body);
      if (decoded is List<dynamic>) return decoded;
      if (decoded is Map<String, dynamic>) {
        if (decoded['rows'] is List<dynamic>) return decoded['rows'] as List<dynamic>;
        if (decoded['data'] is List<dynamic>) return decoded['data'] as List<dynamic>;
      }
      return [decoded];
    }
    throw Exception('Failed to load available tables: ${res.statusCode}');
  }

  Future<Map<String, dynamic>> updateTableStatus_app_user(String id, String status) async {
    final client = HttpClientAppUser();
    final res = await client.put(_uri('/api/app_user/tables/$id/status'), body: json.encode({'status': status}));
    if (res.statusCode == 200) {
      final decoded = json.decode(res.body);
      if (decoded is Map<String, dynamic>) {
        if (decoded.containsKey('data') && decoded['data'] is Map<String, dynamic>) return decoded['data'] as Map<String, dynamic>;
        return decoded;
      }
      throw Exception('Unexpected response shape when updating table status');
    }
    throw Exception('Failed to update table status: ${res.statusCode}');
  }

  // --- New functions for Notification, Event, User Info, Review ---

  // Notifications
  // ...existing code...
Future<List<dynamic>> getNotifications_app_user({
  int? page,
  int? limit,
  String? sortBy,
  String? sortOrder,
}) async {
  final client = HttpClientAppUser();
  final queryParams = <String, String>{};
  if (page != null) queryParams['page'] = page.toString();
  if (limit != null) queryParams['limit'] = limit.toString();
  if (sortBy != null) queryParams['sortBy'] = sortBy;
  if (sortOrder != null) queryParams['sortOrder'] = sortOrder;

  final uri = _uri('/api/app_user/notifications', queryParams: queryParams);
  final res = await client.get(uri);
  if (res.statusCode == 200) {
    final decoded = json.decode(res.body);
    // Controller trả object phân trang { rows, count, ... }
    if (decoded is Map<String, dynamic>) {
      if (decoded['rows'] is List<dynamic>) return decoded['rows'] as List<dynamic>;
      if (decoded['data'] is List<dynamic>) return decoded['data'] as List<dynamic>;
    }
    if (decoded is List<dynamic>) return decoded;
    return [];
  }

  // Helpful debug: surface 401/403 and body
  // ignore: avoid_print
  print('[RemoteAppUserDataSource] GET /api/app_user/notifications failed status=${res.statusCode} body=${res.body}');
  throw Exception('Failed to load notifications: ${res.statusCode} ${res.body}');
}
// ...existing code...

  Future<Map<String, dynamic>> markNotificationAsRead_app_user(String id) async {
    final client = HttpClientAppUser();
    // Assuming a PUT endpoint for marking as read
    final res = await client.put(_uri('/api/app_user/notifications/$id/read'), body: json.encode({'isRead': true}));
    // Backend may not support marking as read yet and could return 400 with a descriptive message.
    if (res.statusCode == 200 || res.statusCode == 400) {
      final decoded = res.body.isNotEmpty ? json.decode(res.body) : null;
      if (decoded is Map<String, dynamic>) {
        if (decoded.containsKey('data') && decoded['data'] is Map<String, dynamic>) return decoded['data'] as Map<String, dynamic>;
        return decoded;
      }
      // No body or unexpected shape: return an empty map to allow callers to fallback to local update.
      return {};
    }
    throw Exception('Failed to mark notification as read: ${res.statusCode}');
  }

  Future<int> getUnreadCount_app_user() async {
    final client = HttpClientAppUser();
    final res = await client.get(_uri('/api/app_user/notifications/unread-count'));
    if (res.statusCode == 200) {
      final decoded = res.body.isNotEmpty ? json.decode(res.body) : null;
      if (decoded is Map<String, dynamic> && decoded['count'] is int) return decoded['count'] as int;
      if (decoded is int) return decoded;
      return int.tryParse(decoded?.toString() ?? '') ?? 0;
    }
    throw Exception('Failed to get unread notifications count: ${res.statusCode}');
  }

  Future<Map<String, dynamic>> markAllAsRead_app_user() async {
    final client = HttpClientAppUser();
    final res = await client.post(_uri('/api/app_user/notifications/read-all'));
    if (res.statusCode == 200) {
      final decoded = res.body.isNotEmpty ? json.decode(res.body) : null;
      if (decoded is Map<String, dynamic>) return decoded;
      return {};
    }
    throw Exception('Failed to mark all notifications as read: ${res.statusCode}');
  }

  Future<Map<String, dynamic>> deleteNotification_app_user(String id) async {
    final client = HttpClientAppUser();
    final res = await client.delete(_uri('/api/app_user/notifications/$id'));
    if (res.statusCode == 200 || res.statusCode == 204) {
      final decoded = res.body.isNotEmpty ? json.decode(res.body) : null;
      if (decoded is Map<String, dynamic>) return decoded;
      return {};
    }
    throw Exception('Failed to delete notification: ${res.statusCode}');
  }

  // Events
  Future<List<dynamic>> getEvents_app_user() async {
    final client = HttpClientAppUser();
    final res = await client.get(_uri('/api/app_user/events'));
    if (res.statusCode == 200) {
      final decoded = json.decode(res.body);
      if (decoded is List<dynamic>) return decoded;
      if (decoded is Map<String, dynamic>) {
        if (decoded['rows'] is List<dynamic>) return decoded['rows'] as List<dynamic>;
        if (decoded['data'] is List<dynamic>) return decoded['data'] as List<dynamic>;
      }
      return [];
    }
    throw Exception('Failed to load events: ${res.statusCode}');
  }

  Future<Map<String, dynamic>> getEventById_app_user(String id) async {
    final client = HttpClientAppUser();
    final res = await client.get(_uri('/api/app_user/events/$id'));
    if (res.statusCode == 200) {
      final decoded = json.decode(res.body);
      if (decoded is Map<String, dynamic>) {
        if (decoded.containsKey('data') && decoded['data'] is Map<String, dynamic>) return decoded['data'] as Map<String, dynamic>;
        return decoded;
      }
      throw Exception('Unexpected response shape when getting event by id');
    }
    throw Exception('Failed to load event: ${res.statusCode}');
  }

  Future<Map<String, dynamic>> createEventBooking_app_user(dynamic booking) async {
    final client = HttpClientAppUser();
    // Assuming a POST endpoint for creating event bookings
    final res = await client.post(_uri('/api/app_user/event-bookings'), body: json.encode(booking));
    if (res.statusCode == 201 || res.statusCode == 200) {
      final decoded = json.decode(res.body);
      if (decoded is Map<String, dynamic>) {
        if (decoded.containsKey('data') && decoded['data'] is Map<String, dynamic>) return decoded['data'] as Map<String, dynamic>;
        return decoded;
      }
      throw Exception('Unexpected response shape when creating event booking');
    }
    throw Exception('Failed to create event booking: ${res.statusCode}');
  }

  // User Info
  Future<Map<String, dynamic>> getUserProfile_app_user() async {
    final client = HttpClientAppUser();
    final res = await client.get(_uri('/api/app_user/user')); // Assuming this fetches the current user's profile
    if (res.statusCode == 200) {
      final decoded = json.decode(res.body);
      if (decoded is Map<String, dynamic>) {
        if (decoded.containsKey('data') && decoded['data'] is Map<String, dynamic>) return decoded['data'] as Map<String, dynamic>;
        return decoded;
      }
      throw Exception('Unexpected response shape when getting user profile');
    }
    throw Exception('Failed to load user profile: ${res.statusCode}');
  }

  Future<Map<String, dynamic>> updateUserProfile_app_user(dynamic payload) async {
    final client = HttpClientAppUser();
    final res = await client.put(_uri('/api/app_user/user'), body: json.encode(payload));
    if (res.statusCode == 200) {
      final decoded = json.decode(res.body);
      if (decoded is Map<String, dynamic>) {
        if (decoded.containsKey('data') && decoded['data'] is Map<String, dynamic>) return decoded['data'] as Map<String, dynamic>;
        return decoded;
      }
      throw Exception('Unexpected response shape when updating user profile');
    }
    throw Exception('Failed to update user profile: ${res.statusCode}');
  }

  Future<Map<String, dynamic>> getUserById_app_user(String id) async {
    final client = HttpClientAppUser();
    // Endpoint này thường dành cho admin, đảm bảo token có quyền truy cập
    final res = await client.get(_uri('/api/users/$id')); 
    if (res.statusCode == 200) {
      final decoded = json.decode(res.body);
      if (decoded is Map<String, dynamic>) {
        // Backend trả về { status: 'success', data: user }
        if (decoded.containsKey('data') && decoded['data'] is Map<String, dynamic>) {
          return decoded['data'] as Map<String, dynamic>;
        }
        return decoded;
      }
      throw Exception('Unexpected response shape when getting user by id');
    }
    throw Exception('Failed to load user by id: ${res.statusCode}');
  }

  // Reviews
  Future<List<dynamic>> getReviews_app_user() async {
    final client = HttpClientAppUser();
    final res = await client.get(_uri('/api/app_user/reviews'));
    if (res.statusCode == 200) {
      final decoded = json.decode(res.body);
      // Possible response shapes:
      // 1) [ ... ]
      // 2) { rows: [...], count: n, ... }
      // 3) { data: [...] }
      // 4) { status: 'success', data: { rows: [...], count: n } }
      if (decoded is List<dynamic>) return decoded;
      if (decoded is Map<String, dynamic>) {
        // direct rows
        if (decoded['rows'] is List<dynamic>) return decoded['rows'] as List<dynamic>;
        // direct data array
        if (decoded['data'] is List<dynamic>) return decoded['data'] as List<dynamic>;
        // wrapped pagination: { status, data: { rows, count } }
        if (decoded['data'] is Map<String, dynamic>) {
          final nested = decoded['data'] as Map<String, dynamic>;
          if (nested['rows'] is List<dynamic>) return nested['rows'] as List<dynamic>;
          if (nested['data'] is List<dynamic>) return nested['data'] as List<dynamic>;
        }
        // fallback: if any value is a List, return the first one (best-effort)
        for (final v in decoded.values) {
          if (v is List<dynamic>) return v;
        }
      }
      return <dynamic>[];
    }
    throw Exception('Failed to load reviews: ${res.statusCode}');
  }

  Future<Map<String, dynamic>> createReview_app_user(dynamic review) async {
    final client = HttpClientAppUser();
    final res = await client.post(_uri('/api/app_user/reviews'), body: json.encode(review));
    if (res.statusCode == 201 || res.statusCode == 200) {
      final decoded = json.decode(res.body);
      if (decoded is Map<String, dynamic>) {
        if (decoded.containsKey('data') && decoded['data'] is Map<String, dynamic>) return decoded['data'] as Map<String, dynamic>;
        return decoded;
      }
      throw Exception('Unexpected response shape when creating review');
    }
    throw Exception('Failed to create review: ${res.statusCode}');
  }
}
