import 'dart:convert';
import '../http_client_app_user.dart';

class RemoteAppUserDataSource {
  final String baseUrl;

  RemoteAppUserDataSource(this.baseUrl);

  Uri _uri(String path) => Uri.parse(baseUrl + path);

  Future<List<dynamic>> getMenuItems_app_user() async {
    final client = HttpClientAppUser();
    final res = await client.get(_uri('/api/app_user/menu'));
    if (res.statusCode == 200) {
      final decoded = json.decode(res.body);
      if (decoded is List<dynamic>) return decoded;
      if (decoded is Map<String, dynamic>) {
        if (decoded['rows'] is List<dynamic>) return decoded['rows'] as List<dynamic>;
        if (decoded['data'] is List<dynamic>) return decoded['data'] as List<dynamic>;
        // sometimes sequelize returns an object; try to extract values array
        if (decoded.values.any((v) => v is List<dynamic>)) {
          return decoded.values.firstWhere((v) => v is List<dynamic>) as List<dynamic>;
        }
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
        if (decoded.values.any((v) => v is List<dynamic>)) {
          return decoded.values.firstWhere((v) => v is List<dynamic>) as List<dynamic>;
        }
      }
      return [decoded];
    }
    throw Exception('Failed to load reservations: ${res.statusCode}');
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
    final res = await client.put(_uri('/api/reservations/$id'), body: json.encode(payload));
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

  Future<bool> deleteReservation_app_user(String id) async {
    final client = HttpClientAppUser();
    final res = await client.delete(_uri('/api/reservations/$id'));
    if (res.statusCode == 200) {
      // backend returns { status: 'success' } or similar
      return true;
    }
    throw Exception('Failed to delete reservation: ${res.statusCode}');
  }
}
