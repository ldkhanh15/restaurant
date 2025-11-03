import 'dart:convert';

import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../data/datasources/api_config.dart';
import '../../data/datasources/http_client_app_user.dart';

class ChatAppUserService {
  final HttpClientAppUser _client;
  IO.Socket? _socket;
  String? _sessionId;

  ChatAppUserService(this._client);

  Future<Map<String, dynamic>> createOrGetSession({String? channel, Map<String, dynamic>? context}) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/api/app_user/chat-sessions');
    final res = await _client.post(uri, body: json.encode({'channel': channel ?? 'app', 'context': context ?? {}}));
    final decoded = json.decode(res.body) as Map<String, dynamic>;
    final data = decoded['data'] as Map<String, dynamic>;
    _sessionId = data['id'] as String;
    return data;
  }

  Future<Map<String, dynamic>> sendMessage(String messageText, {String? sessionId}) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/api/app_user/chat-messages');
    final payload = {
      if (sessionId != null) 'session_id': sessionId,
      'message_text': messageText,
      'sender_type': 'user',
    };
    final res = await _client.post(uri, body: json.encode(payload));
    final decoded = json.decode(res.body) as Map<String, dynamic>;
    final data = decoded['data'] as Map<String, dynamic>;
    _sessionId = data['session_id'] as String? ?? _sessionId;
    return data;
  }

  Future<List<dynamic>> fetchMessages(String sessionId) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/api/app_user/chat-messages/session/$sessionId');
    final res = await _client.get(uri);
    final decoded = json.decode(res.body) as Map<String, dynamic>;
    final data = decoded['data'];
    if (data is List) return data;
    if (data is Map && data['rows'] is List) return data['rows'] as List;
    return [];
  }

  void connectSocket({required String sessionId, void Function(dynamic)? onMessage}) {
    try {
      _socket?.disconnect();
      _socket = IO.io(ApiConfig.baseUrl.replaceFirst(RegExp(r'^http'), 'ws'), <String, dynamic>{
        'transports': ['websocket'],
        'autoConnect': false,
        'forceNew': true,
      });

      _socket!.on('connect', (_) {
        // Join room by sending an explicit join event if protocol requires, else server-side may join on authenticate
        try {
          _socket!.emit('join', {'room': 'session:$sessionId'});
        } catch (_) {}
      });

      _socket!.on('messageReceived', (payload) {
        if (onMessage != null) onMessage(payload);
      });

      _socket!.connect();
    } catch (_) {}
  }

  void disconnectSocket() {
    try {
      _socket?.disconnect();
      _socket = null;
    } catch (_) {}
  }
}
