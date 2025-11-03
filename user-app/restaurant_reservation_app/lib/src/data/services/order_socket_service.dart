import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../data/datasources/api_config.dart';

/// Simple order socket client to join order/table rooms and listen for realtime events
class OrderSocketService {
  IO.Socket? _socket;

  void connect({void Function()? onConnect, void Function(dynamic)? onDisconnect}) {
    try {
      _socket?.disconnect();
      _socket = IO.io(ApiConfig.baseUrl.replaceFirst(RegExp(r'^http'), 'ws') + '/order', <String, dynamic>{
        'transports': ['websocket'],
        'autoConnect': false,
        'forceNew': true,
      });

      _socket!.on('connect', (_) {
        if (onConnect != null) onConnect();
      });

      _socket!.on('disconnect', (_) {
        if (onDisconnect != null) onDisconnect(_);
      });

      _socket!.connect();
    } catch (_) {}
  }

  void disconnect() {
    try {
      _socket?.disconnect();
      _socket = null;
    } catch (_) {}
  }

  void joinOrder(String orderId) {
    try {
      _socket?.emit('joinOrder', orderId);
    } catch (_) {}
  }

  void joinTable(String tableId) {
    try {
      _socket?.emit('joinTable', tableId);
    } catch (_) {}
  }

  void onOrderStatusChanged(void Function(dynamic payload) cb) {
    try {
      _socket?.on('orderStatusChanged', (payload) {
        cb(payload);
      });
    } catch (_) {}
  }
}
