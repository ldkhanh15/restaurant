import 'dart:convert';
import '../http_client_app_user.dart';

class RemoteDataSource {
  final String baseUrl;

  RemoteDataSource(this.baseUrl);

  Uri _uri(String path) => Uri.parse(baseUrl + path);

  Future<List<dynamic>> getMenuItems() async {
  final client = HttpClientAppUser();
  final res = await client.get(_uri('/menu'));
    if (res.statusCode == 200) {
      return json.decode(res.body) as List<dynamic>;
    }
    throw Exception('Failed to load menu items: ${res.statusCode}');
  }

  Future<List<dynamic>> getTables() async {
  final client = HttpClientAppUser();
  final res = await client.get(_uri('/tables'));
    if (res.statusCode == 200) {
      return json.decode(res.body) as List<dynamic>;
    }
    throw Exception('Failed to load tables: ${res.statusCode}');
  }

  Future<List<dynamic>> getReservations() async {
  final client = HttpClientAppUser();
  final res = await client.get(_uri('/reservations'));
    if (res.statusCode == 200) {
      return json.decode(res.body) as List<dynamic>;
    }
    throw Exception('Failed to load reservations: ${res.statusCode}');
  }

  Future<Map<String, dynamic>> createReservation(dynamic reservation) async {
    final client = HttpClientAppUser();
    final res = await client.post(_uri('/reservations'), body: json.encode(reservation));
    if (res.statusCode == 201 || res.statusCode == 200) {
      return json.decode(res.body) as Map<String, dynamic>;
    }
    throw Exception('Failed to create reservation: ${res.statusCode}');
  }
}
