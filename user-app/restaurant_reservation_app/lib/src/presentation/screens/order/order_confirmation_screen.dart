import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../application/providers.dart';
import 'package:go_router/go_router.dart';
import '../../../domain/models/booking.dart';
import '../../../domain/models/order.dart';
import '../../../data/services/order_app_user_service_app_user.dart';

class OrderConfirmationScreen extends ConsumerStatefulWidget {
  final Booking booking;
  
  const OrderConfirmationScreen({super.key, required this.booking});

  @override
  ConsumerState<OrderConfirmationScreen> createState() => _OrderConfirmationScreenState();
}

class _OrderConfirmationScreenState extends ConsumerState<OrderConfirmationScreen> {
  final TextEditingController _specialInstructionsController = TextEditingController();
  bool _isConfirming = false;

  @override
  void dispose() {
    _specialInstructionsController.dispose();
    super.dispose();
  }

  String _formatPrice(double price) {
    return '${price.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    )}đ';
  }

  Future<void> _handleConfirmOrder() async {
    setState(() => _isConfirming = true);

    // Create order from cart items
    final cartItems = ref.read(cartItemsProvider);
    final subtotal = ref.read(cartTotalProvider);
    final serviceCharge = subtotal * 0.1; // 10% service charge
    final tax = (subtotal + serviceCharge) * 0.1; // 10% VAT
    final total = subtotal + serviceCharge + tax;

    final orderItems = cartItems.map((cartItem) {
      return OrderItem(
        id: cartItem.id,
        name: cartItem.name,
        price: cartItem.price,
        quantity: cartItem.quantity,
        customizations: cartItem.customizations,
        specialNote: cartItem.specialNote,
        estimatedTime: _getEstimatedTime(cartItem.name),
        image: cartItem.image,
      );
    }).toList();

    // Build payload for backend
    final payload = {
      // Prefer server reservation id if available
      'reservation_id': (widget.booking.serverId ?? widget.booking.id.toString()).toString(),
      'table_id': widget.booking.tableId.toString(),
      'user_id': null, // optional: fill if you have user info
      'total_amount': total,
      'notes': _specialInstructionsController.text.isEmpty ? null : _specialInstructionsController.text,
      'items': orderItems.map((oi) => {
        'dish_id': oi.id,
        'name': oi.name,
        'price': oi.price,
        'quantity': oi.quantity,
        'customizations': oi.customizations,
      }).toList(),
    };

    try {
      final created = await OrderAppUserService.createOrder(payload);

      // Map created order from server to local models
      final serverItems = (created['items'] as List<dynamic>?) ?? [];
      final mappedItems = serverItems.map((si) {
        return OrderItem(
          id: si['dish_id'] ?? si['id'],
          name: si['name'] ?? '',
          price: (si['price'] is num) ? (si['price'] as num).toDouble() : double.tryParse((si['price'] ?? '0').toString()) ?? 0.0,
          quantity: (si['quantity'] as int?) ?? int.tryParse((si['quantity'] ?? '1').toString()) ?? 1,
          customizations: (si['customizations'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
          specialNote: null,
          estimatedTime: 10,
          image: '',
        );
      }).toList();

      final serverOrder = Order(
        id: created['id'] ?? DateTime.now().millisecondsSinceEpoch,
        bookingId: int.tryParse(created['reservation_id']?.toString() ?? '') ?? widget.booking.id,
        items: mappedItems,
        subtotal: (created['subtotal'] is num) ? (created['subtotal'] as num).toDouble() : subtotal,
        serviceCharge: (created['serviceCharge'] is num) ? (created['serviceCharge'] as num).toDouble() : serviceCharge,
        tax: (created['tax'] is num) ? (created['tax'] as num).toDouble() : tax,
        total: (created['total_amount'] is num) ? (created['total_amount'] as num).toDouble() : total,
        status: OrderStatus.created,
        createdAt: DateTime.parse(created['created_at'] ?? DateTime.now().toIso8601String()),
        specialInstructions: created['notes'] as String?,
      );

      // Save order from server
      ref.read(currentOrderProvider.notifier).setOrder(serverOrder);
      ref.read(orderItemsProvider.notifier).setItems(mappedItems);
      ref.read(cartItemsProvider.notifier).clearCart();

      setState(() => _isConfirming = false);

      if (mounted) context.go('/kitchen-status');
    } catch (e) {
      // Fallback to local behavior
      final order = Order(
        id: DateTime.now().millisecondsSinceEpoch,
        bookingId: widget.booking.id,
        items: orderItems,
        subtotal: subtotal,
        serviceCharge: serviceCharge,
        tax: tax,
        total: total,
        status: OrderStatus.created,
        createdAt: DateTime.now(),
        specialInstructions: _specialInstructionsController.text.isEmpty
            ? null
            : _specialInstructionsController.text,
      );

      // Save order locally
      ref.read(currentOrderProvider.notifier).setOrder(order);
      ref.read(orderItemsProvider.notifier).setItems(orderItems);
      ref.read(cartItemsProvider.notifier).clearCart();

      setState(() => _isConfirming = false);
      if (mounted) context.go('/kitchen-status');
    }
  }

  void _handlePayNow() async {
    await _handleConfirmOrder();
    if (mounted) {
      context.go('/payment');
    }
  }

  int _getEstimatedTime(String itemName) {
    // Mock estimated time based on item name
    if (itemName.toLowerCase().contains('phở') || 
        itemName.toLowerCase().contains('bún')) {
      return 15;
    } else if (itemName.toLowerCase().contains('cà phê') ||
               itemName.toLowerCase().contains('nước')) {
      return 5;
    } else {
      return 10;
    }
  }

  @override
  Widget build(BuildContext context) {
    final cartItems = ref.watch(cartItemsProvider);
    final cartTotal = ref.watch(cartTotalProvider);
    final serviceCharge = cartTotal * 0.1;
    final tax = (cartTotal + serviceCharge) * 0.1;
    final total = cartTotal + serviceCharge + tax;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Xác nhận đơn hàng'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Booking info
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Thông tin bàn',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Icon(Icons.table_restaurant, size: 20, color: Theme.of(context).colorScheme.primary),
                        const SizedBox(width: 8),
                        Text(widget.booking.tableName),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(Icons.location_on, size: 20, color: Theme.of(context).colorScheme.primary),
                        const SizedBox(width: 8),
                        Text(widget.booking.location),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(Icons.people, size: 20, color: Theme.of(context).colorScheme.primary),
                        const SizedBox(width: 8),
                        Text('${widget.booking.guests} người'),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Order items
            Text(
              'Món đã chọn',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ...cartItems.map((item) => Card(
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
                trailing: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      'x${item.quantity}',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    Text(
                      _formatPrice(item.totalPrice),
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            )).toList(),

            const SizedBox(height: 16),

            // Special instructions
            Text(
              'Ghi chú đặc biệt cho bếp',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _specialInstructionsController,
              decoration: const InputDecoration(
                hintText: 'Nhập ghi chú đặc biệt cho bếp...',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),

            const SizedBox(height: 24),

            // Order summary
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Tạm tính:'),
                        Text(_formatPrice(cartTotal)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Phí dịch vụ (10%):'),
                        Text(_formatPrice(serviceCharge)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('VAT (10%):'),
                        Text(_formatPrice(tax)),
                      ],
                    ),
                    const Divider(),
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
                          _formatPrice(total),
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Action buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _isConfirming ? null : _handleConfirmOrder,
                    child: _isConfirming
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Gửi bếp & Theo dõi'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isConfirming ? null : _handlePayNow,
                    child: _isConfirming
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Text('Thanh toán ngay'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}