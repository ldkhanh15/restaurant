import 'dart:convert';
import '../datasources/api_config.dart';
import '../datasources/http_client_app_user.dart';

class VoucherAppUserService {
  final _client = HttpClientAppUser();

  /// Create a voucher usage on the backend. Payload should contain voucher_id, order_id, user_id
  Future<Map<String, dynamic>?> createVoucherUsage(Map<String, dynamic> payload) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/api/voucher-usages');
  final res = await _client.post(url, body: jsonEncode(payload));
    if (res.statusCode == 201 || res.statusCode == 200) {
      try {
        final body = jsonDecode(res.body);
        // backend returns { data: { ... } } or { data: { id: ..., order_id: ... } }
        if (body is Map && body['data'] != null) return body['data'] as Map<String, dynamic>;
        if (body is Map) return body.cast<String, dynamic>();
      } catch (_) {
        return null;
      }
    }
    throw Exception('Failed to create voucher usage: ${res.statusCode}');
  }
}
