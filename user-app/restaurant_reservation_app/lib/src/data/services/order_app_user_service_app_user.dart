import 'dart:convert';
import '../datasources/api_config.dart';
import '../datasources/http_client_app_user.dart';

class OrderAppUserService {
  static Uri _uri(String path) => Uri.parse(ApiConfig.baseUrl + path);

  static Future<Map<String, dynamic>> createOrder(Map<String, dynamic> payload) async {
    final client = HttpClientAppUser();
    final res = await client.post(_uri('/api/orders'), body: json.encode(payload));
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
    final res = await client.put(_uri('/api/orders/$id'), body: json.encode(payload));
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
}
