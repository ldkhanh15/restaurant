import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../domain/models/order.dart';
import '../../../domain/models/menu.dart';
import '../../../application/providers.dart';

class OrderDetailScreen extends ConsumerWidget {
  final Order? order;
  final String? orderId;
  
  const OrderDetailScreen({super.key, this.order, this.orderId});

  String _formatPrice(double price) {
    return '${price.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.'
    )}đ';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // If order wasn't passed via extra, try to resolve it using orderId or
    // from the order history provider.
    final resolvedOrder = order ?? (() {
      final id = orderId;
      if (id != null && id.isNotEmpty) {
        try {
          return ref.read(orderHistoryProvider).firstWhere((o) => o.id == id);
        } catch (_) {
          return null;
        }
      }
      return null;
    })();

    if (resolvedOrder == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Chi tiết đơn')),
        body: Center(child: Text('Đơn hàng không tìm thấy', style: Theme.of(context).textTheme.bodyLarge)),
      );
    }

    final o = resolvedOrder;
    return Scaffold(
      appBar: AppBar(
        title: Text('Chi tiết đơn #${o.id}'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header card: status, date, booking reference, payment
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Trạng thái', style: Theme.of(context).textTheme.bodySmall),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.primary.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(o.status.name.toUpperCase(), style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.primary)),
                          ),
                          const SizedBox(height: 12),
                          Text('Ngày tạo', style: Theme.of(context).textTheme.bodySmall),
                          const SizedBox(height: 6),
                          Text('${o.createdAt.day}/${o.createdAt.month}/${o.createdAt.year} ${o.createdAt.hour}:${o.createdAt.minute.toString().padLeft(2, '0')}', style: Theme.of(context).textTheme.bodyMedium),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('Tổng', style: Theme.of(context).textTheme.bodySmall),
                        const SizedBox(height: 6),
                        Text('${o.total.toStringAsFixed(0)}đ', style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 12),
                        if (o.paymentMethod != null) Text('Thanh toán: ${o.paymentMethod!.name}', style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Items
            Text('Món ăn', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            ...o.items.map((it) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: it.image.isNotEmpty ? Image.network(it.image, width: 56, height: 56, fit: BoxFit.cover, errorBuilder: (c,e,s) => Container(width:56,height:56,color: Colors.grey[200],child: const Icon(Icons.restaurant))) : Container(width:56,height:56,color: Colors.grey[200],child: const Icon(Icons.restaurant)),
                ),
                title: Text(it.name, style: Theme.of(context).textTheme.bodyLarge),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 4),
                    Text('${it.quantity} x ${it.price.toStringAsFixed(0)}đ = ${(it.price * it.quantity).toStringAsFixed(0)}đ', style: Theme.of(context).textTheme.bodySmall),
                    if (it.customizations.isNotEmpty) Text('Tùy chọn: ${it.customizations.join(', ')}', style: Theme.of(context).textTheme.bodySmall),
                    if (it.specialNote != null) Text('Ghi chú: ${it.specialNote}', style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ),
            )).toList(),

            const SizedBox(height: 12),

            if (o.specialInstructions != null && o.specialInstructions!.isNotEmpty) ...[
              Text('Ghi chú cho nhà hàng', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              Card(child: Padding(padding: const EdgeInsets.all(12), child: Text(o.specialInstructions!))),
              const SizedBox(height: 12),
            ],

            // Totals and breakdown
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    _buildRow('Tạm tính', _formatPrice(o.subtotal), context),
                    const SizedBox(height: 8),
                    _buildRow('Phí dịch vụ', _formatPrice(o.serviceCharge), context),
                    const SizedBox(height: 8),
                    _buildRow('VAT', _formatPrice(o.tax), context),
                    const Divider(),
                    _buildRow('Tổng cộng', _formatPrice(o.total), context, isTotal: true),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Actions
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () async {
                          // Confirm before reordering to avoid accidental cart population
                          final confirm = await showDialog<bool>(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              title: const Text('Xác nhận đặt lại'),
                              content: Text('Bạn có chắc muốn thêm ${o.items.length} món này vào giỏ hàng để đặt lại?'),
                              actions: [
                                TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Hủy')),
                                ElevatedButton(onPressed: () => Navigator.of(ctx).pop(true), child: const Text('Đồng ý')),
                              ],
                            ),
                          ) ?? false;
                          if (!confirm) return;
                          // Reorder: clear cart then add items and navigate to menu
                          try {
                            final cartNotifier = ref.read(cartItemsProvider.notifier);
                            cartNotifier.clearCart();
                            for (final it in o.items) {
                              cartNotifier.addItem(CartItem(id: it.id, name: it.name, price: it.price, quantity: it.quantity, image: it.image, customizations: it.customizations, specialNote: it.specialNote));
                            }
                            context.go('/menu');
                          } catch (_) {}
                        },
                    icon: const Icon(Icons.repeat),
                    label: const Text('Đặt lại'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      // Contact restaurant placeholder
                    },
                    icon: const Icon(Icons.chat),
                    label: const Text('Liên hệ nhà hàng'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildRow(String label, String value, BuildContext context, {bool isTotal = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: isTotal ? Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold) : Theme.of(context).textTheme.bodyMedium),
        Text(value, style: isTotal ? Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.primary) : Theme.of(context).textTheme.bodyMedium),
      ],
    );
  }
}
