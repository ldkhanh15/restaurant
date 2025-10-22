import 'dart:convert';
import '../datasources/api_config.dart';
import 'dart:io';
import '../datasources/http_client_app_user.dart';
import '../datasources/remote/remote_app_user_data_source.dart';
import '../../domain/models/user.dart';

class AuthAppUserService {
  Future<AppUser?> login(String email, String password) async {
    if (ApiConfig.baseUrl.isEmpty) return null; // Return null if not configured for remote

    final url = Uri.parse('${ApiConfig.baseUrl}/api/auth/login');
    final client = HttpClientAppUser();
    try {
      final resp = await client.post(url, body: jsonEncode({
        'email': email,
        'password': password,
        'role': 'customer' // Thêm vai trò 'customer' vào yêu cầu đăng nhập
      }));

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

        // After getting token, fetch the full user profile
        try {
          final remoteDataSource = RemoteAppUserDataSource(ApiConfig.baseUrl);
          final userProfileJson = await remoteDataSource.getUserProfile_app_user();
          final appUser = AppUser.fromJson(userProfileJson);
          ApiConfig.currentUserId = appUser.id;
          return appUser;
        } catch (e, st) {
          // ignore: avoid_print
          print('[AuthService] Failed to fetch profile after login: $e');
          // ignore: avoid_print
          print(st);
          return null; // Could not fetch full profile
        }
      } else {
        // ignore: avoid_print
        print('[AuthService] login failed with status code: ${resp.statusCode}');
        // ignore: avoid_print
        print('[AuthService] login response body: ${resp.body}');
        return null;
      }
    } on SocketException catch (e, st) {
      // ignore: avoid_print
      print('[AuthService] login error (SocketException): $e');
      // ignore: avoid_print
      print(st);
      throw Exception('Không thể kết nối đến server. Vui lòng kiểm tra lại kết nối mạng và địa chỉ server. Lỗi: $e');
    } catch (e, st) {
      // ignore: avoid_print
      print('[AuthService] login error: $e');
      // ignore: avoid_print
      print(st);
      // Return null for caller to handle (e.g., show UI error)
      return null;
    }
  }

  Future<Map<String, dynamic>?> signup(Map<String, dynamic> payload) async {
    if (ApiConfig.baseUrl.isEmpty) return null;

    final url = Uri.parse('${ApiConfig.baseUrl}/api/auth/signup');
    final client = HttpClientAppUser();
    try {
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
      } else {
        // Log error response for debugging
        // ignore: avoid_print
        print('[AuthService] signup failed with status code: ${resp.statusCode}');
        // ignore: avoid_print
        print('[AuthService] signup response body: ${resp.body}');
        // Try to decode and return for the UI to handle field-specific errors
        try {
          return jsonDecode(resp.body) as Map<String, dynamic>?;
        } catch (_) {
          return null;
        }
      }
    } catch (e, st) {
      // ignore: avoid_print
      print('[AuthService] signup error: $e');
      // ignore: avoid_print
      print(st);
      return null;
    }
  }
}
