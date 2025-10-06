import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../application/providers.dart';
import '../../domain/models/booking.dart';

class CartBottomSheet extends ConsumerWidget {
  final Booking booking;
  final VoidCallback onProceedToOrder;

  const CartBottomSheet({
    super.key,
    required this.booking,
    required this.onProceedToOrder,
  });

  String _formatPrice(double price) {
    return '${price.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    )}đ';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cartItems = ref.watch(cartItemsProvider);
    final cartTotal = ref.watch(cartTotalProvider);

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.8,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Text(
                  'Giỏ hàng',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                Text(
                  '${cartItems.length} món',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          
          // Cart items
          if (cartItems.isEmpty)
            const Padding(
              padding: EdgeInsets.all(32),
              child: Text('Giỏ hàng trống'),
            )
          else
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: cartItems.length,
                itemBuilder: (context, index) {
                  final item = cartItems[index];
                  return Card(
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
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            onPressed: item.quantity > 1
                                ? () => ref.read(cartItemsProvider.notifier).updateItem(
                                      item.copyWith(quantity: item.quantity - 1),
                                    )
                                : null,
                            icon: const Icon(Icons.remove),
                          ),
                          Text(
                            item.quantity.toString(),
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          IconButton(
                            onPressed: () => ref.read(cartItemsProvider.notifier).updateItem(
                              item.copyWith(quantity: item.quantity + 1),
                            ),
                            icon: const Icon(Icons.add),
                          ),
                          IconButton(
                            onPressed: () => ref.read(cartItemsProvider.notifier).removeItem(item.id),
                            icon: const Icon(Icons.delete, color: Colors.red),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          
          // Total and actions
          if (cartItems.isNotEmpty) ...[
            const Divider(),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Tổng cộng:',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        _formatPrice(cartTotal),
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: onProceedToOrder,
                      child: const Text('Tiếp tục đặt món'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
