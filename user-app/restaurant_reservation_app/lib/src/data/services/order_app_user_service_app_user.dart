import 'dart:convert';
import '../datasources/api_config.dart';
import '../datasources/http_client_app_user.dart';

class OrderAppUserService {
  // NOTE: backend mounts app-user routes under /api/app_user (underscore). Use that path.
  static Uri _uri(String path) => Uri.parse('${ApiConfig.baseUrl}/api/app_user/orders$path');

  static Future<Map<String, dynamic>> createOrder(Map<String, dynamic> payload) async {
    final client = HttpClientAppUser();
    final res = await client.post(_uri(''), body: json.encode(payload));
    if (res.statusCode == 201 || res.statusCode == 200) {
      final decoded = json.decode(res.body);
      if (decoded is Map<String, dynamic>) {
        if (decoded.containsKey('data') && decoded['data'] is Map<String, dynamic>) return decoded['data'] as Map<String, dynamic>;
        return decoded;
      }
      throw Exception('Unexpected response shape when creating order');
    }
    throw Exception('Failed to create order: ${res.statusCode} ${res.body}');
  }

  static Future<Map<String, dynamic>> updateOrder(String id, Map<String, dynamic> payload) async {
    final client = HttpClientAppUser();
    final res = await client.put(_uri('/$id'), body: json.encode(payload));
    if (res.statusCode == 200) {
      final decoded = json.decode(res.body);
      if (decoded is Map<String, dynamic>) {
        if (decoded.containsKey('data') && decoded['data'] is Map<String, dynamic>) return decoded['data'] as Map<String, dynamic>;
        return decoded;
      }
      throw Exception('Unexpected response shape when updating order');
    }
    throw Exception('Failed to update order: ${res.statusCode} ${res.body}');
  }

  static Future<Map<String, dynamic>> processOrderPayment(String id, Map<String, dynamic> payload) async {
    final client = HttpClientAppUser();
    final res = await client.patch(_uri('/$id/payment'), body: json.encode(payload));
    if (res.statusCode == 200) {
      final decoded = json.decode(res.body);
      if (decoded is Map<String, dynamic>) {
        if (decoded.containsKey('data') && decoded['data'] is Map<String, dynamic>) return decoded['data'] as Map<String, dynamic>;
        return decoded;
      }
      throw Exception('Unexpected response shape when processing payment');
    }
    throw Exception('Failed to process payment: ${res.statusCode} ${res.body}');
  }

  static Future<Map<String, dynamic>> getOrderById(String id) async {
    final client = HttpClientAppUser();
    final res = await client.get(_uri('/$id'));
    if (res.statusCode == 200) {
      final decoded = json.decode(res.body);
      if (decoded is Map<String, dynamic>) {
        if (decoded.containsKey('data') && decoded['data'] is Map<String, dynamic>) return decoded['data'] as Map<String, dynamic>;
        return decoded;
      }
      throw Exception('Unexpected response shape when getting order by id');
    }
    throw Exception('Failed to get order: ${res.statusCode} ${res.body}');
  }

  /// Send an already-created order to kitchen: PATCH /api/app_user/orders/:id/send-to-kitchen
  /// Returns the updated order object.
  static Future<Map<String, dynamic>> sendToKitchen(String id) async {
    final client = HttpClientAppUser();
    final res = await client.patch(_uri('/$id/send-to-kitchen'));
    if (res.statusCode == 200) {
      final decoded = json.decode(res.body);
      if (decoded is Map<String, dynamic>) {
        if (decoded.containsKey('data') && decoded['data'] is Map<String, dynamic>) return decoded['data'] as Map<String, dynamic>;
        return decoded;
      }
      throw Exception('Unexpected response shape when sending order to kitchen');
    }
    throw Exception('Failed to send order to kitchen: ${res.statusCode} ${res.body}');
  }

  /// Fetch orders for the current authenticated user (paginated wrapper). Returns raw decoded JSON.
  static Future<List<dynamic>> fetchOrdersForUser({int page = 1, int limit = 50}) async {
    final client = HttpClientAppUser();
    final uri = _uri('?page=$page&limit=$limit');
    // debug
    // ignore: avoid_print
    print('[OrderAppUserService] GET orders uri=$uri');
    final res = await client.get(uri);
    // debug
    // ignore: avoid_print
    print('[OrderAppUserService] response status=${res.statusCode} body=${res.body}');
    if (res.statusCode == 200) {
      final decoded = json.decode(res.body);
      if (decoded is Map<String, dynamic>) {
        if (decoded.containsKey('data')) {
          final data = decoded['data'];
          // handle shapes: data: { rows: [...] } or data: { data: [...] }
          if (data is Map<String, dynamic>) {
            if (data['rows'] is List<dynamic>) return data['rows'] as List<dynamic>;
            if (data['data'] is List<dynamic>) return data['data'] as List<dynamic>;
            // some controllers return nested wrapper: data: { data: { rows: [...] } }
            if (data['data'] is Map<String, dynamic> && data['data']['rows'] is List<dynamic>) return data['data']['rows'] as List<dynamic>;
          }
        }
        // fallback: if decoded contains rows directly
        if (decoded['rows'] is List<dynamic>) return decoded['rows'] as List<dynamic>;
      }
      if (decoded is List<dynamic>) return decoded;
      return [];
    }
    throw Exception('Failed to fetch orders: ${res.statusCode} ${res.body}');
  }
}
