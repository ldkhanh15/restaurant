import 'package:http/http.dart' as http;
import 'api_config.dart';

class HttpClientAppUser {
  final http.Client _client; // Make client final
  HttpClientAppUser({http.Client? client}) : _client = client ?? http.Client();

  Map<String, String> _defaultHeaders() {
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (ApiConfig.authToken.isNotEmpty) {
      // Attach bearer token for authenticated requests
      headers['Authorization'] = 'Bearer ${ApiConfig.authToken}';
    }

    // Debug: print header summary (do not print token value in full)
    try {
  final tokenLen = ApiConfig.authToken.length;
      // ignore: avoid_print
      print('[HttpClientAppUser] Default headers prepared. Authorization present: ${tokenLen > 0}, tokenLength=$tokenLen');
    } catch (_) {}
    return headers;
  }

  Future<http.Response> get(Uri url) => _client.get(url, headers: _defaultHeaders());

  Future<http.Response> post(Uri url, {Object? body}) => _client.post(url, headers: _defaultHeaders(), body: body);

  Future<http.Response> put(Uri url, {Object? body}) => _client.put(url, headers: _defaultHeaders(), body: body);

  Future<http.Response> patch(Uri url, {Object? body}) => _client.patch(url, headers: _defaultHeaders(), body: body);

  Future<http.Response> delete(Uri url) => _client.delete(url, headers: _defaultHeaders());
}
