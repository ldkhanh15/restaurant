import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:convert';
import 'package:intl/intl.dart';
import '../../../application/providers.dart';
import '../../../domain/models/order.dart';
import '../../../data/services/order_app_user_service_app_user.dart';
import '../../../application/socket_manager.dart';
import 'confirm_and_pay_screen.dart';
import '../../widgets/leading_back_button.dart';

class KitchenStatusScreen extends ConsumerStatefulWidget {
  const KitchenStatusScreen({super.key});

  @override
  ConsumerState<KitchenStatusScreen> createState() => _KitchenStatusScreenState();
}

class _KitchenStatusScreenState extends ConsumerState<KitchenStatusScreen> {
  @override
  void initState() {
    super.initState();
    // Join order room and fetch initial items
    Future.microtask(() async {
      try {
        final current = ref.read(currentOrderProvider);
        if (current == null) return;
        try {
          ref.read(orderSocketManagerProvider).joinOrder(current.id);
        } catch (_) {}

  final raw = await OrderAppUserService.getOrderById(current.id);
  // parse items defensively
        try {
          final rawItems = raw['items'];
          List<OrderItem> parsedItems = [];
          if (rawItems is List<dynamic>) {
            parsedItems = rawItems.map((e) => OrderItem.fromJson(e as Map<String, dynamic>)).toList();
          } else if (rawItems is String) {
            try {
              final decoded = jsonDecode(rawItems);
              if (decoded is List<dynamic>) parsedItems = decoded.map((e) => OrderItem.fromJson(e as Map<String, dynamic>)).toList();
              if (decoded is Map && decoded['data'] is List<dynamic>) parsedItems = (decoded['data'] as List<dynamic>).map((e) => OrderItem.fromJson(e as Map<String, dynamic>)).toList();
            } catch (_) {
              parsedItems = [];
            }
          } else if (rawItems is Map) {
            if (rawItems['rows'] is List<dynamic>) parsedItems = (rawItems['rows'] as List<dynamic>).map((e) => OrderItem.fromJson(e as Map<String, dynamic>)).toList();
            if (rawItems['data'] is List<dynamic>) parsedItems = (rawItems['data'] as List<dynamic>).map((e) => OrderItem.fromJson(e as Map<String, dynamic>)).toList();
          }

          if (parsedItems.isNotEmpty) ref.read(orderItemsProvider.notifier).setItems(parsedItems);
        } catch (_) {}
      } catch (_) {}
    });
  }

  bool _isUpdating = false;
  bool _autoReloaded = false;

  Future<void> _setOrderStatus(String status) async {
    final currentOrder = ref.read(currentOrderProvider);
    if (currentOrder == null) return;
    setState(() => _isUpdating = true);
    try {
      final messenger = ScaffoldMessenger.of(context);
      final updated = await OrderAppUserService.updateOrder(currentOrder.id, {'status': status});
      // updated should be a Map representing the order
      final updatedOrder = Order.fromJson(Map<String, dynamic>.from(updated));
      ref.read(currentOrderProvider.notifier).setOrder(updatedOrder);

      // update order items if provided; parse defensively
      try {
        final rawItems = updated['items'];
        List<OrderItem> parsedItems = [];
        if (rawItems is List<dynamic>) {
          parsedItems = rawItems.map((e) => OrderItem.fromJson(e as Map<String, dynamic>)).toList();
        } else if (rawItems is String) {
          try {
            final decoded = jsonDecode(rawItems);
            if (decoded is List<dynamic>) parsedItems = decoded.map((e) => OrderItem.fromJson(e as Map<String, dynamic>)).toList();
            if (decoded is Map && decoded['data'] is List<dynamic>) parsedItems = (decoded['data'] as List<dynamic>).map((e) => OrderItem.fromJson(e as Map<String, dynamic>)).toList();
          } catch (_) {
            parsedItems = [];
          }
        } else if (rawItems is Map) {
          if (rawItems['rows'] is List<dynamic>) parsedItems = (rawItems['rows'] as List<dynamic>).map((e) => OrderItem.fromJson(e as Map<String, dynamic>)).toList();
          if (rawItems['data'] is List<dynamic>) parsedItems = (rawItems['data'] as List<dynamic>).map((e) => OrderItem.fromJson(e as Map<String, dynamic>)).toList();
        }

        if (parsedItems.isNotEmpty) {
          ref.read(orderItemsProvider.notifier).setItems(parsedItems);
        }
      } catch (_) {}

      if (!mounted) return;
      messenger.showSnackBar(SnackBar(content: Text('Cập nhật trạng thái: $status')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Không thể cập nhật trạng thái: $e')));
    } finally {
      if (mounted) setState(() => _isUpdating = false);
    }
  }

  Future<void> _reloadOrderFromServer() async {
    try {
      final co = ref.read(currentOrderProvider);
      if (co == null) return;
  final raw = await OrderAppUserService.getOrderById(co.id);

      // Update current order if server returned order payload
      try {
        final updatedOrder = Order.fromJson(Map<String, dynamic>.from(raw));
        ref.read(currentOrderProvider.notifier).setOrder(updatedOrder);
      } catch (_) {}

      // Update items defensively
      try {
  final rawItems = raw['items'];
        List<OrderItem> parsedItems = [];
        if (rawItems is List<dynamic>) {
          parsedItems = rawItems.map((e) => OrderItem.fromJson(e as Map<String, dynamic>)).toList();
        } else if (rawItems is String) {
          final decoded = jsonDecode(rawItems);
          if (decoded is List<dynamic>) parsedItems = decoded.map((e) => OrderItem.fromJson(e as Map<String, dynamic>)).toList();
          if (decoded is Map && decoded['data'] is List<dynamic>) parsedItems = (decoded['data'] as List<dynamic>).map((e) => OrderItem.fromJson(e as Map<String, dynamic>)).toList();
        } else if (rawItems is Map) {
          if (rawItems['rows'] is List<dynamic>) parsedItems = (rawItems['rows'] as List<dynamic>).map((e) => OrderItem.fromJson(e as Map<String, dynamic>)).toList();
          if (rawItems['data'] is List<dynamic>) parsedItems = (rawItems['data'] as List<dynamic>).map((e) => OrderItem.fromJson(e as Map<String, dynamic>)).toList();
        }

        if (parsedItems.isNotEmpty) ref.read(orderItemsProvider.notifier).setItems(parsedItems);
      } catch (_) {}
    } catch (_) {}
  }

  List<OrderItem> _deriveDisplayItems(List<OrderItem> items, Order? order) {
    if (order == null) return items;
    switch (order.status) {
      case OrderStatus.waitingKitchenConfirmation:
        return items.map((i) => i.copyWith(kitchenStatus: KitchenStatus.pending)).toList();
      case OrderStatus.preparing:
        return items.map((i) {
          if (i.kitchenStatus == KitchenStatus.ready || i.kitchenStatus == KitchenStatus.served) return i;
          return i.copyWith(kitchenStatus: KitchenStatus.preparing);
        }).toList();
      case OrderStatus.ready:
        return items.map((i) => i.copyWith(kitchenStatus: KitchenStatus.ready)).toList();
      default:
        return items;
    }
  }

  String _getStatusText(KitchenStatus status) {
    switch (status) {
      case KitchenStatus.pending:
        return 'Chờ xử lý';
      case KitchenStatus.preparing:
        return 'Đang chế biến';
      case KitchenStatus.ready:
        return 'Sẵn sàng';
      case KitchenStatus.served:
        return 'Đã phục vụ';
    }
  }

  Color _getStatusColor(KitchenStatus status) {
    switch (status) {
      case KitchenStatus.pending:
        return Colors.orange;
      case KitchenStatus.preparing:
        return Colors.blue;
      case KitchenStatus.ready:
        return Colors.green;
      case KitchenStatus.served:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(KitchenStatus status) {
    switch (status) {
      case KitchenStatus.pending:
        return Icons.schedule;
      case KitchenStatus.preparing:
        return Icons.restaurant;
      case KitchenStatus.ready:
        return Icons.check_circle;
      case KitchenStatus.served:
        return Icons.done_all;
    }
  }

  double _getOverallProgress(List<OrderItem> items) {
    if (items.isEmpty) return 0.0;
    final completedCount = items.where((item) => 
      item.kitchenStatus == KitchenStatus.ready || 
      item.kitchenStatus == KitchenStatus.served
    ).length;
    return completedCount / items.length;
  }

  int _getEstimatedTimeRemaining(List<OrderItem> items) {
    final pendingItems = items.where((item) => 
      item.kitchenStatus == KitchenStatus.pending || 
      item.kitchenStatus == KitchenStatus.preparing
    );
    
    if (pendingItems.isEmpty) return 0;
    
    return pendingItems.fold(0, (sum, item) => sum + item.estimatedTime);
  }

  bool _isOrderComplete(List<OrderItem> items) {
    return items.every((item) => 
      item.kitchenStatus == KitchenStatus.ready || 
      item.kitchenStatus == KitchenStatus.served
    );
  }

  @override
  Widget build(BuildContext context) {
    final orderItems = ref.watch(orderItemsProvider);
    final currentOrder = ref.watch(currentOrderProvider);

    if (currentOrder == null) {
      return Scaffold(
        appBar: AppBar(
          leading: const LeadingBackButton(),
          title: const Text('Trạng thái bếp'),
        ),
        body: const Center(
          child: Text('Không có đơn hàng để theo dõi'),
        ),
      );
    }

    // Prefer items from the provider, but if empty try to use items embedded on the currentOrder
    final rawItems = orderItems.isNotEmpty ? orderItems : (currentOrder.items.isNotEmpty ? currentOrder.items : <OrderItem>[]);

    // If there are no items yet, attempt a one-time automatic reload from server to fetch details
    if (rawItems.isEmpty && !_autoReloaded) {
      _autoReloaded = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _reloadOrderFromServer();
      });
    }
    // Derive display items from order.status so UI reacts to server/state changes
    final displayItems = _deriveDisplayItems(rawItems, currentOrder);

    final overallProgress = _getOverallProgress(displayItems);
    final estimatedTime = _getEstimatedTimeRemaining(displayItems);
    // Consider the order completed when all items are ready/served OR the order status is 'ready'
    final isComplete = _isOrderComplete(displayItems) || currentOrder.status == OrderStatus.ready;

    // Map order-level status to a friendly title for the top card
    String topTitle;
    if (currentOrder.status == OrderStatus.waitingKitchenConfirmation) {
      topTitle = 'Chờ xử lý';
    } else if (currentOrder.status == OrderStatus.preparing) {
      topTitle = 'Đang chế biến';
    } else if (currentOrder.status == OrderStatus.ready) {
      topTitle = 'Đang lên món';
    } else {
      topTitle = isComplete ? 'Tất cả món đã sẵn sàng!' : 'Tiến độ chế biến';
    }

    final itemCount = rawItems.length;
    final statusText = currentOrder.status.name;
    final createdAtStr = DateFormat('yyyy-MM-dd HH:mm').format(currentOrder.createdAt.toLocal());

    return Scaffold(
      appBar: AppBar(
        title: const Text('Trạng thái bếp'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _reloadOrderFromServer(),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Order header
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(color: Theme.of(context).colorScheme.primary.withOpacity(0.08), borderRadius: BorderRadius.circular(10)),
                      child: const Icon(Icons.restaurant_menu, size: 28, color: Colors.deepPurple),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Order #${currentOrder.id}', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 6),
                          Text('$statusText • $itemCount món', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                        ],
                      ),
                    ),
                    Text(createdAtStr, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            // Overall progress
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Icon(
                          isComplete ? Icons.check_circle : Icons.restaurant,
                          color: isComplete ? Colors.green : Theme.of(context).colorScheme.primary,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            topTitle,
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    LinearProgressIndicator(
                      value: overallProgress,
                      backgroundColor: Colors.grey[300],
                      valueColor: AlwaysStoppedAnimation<Color>(
                        isComplete ? Colors.green : Theme.of(context).colorScheme.primary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${(overallProgress * 100).toInt()}% hoàn thành',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    if (estimatedTime > 0 && !isComplete) ...[
                      const SizedBox(height: 8),
                      Text(
                        'Thời gian ước tính: $estimatedTime phút',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Order items status
            Text(
              'Trạng thái từng món',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            if (displayItems.isEmpty) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline),
                      const SizedBox(width: 8),
                      const Expanded(child: Text('Chưa có món nào. Nhấn làm mới để tải lại.')),
                              TextButton(onPressed: () => _reloadOrderFromServer(), child: const Text('Làm mới'))
                    ],
                  ),
                ),
              ),
            ] else ...[
              for (final item in displayItems) Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      item.image,
                      width: 50,
                      height: 50,
                      fit: BoxFit.cover,
                      loadingBuilder: (context, child, loadingProgress) {
                        if (loadingProgress == null) return child;
                        return Container(width:50,height:50,alignment: Alignment.center, child: SizedBox(width:16,height:16, child: CircularProgressIndicator(strokeWidth:2)));
                      },
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          width: 50,
                          height: 50,
                          color: Colors.grey[300],
                          child: const Icon(Icons.restaurant),
                        );
                      },
                    ),
                  ),
                  title: Text(item.name),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Số lượng: ${item.quantity}'),
                      if (item.customizations.isNotEmpty)
                        Text(
                          'Tùy chỉnh: ${item.customizations.join(', ')}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      if (item.specialNote != null)
                        Text(
                          'Ghi chú: ${item.specialNote}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                    ],
                  ),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        _getStatusIcon(item.kitchenStatus),
                        color: _getStatusColor(item.kitchenStatus),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _getStatusText(item.kitchenStatus),
                        style: TextStyle(
                          color: _getStatusColor(item.kitchenStatus),
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],

            const SizedBox(height: 24),

            // Action buttons
                    if (isComplete) ...[
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: () {
                            // Navigate to confirm & pay screen
                            Navigator.push(context, MaterialPageRoute(builder: (_) => const ConfirmAndPayScreen()));
                          },
                          icon: const Icon(Icons.check_circle),
                          label: const Text('Xác nhận món và thanh toán'),
                        ),
                      ),
                    ] else ...[
                      // Show kitchen-specific actions depending on order.status
                      if (_isUpdating) ...[
                        const Center(child: CircularProgressIndicator()),
                      ] else if (currentOrder.status == OrderStatus.waitingKitchenConfirmation) ...[
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: () => _setOrderStatus('preparing'),
                                icon: const Icon(Icons.restaurant),
                                label: const Text('Bắt đầu chế biến'),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () => _setOrderStatus('cancelled'),
                                icon: const Icon(Icons.cancel),
                                label: const Text('Hủy đơn'),
                              ),
                            ),
                          ],
                        ),
                      ] else if (currentOrder.status == OrderStatus.preparing) ...[
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: () => _setOrderStatus('ready'),
                                icon: const Icon(Icons.check_circle),
                                label: const Text('Hoàn tất lên món'),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () => _setOrderStatus('cancelled'),
                                icon: const Icon(Icons.cancel),
                                label: const Text('Hủy đơn'),
                              ),
                            ),
                          ],
                        ),
                      ] else if (currentOrder.status == OrderStatus.ready) ...[
                        SizedBox(
                          width: double.infinity,
                              child: ElevatedButton.icon(
                                onPressed: () {
                                  // Open Confirm & Pay first so user can choose vouchers and totals are computed there
                                  Navigator.push(context, MaterialPageRoute(builder: (_) => const ConfirmAndPayScreen()));
                                },
                                icon: const Icon(Icons.check_circle),
                                label: const Text('Xác nhận món và thanh toán'),
                              ),
                        ),
                      ] else ...[
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () {
                                  // Mark all as served locally
                                  final updatedItems = orderItems.map((item) => 
                                    item.copyWith(kitchenStatus: KitchenStatus.served)
                                  ).toList();
                                  ref.read(orderItemsProvider.notifier).setItems(updatedItems);
                                },
                                icon: const Icon(Icons.done_all),
                                label: const Text('Đánh dấu đã phục vụ'),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: () {
                                  // Refresh status
                                },
                                icon: const Icon(Icons.refresh),
                                label: const Text('Làm mới'),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ],
                ),
              ),
            );
          }

          @override
          void dispose() {
            try {
              ref.read(orderSocketManagerProvider).dispose();
            } catch (_) {}
            super.dispose();
          }
        }