import 'package:http/http.dart' as http;
import 'api_config.dart';

class HttpClientAppUser {
  final http.Client _client;
  HttpClientAppUser([http.Client? client]) : _client = client ?? http.Client();

  Map<String, String> _defaultHeaders() {
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (ApiConfig.authToken.isNotEmpty) {
      headers['Authorization'] = 'Bearer ${ApiConfig.authToken}';
    }
    return headers;
  }

  Future<http.Response> get(Uri url) => _client.get(url, headers: _defaultHeaders());

  Future<http.Response> post(Uri url, {Object? body}) => _client.post(url, headers: _defaultHeaders(), body: body);

  Future<http.Response> put(Uri url, {Object? body}) => _client.put(url, headers: _defaultHeaders(), body: body);

  Future<http.Response> patch(Uri url, {Object? body}) => _client.patch(url, headers: _defaultHeaders(), body: body);

  Future<http.Response> delete(Uri url) => _client.delete(url, headers: _defaultHeaders());
}
