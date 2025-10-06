import 'dart:convert';
import '../datasources/api_config.dart';
import '../datasources/http_client_app_user.dart';

class AuthAppUserService {
  Future<Map<String, dynamic>?> login(String email, String password) async {
    if (ApiConfig.baseUrl.isEmpty) return null;

    final url = Uri.parse('${ApiConfig.baseUrl}/api/auth/login');
    final client = HttpClientAppUser();
    final resp = await client.post(url, body: jsonEncode({'email': email, 'password': password}));

    // Debug: log response status and body (remove in production)
    // ignore: avoid_print
    print('[AuthService] login status: ${resp.statusCode}');
    // ignore: avoid_print
    print('[AuthService] login body: ${resp.body}');

    if (resp.statusCode == 200) {
      final body = jsonDecode(resp.body);
      // Accept both { status: 'success', data: { user, token } } or { user, token }
      final data = body['data'] ?? body;
      // If there's a token, save it to ApiConfig
      if (data != null && data['token'] != null) {
        ApiConfig.authToken = data['token'];
        // ignore: avoid_print
        print('[AuthService] saved token, length=${ApiConfig.authToken.length}');
      }
      // try to expose server user id if present in login response
      if (data != null && data['user'] != null && data['user']['id'] != null) {
        ApiConfig.currentUserId = data['user']['id'].toString();
      } else if (data != null && data['id'] != null) {
        ApiConfig.currentUserId = data['id'].toString();
      }
      return data as Map<String, dynamic>?;
    }

    return null;
  }

  Future<Map<String, dynamic>?> signup(Map<String, dynamic> payload) async {
    if (ApiConfig.baseUrl.isEmpty) return null;

    final url = Uri.parse('${ApiConfig.baseUrl}/api/auth/signup');
    final client = HttpClientAppUser();
    final resp = await client.post(url, body: jsonEncode(payload));

    if (resp.statusCode == 201 || resp.statusCode == 200) {
      final body = jsonDecode(resp.body);
      final data = body['data'] ?? body;
      if (data != null && data['token'] != null) {
        ApiConfig.authToken = data['token'];
      }
      // try to expose server user id if present
      if (data != null && data['user'] != null && data['user']['id'] != null) {
        ApiConfig.currentUserId = data['user']['id'].toString();
      }
      return data as Map<String, dynamic>?;
    }

    return null;
  }
}
