import 'dart:convert';
import '../datasources/api_config.dart';
import '../datasources/http_client_app_user.dart';

class OrderAppUserService {
  static Uri _uri(String path) => Uri.parse('${ApiConfig.baseUrl}/api/app-user/orders$path');

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
}
