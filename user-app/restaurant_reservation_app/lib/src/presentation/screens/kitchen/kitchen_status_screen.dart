import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../application/providers.dart';
import '../../../domain/models/order.dart';

class KitchenStatusScreen extends ConsumerStatefulWidget {
  const KitchenStatusScreen({super.key});

  @override
  ConsumerState<KitchenStatusScreen> createState() => _KitchenStatusScreenState();
}

class _KitchenStatusScreenState extends ConsumerState<KitchenStatusScreen> {
  @override
  void initState() {
    super.initState();
    // Simulate kitchen progress
    _simulateKitchenProgress();
  }

  void _simulateKitchenProgress() {
    final orderItems = ref.read(orderItemsProvider);
    if (orderItems.isEmpty) return;

    // Simulate progress every 10 seconds
    Future.delayed(const Duration(seconds: 10), () {
      if (mounted) {
        final updatedItems = orderItems.map((item) {
          if (item.kitchenStatus == KitchenStatus.pending) {
            return item.copyWith(kitchenStatus: KitchenStatus.preparing);
          } else if (item.kitchenStatus == KitchenStatus.preparing) {
            return item.copyWith(kitchenStatus: KitchenStatus.ready);
          }
          return item;
        }).toList();

        ref.read(orderItemsProvider.notifier).setItems(updatedItems);
        _simulateKitchenProgress();
      }
    });
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
        appBar: AppBar(title: const Text('Trạng thái bếp')),
        body: const Center(
          child: Text('Không có đơn hàng để theo dõi'),
        ),
      );
    }

    final overallProgress = _getOverallProgress(orderItems);
    final estimatedTime = _getEstimatedTimeRemaining(orderItems);
    final isComplete = _isOrderComplete(orderItems);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Trạng thái bếp'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              // Refresh kitchen status
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
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
                            isComplete ? 'Tất cả món đã sẵn sàng!' : 'Tiến độ chế biến',
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
            ...orderItems.map((item) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(
                    item.image,
                    width: 50,
                    height: 50,
                    fit: BoxFit.cover,
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
            )).toList(),

            const SizedBox(height: 24),

            // Action buttons
            if (isComplete) ...[
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    // Navigate to payment or complete order
                    Navigator.pushNamed(context, '/payment');
                  },
                  icon: const Icon(Icons.payment),
                  label: const Text('Thanh toán'),
                ),
              ),
            ] else ...[
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        // Mark all as served
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
        ),
      ),
    );
  }
}