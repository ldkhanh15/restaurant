import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../application/providers.dart';
import 'package:go_router/go_router.dart';
import '../../../app/app.dart';
import 'dart:convert';
import '../../../domain/models/booking.dart';
import '../../../domain/models/order.dart';
import '../../../data/services/order_app_user_service_app_user.dart';
import '../../../data/datasources/api_config.dart';
import '../../../application/socket_manager.dart';

class OrderConfirmationScreen extends ConsumerStatefulWidget {
  final Booking booking;
  
  const OrderConfirmationScreen({super.key, required this.booking});

  @override
  ConsumerState<OrderConfirmationScreen> createState() => _OrderConfirmationScreenState();
}

class _OrderConfirmationScreenState extends ConsumerState<OrderConfirmationScreen> {
  final TextEditingController _specialInstructionsController = TextEditingController();
  bool _isConfirming = false;
  // Use global socket manager via provider

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

  // Helper to build a local order object
  Order _buildLocalOrder(List<OrderItem> orderItems) {
    final subtotal = ref.read(cartTotalProvider);
    final serviceCharge = subtotal * 0.1; // 10% service charge
    final tax = (subtotal + serviceCharge) * 0.1; // 10% VAT
    final total = subtotal + serviceCharge + tax;

    return Order(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      bookingId: widget.booking.id,
      items: orderItems,
      subtotal: subtotal,
      serviceCharge: serviceCharge,
      tax: tax,
      total: total,
      status: OrderStatus.created,
      createdAt: DateTime.now(),
      specialInstructions: _specialInstructionsController.text.trim().isEmpty
          ? null
          : _specialInstructionsController.text.trim(),
    );
  }

  Map<String, dynamic> _buildOrderPayload(Order order) {
    final payload = {
      'reservation_id': widget.booking.serverId ?? widget.booking.id,
      'table_id': widget.booking.tableId.toString(),
      // Ensure backend receives the authenticated user id when available
      'user_id': ref.read(userProvider)?.id ?? ApiConfig.currentUserId,
      'total_amount': order.total,
      'notes': order.specialInstructions,
      'items': order.items.map((oi) => {
        'dish_id': oi.id,
        'name': oi.name,
        'price': oi.price,
        'quantity': oi.quantity,
        'customizations': oi.customizations,
      }).toList(),
    };
    return payload;
  }

  Order _createOrderFromServerResponse(Map<String, dynamic> created, Order localOrder) {
    List<dynamic> _parseDynamicList(dynamic v) {
      if (v == null) return <dynamic>[];
      if (v is List<dynamic>) return v;
      if (v is String) {
        // try to decode JSON string
        try {
          final decoded = json.decode(v);
          if (decoded is List<dynamic>) return decoded;
          if (decoded is Map && decoded['data'] is List<dynamic>) return (decoded['data'] as List<dynamic>);
        } catch (_) {
          // fallback: comma separated
          return v.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
        }
      }
      if (v is Map<String, dynamic>) {
        if (v['rows'] is List<dynamic>) return (v['rows'] as List<dynamic>);
        if (v['data'] is List<dynamic>) return (v['data'] as List<dynamic>);
      }
      return <dynamic>[v];
    }

    final serverItems = _parseDynamicList(created['items']);

    

    List<String> _parseStringList(dynamic raw) {
      if (raw == null) return <String>[];
      if (raw is List<dynamic>) return raw.map((e) => e.toString()).toList();
      if (raw is String) {
        try {
          final decoded = json.decode(raw);
          if (decoded is List<dynamic>) return decoded.map((e) => e.toString()).toList();
          if (decoded is String) return decoded.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
        } catch (_) {
          return raw.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
        }
      }
      if (raw is Map && raw['data'] is List<dynamic>) return (raw['data'] as List<dynamic>).map((e) => e.toString()).toList();
      return <String>[];
    }

    final mappedItems = serverItems.map((si) {
      return OrderItem(
        id: si['dish_id']?.toString() ?? si['id']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString(),
        name: si['name'] ?? '',
        price: (si['price'] is num) ? (si['price'] as num).toDouble() : double.tryParse((si['price'] ?? '0').toString()) ?? 0.0,
        quantity: (si['quantity'] as int?) ?? int.tryParse((si['quantity'] ?? '1').toString()) ?? 1,
        customizations: _parseStringList(si['customizations']),
        specialNote: null,
        estimatedTime: 10, // Consider getting this from server or local logic
        image: '', // Consider getting this from server or local logic
      );
    }).toList();

    

    return Order(
      id: created['id']?.toString() ?? localOrder.id,
      bookingId: created['reservation_id']?.toString() ?? localOrder.bookingId,
      items: mappedItems.isNotEmpty ? mappedItems : localOrder.items,
      subtotal: (created['subtotal'] is num) ? (created['subtotal'] as num).toDouble() : localOrder.subtotal,
      serviceCharge: (created['serviceCharge'] is num) ? (created['serviceCharge'] as num).toDouble() : localOrder.serviceCharge,
      tax: (created['tax'] is num) ? (created['tax'] as num).toDouble() : localOrder.tax,
      total: (created['total_amount'] is num) ? (created['total_amount'] as num).toDouble() : localOrder.total,
      status: OrderStatus.created,
      createdAt: DateTime.tryParse(created['created_at'] ?? '') ?? localOrder.createdAt,
      specialInstructions: created['notes'] as String? ?? localOrder.specialInstructions,
    );
  }

  OrderItem _createOrderItemFromCartItem(dynamic cartItem) {
    return OrderItem(
      id: cartItem.id.toString(), // Ensure cartItem.id is treated as a string
      name: cartItem.name,
      price: cartItem.price,
      quantity: cartItem.quantity,
      customizations: cartItem.customizations,
      specialNote: cartItem.specialNote,
      estimatedTime: _getEstimatedTime(cartItem.name),
      image: cartItem.image,
    );
  }

  Future<void> _submitOrder({required String navigateTo}) async {
    setState(() => _isConfirming = true);

    final orderItems = ref.read(cartItemsProvider).map(_createOrderItemFromCartItem).toList();
    final localOrder = _buildLocalOrder(orderItems);
    final payload = _buildOrderPayload(localOrder);

    // Check if there's an existing order created previously (e.g., via "Xác nhận đặt món")
    final existingOrder = ref.read(currentOrderProvider);

    try {
      if (navigateTo == '/kitchen-status') {
        // Prefer updating an existing pending order to 'waiting_kitchen_confirmation'
        if (existingOrder != null && existingOrder.status == OrderStatus.pending) {
          final existingOrderId = existingOrder.id;
          try {
            // Optimistically set local status
            final optimistic = existingOrder.copyWith(status: OrderStatus.waitingKitchenConfirmation);
            ref.read(currentOrderProvider.notifier).setOrder(optimistic);

            // Call backend to update status
            final updated = await OrderAppUserService.sendToKitchen(existingOrderId);
            final updatedOrder = _createOrderFromServerResponse(updated, existingOrder);
            ref.read(currentOrderProvider.notifier).setOrder(updatedOrder);
            ref.read(orderItemsProvider.notifier).setItems(updatedOrder.items);

            // Sync into order history
            try {
              final list = ref.read(orderHistoryProvider);
              final idx = list.indexWhere((o) => o.id == updatedOrder.id);
              if (idx != -1) {
                final copy = list.toList();
                copy[idx] = updatedOrder;
                ref.read(orderHistoryProvider.notifier).setOrders(copy);
              } else {
                ref.read(orderHistoryProvider.notifier).addOrder(updatedOrder);
              }
            } catch (_) {}

            // Join socket room for realtime updates
            try {
              ref.read(orderSocketManagerProvider).joinOrder(existingOrderId);
            } catch (_) {}
          } catch (e) {
            // If updating existing order fails, fall back to creating a new order and sending it
            try {
              payload['status'] = 'waiting_kitchen_confirmation';
              final created = await OrderAppUserService.createOrder(payload);
              final serverOrder = _createOrderFromServerResponse(created, localOrder);
              ref.read(currentOrderProvider.notifier).setOrder(serverOrder);
              ref.read(orderItemsProvider.notifier).setItems(serverOrder.items);

                // Sync into order history
                try {
                  final list = ref.read(orderHistoryProvider);
                  final idx = list.indexWhere((o) => o.id == serverOrder.id);
                  if (idx != -1) {
                    final copy = list.toList();
                    copy[idx] = serverOrder;
                    ref.read(orderHistoryProvider.notifier).setOrders(copy);
                  } else {
                    ref.read(orderHistoryProvider.notifier).addOrder(serverOrder);
                  }
                } catch (_) {}

              final createdOrderId = created['id']?.toString() ?? serverOrder.id;
              try {
                ref.read(orderSocketManagerProvider).joinOrder(createdOrderId);
              } catch (_) {}
            } catch (e2) {
              if (mounted) ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Không thể gửi bếp ngay bây giờ: $e2')),
              );
            }
          }
        } else {
          // No existing pending order: create one with waiting status and join room
          payload['status'] = 'waiting_kitchen_confirmation';
          final created = await OrderAppUserService.createOrder(payload);
          final serverOrder = _createOrderFromServerResponse(created, localOrder);
          ref.read(currentOrderProvider.notifier).setOrder(serverOrder);
          ref.read(orderItemsProvider.notifier).setItems(serverOrder.items);

            // Sync into order history
            try {
              final list = ref.read(orderHistoryProvider);
              final idx = list.indexWhere((o) => o.id == serverOrder.id);
              if (idx != -1) {
                final copy = list.toList();
                copy[idx] = serverOrder;
                ref.read(orderHistoryProvider.notifier).setOrders(copy);
              } else {
                ref.read(orderHistoryProvider.notifier).addOrder(serverOrder);
              }
            } catch (_) {}

          final createdOrderId = created['id']?.toString() ?? serverOrder.id;
          try {
            ref.read(orderSocketManagerProvider).joinOrder(createdOrderId);
          } catch (_) {}
        }
      } else {
        // Non-kitchen flows (e.g., payment) — create order if not exists
        final created = await OrderAppUserService.createOrder(payload);
        final serverOrder = _createOrderFromServerResponse(created, localOrder);
        ref.read(currentOrderProvider.notifier).setOrder(serverOrder);
        ref.read(orderItemsProvider.notifier).setItems(serverOrder.items);
      }
    } catch (e) {
      // Fallback to local behavior if API fails
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Không thể gửi đơn hàng. Sử dụng dữ liệu tạm. Lỗi: $e')),
        );
      }
      ref.read(currentOrderProvider.notifier).setOrder(localOrder);
      ref.read(orderItemsProvider.notifier).setItems(localOrder.items);
    } finally {
      ref.read(cartItemsProvider.notifier).clearCart();
      setState(() => _isConfirming = false);
      if (mounted) {
        // Use the app-level router to ensure the top-level path is resolved
        try {
          appRouter.go(navigateTo);
        } catch (_) {
          // fallback to local context navigation if something goes wrong
          context.go(navigateTo);
        }
      }
    }
  }

  void _handleSendToKitchen() {
    _submitOrder(navigateTo: '/kitchen-status');
  }

  void _handlePayNow() {
    _submitOrder(navigateTo: '/payment');
  }

  int _getEstimatedTime(String itemName) {
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
    final orderItems = ref.watch(orderItemsProvider);
    final currentOrder = ref.watch(currentOrderProvider);

    // Prepare display items: prefer cart items, otherwise use orderItems stored from server
    final List<Map<String, dynamic>> displayItems = [];
    if (cartItems.isNotEmpty) {
      for (final ci in cartItems) {
        displayItems.add({
          'name': ci.name,
          'image': ci.image,
          'quantity': ci.quantity,
          'totalPrice': ci.totalPrice,
          'customizations': ci.customizations,
          'specialNote': ci.specialNote,
        });
      }
    } else if (orderItems.isNotEmpty) {
      for (final oi in orderItems) {
        displayItems.add({
          'name': oi.name,
          'image': oi.image,
          'quantity': oi.quantity,
          'totalPrice': oi.totalPrice,
          'customizations': oi.customizations,
          'specialNote': oi.specialNote,
        });
      }
    }

    // Compute totals: prefer cart total, then currentOrder total, then sum of displayItems
    final cartTotal = (cartItems.isNotEmpty)
        ? ref.watch(cartTotalProvider)
        : (currentOrder != null ? currentOrder.total : displayItems.fold<double>(0.0, (s, e) => s + (e['totalPrice'] as double)));
    final serviceCharge = (currentOrder != null) ? currentOrder.serviceCharge : cartTotal * 0.1;
    final tax = (currentOrder != null) ? currentOrder.tax : (cartTotal + serviceCharge) * 0.1;
    final total = (currentOrder != null) ? currentOrder.total : cartTotal + serviceCharge + tax;

    return WillPopScope(
      onWillPop: () async {
        // Intercept system back and always navigate to bookings list
        context.go('/my-bookings');
        return false; // we've handled navigation
      },
      child: Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () {
              // Always navigate back to the reservations list (Của tôi)
              context.go('/my-bookings');
            },
          ),
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
            ...displayItems.map((item) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(
                    (item['image'] as String?) ?? '',
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
                title: Text(item['name'] as String? ?? ''),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if ((item['customizations'] as List?)?.isNotEmpty ?? false)
                      Text(
                        'Tùy chỉnh: ${(item['customizations'] as List).join(', ')}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    if ((item['specialNote'] as String?) != null)
                      Text(
                        'Ghi chú: ${item['specialNote']}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                  ],
                ),
                trailing: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      'x${item['quantity']}',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    Text(
                      _formatPrice(item['totalPrice'] as double? ?? 0.0),
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
                    onPressed: _isConfirming ? null : _handleSendToKitchen,
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
      ),
    );
  }
}