import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:convert';
import '../data/services/order_socket_service.dart';
import 'providers.dart';
import '../domain/models/order.dart';

/// Global socket manager that ensures a single socket connection for order events
final orderSocketManagerProvider = Provider<OrderSocketManager>((ref) {
  final mgr = OrderSocketManager(ref: ref);
  // connect immediately when provider is created
  mgr.connect();
  ref.onDispose(() {
    mgr.dispose();
  });
  return mgr;
});

class OrderSocketManager {
  final Ref ref;
  final OrderSocketService _svc = OrderSocketService();

  OrderSocketManager({required this.ref});

  void connect() {
    try {
      _svc.connect(onConnect: () {}, onDisconnect: (_) {});
      // listen for order status updates and reconcile with providers
      _svc.onOrderStatusChanged((payload) {
        try {
          if (payload == null) return;
          final map = Map<String, dynamic>.from(payload as Map);
          final updated = Order.fromJson(map);

          // 1) update currentOrderProvider if it matches
          final current = ref.read(currentOrderProvider);
          if (current != null && current.id == updated.id) {
            ref.read(currentOrderProvider.notifier).setOrder(updated);
            // update per-item list if provided
            if (map['items'] != null) {
              try {
                final raw = map['items'];
                List<OrderItem> parsed = [];
                if (raw is List) parsed = raw.map((e) => OrderItem.fromJson(e as Map<String, dynamic>)).toList();
                else if (raw is String) {
                  try {
                    final d = jsonDecode(raw);
                    if (d is List) parsed = d.map((e) => OrderItem.fromJson(e as Map<String, dynamic>)).toList();
                    if (d is Map && d['data'] is List) parsed = (d['data'] as List).map((e) => OrderItem.fromJson(e as Map<String, dynamic>)).toList();
                  } catch (_) {}
                } else if (raw is Map && raw['data'] is List) parsed = (raw['data'] as List).map((e) => OrderItem.fromJson(e as Map<String, dynamic>)).toList();
                if (parsed.isNotEmpty) ref.read(orderItemsProvider.notifier).setItems(parsed);
              } catch (_) {}
            }
          }

          // 2) update orderHistoryProvider list (replace order if exists)
          try {
            final list = ref.read(orderHistoryProvider);
            final idx = list.indexWhere((o) => o.id == updated.id);
            if (idx != -1) {
              final copy = list.toList();
              copy[idx] = updated;
              ref.read(orderHistoryProvider.notifier).setOrders(copy);
            }
          } catch (_) {}
        } catch (_) {}
      });
    } catch (_) {}
  }

  void joinOrder(String orderId) => _svc.joinOrder(orderId);
  void joinTable(String tableId) => _svc.joinTable(tableId);

  void dispose() {
    try {
      _svc.disconnect();
    } catch (_) {}
  }
}
