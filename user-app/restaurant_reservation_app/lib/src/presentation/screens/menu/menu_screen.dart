import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../application/providers.dart';
import 'package:go_router/go_router.dart';
import '../../../app/app.dart';
import '../../../domain/models/menu.dart';
import '../../../domain/models/booking.dart';
import '../../widgets/menu_item_card.dart';
import '../../widgets/cart_bottom_sheet.dart';
import '../../../data/services/order_app_user_service_app_user.dart';
import '../../../data/datasources/api_config.dart';
import '../../widgets/app_bottom_navigation.dart';
import '../../widgets/main_navigation.dart';
import '../../../domain/models/order.dart';

class MenuScreen extends ConsumerStatefulWidget {
  final Booking? booking;
  
  const MenuScreen({super.key, this.booking});

  @override
  ConsumerState<MenuScreen> createState() => _MenuScreenState();
}

class _MenuScreenState extends ConsumerState<MenuScreen> {
  String selectedCategory = 'appetizers';
  bool isOrderMode = false;
  // When true show flattened list of all menu items; when false show by-category
  bool showAllItems = true;
  String searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    print('loggggg');
    // TODO: implement api function
    super.initState();
  }


  @override
  Widget build(BuildContext context) {
    final menuCategories = ref.watch(menuCategoriesProvider);
    final cartItems = ref.watch(cartItemsProvider);
    final cartTotal = ref.watch(cartTotalProvider);

    // If menu categories are not yet loaded (empty), show a friendly loading state
    if (menuCategories.isEmpty) {
      return Scaffold(
        appBar: AppBar(
          title: Text(widget.booking != null ? 'Gọi món - ${widget.booking!.tableName}' : 'Thực đơn'),
          actions: [
            IconButton(
              icon: const Icon(Icons.search),
              onPressed: () => _showSearchDialog(),
            ),
            if (widget.booking != null)
              IconButton(
                icon: const Icon(Icons.shopping_cart),
                onPressed: () => _showCartBottomSheet(context),
              ),
          ],
        ),
        body: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

  // Ensure selectedCategory exists in the loaded categories; fallback to first category id
  final effectiveSelectedCategory = menuCategories.any((c) => c.id == selectedCategory)
    ? selectedCategory
    : (menuCategories.isNotEmpty ? menuCategories.first.id : selectedCategory);

  return Scaffold(
      appBar: AppBar(
        title: Text(widget.booking != null ? 'Gọi món - ${widget.booking!.tableName}' : 'Thực đơn'),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => _showSearchDialog(),
          ),
          if (widget.booking != null)
            IconButton(
              icon: const Icon(Icons.shopping_cart),
              onPressed: () => _showCartBottomSheet(context),
            ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
          // Toggle between 'All items' and 'By category'
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Hiển thị:'),
                Row(
                  children: [
                    TextButton(
                      onPressed: () {
                        setState(() {
                          showAllItems = true;
                        });
                      },
                      child: Text(
                        'Tất cả món',
                        style: TextStyle(
                          color: showAllItems ? Theme.of(context).colorScheme.primary : null,
                        ),
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        setState(() {
                          showAllItems = false;
                        });
                      },
                      child: Text(
                        'Theo danh mục',
                        style: TextStyle(
                          color: !showAllItems ? Theme.of(context).colorScheme.primary : null,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          
          // Menu items
          Expanded(
            child: showAllItems
                ? ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: menuCategories.expand((c) => c.items).length,
                    itemBuilder: (context, index) {
                      final allItems = menuCategories.expand((c) => c.items).toList();
                      final item = allItems[index];
                      return MenuItemCard(
                        item: item,
                        isOrderMode: widget.booking != null,
                        onAddToCart: (item, quantity, customizations, specialNote) {
                          _addToCart(item, quantity, customizations, specialNote);
                        },
                      );
                    },
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: menuCategories
                        .firstWhere((cat) => cat.id == effectiveSelectedCategory)
                        .items.length,
                    itemBuilder: (context, index) {
                      final category = menuCategories
                          .firstWhere((cat) => cat.id == effectiveSelectedCategory);
                      final item = category.items[index];
                      return MenuItemCard(
                        item: item,
                        isOrderMode: widget.booking != null,
                        onAddToCart: (item, quantity, customizations, specialNote) {
                          _addToCart(item, quantity, customizations, specialNote);
                        },
                      );
                    },
                  ),
          ),
          ],
        ),
      ),
      bottomNavigationBar: (widget.booking != null && cartItems.isNotEmpty)
          ? Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 4,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              child: SafeArea(
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${cartItems.length} món',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                          Text(
                            'Tổng: ${_formatPrice(cartTotal)}',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton.icon(
                      onPressed: () => _showCartBottomSheet(context),
                      icon: const Icon(Icons.shopping_cart),
                      label: const Text('Xem giỏ hàng'),
                    ),
                  ],
                ),
              ),
            )
          : ((context.findAncestorWidgetOfExactType<MainNavigation>() == null)
              ? const AppBottomNavigation(selectedIndex: 2)
              : null),
    );
  }

  void _addToCart(MenuItem item, int quantity, List<String> customizations, String? specialNote) {
    final cartItem = CartItem(
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: quantity,
      image: item.image,
      customizations: customizations,
      specialNote: specialNote,
    );
    
    ref.read(cartItemsProvider.notifier).addItem(cartItem);
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Đã thêm ${item.name} vào giỏ hàng'),
        action: SnackBarAction(
          label: 'Xem giỏ',
          onPressed: () => _showCartBottomSheet(context),
        ),
      ),
    );
  }

  void _showCartBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => CartBottomSheet(
        booking: widget.booking!,
        onProceedToOrder: () async {
          Navigator.pop(context);
          // Create order immediately with status 'pending' and set providers, then navigate to confirmation
          try {
            final cartItems = ref.read(cartItemsProvider);
            if (cartItems.isEmpty) {
              appRouter.push('/order-confirmation', extra: widget.booking);
              return;
            }

            // Build payload similar to OrderConfirmationScreen
            final subtotal = ref.read(cartTotalProvider);
            final serviceCharge = subtotal * 0.1;
            final tax = (subtotal + serviceCharge) * 0.1;
            final total = subtotal + serviceCharge + tax;

            final payload = {
              'reservation_id': widget.booking!.serverId ?? widget.booking!.id,
              'table_id': widget.booking!.tableId.toString(),
              'user_id': ref.read(userProvider)?.id ?? ApiConfig.currentUserId,
              'total_amount': total,
              'notes': null,
              'status': 'pending',
              'items': cartItems.map((item) => {
                'dish_id': item.id,
                'name': item.name,
                'price': item.price,
                'quantity': item.quantity,
                'customizations': item.customizations,
              }).toList(),
            };

            // If there's an existing order (pending/created) for this booking, update it
            final existingOrder = ref.read(currentOrderProvider);
            if (existingOrder != null && (existingOrder.status == OrderStatus.pending || existingOrder.status == OrderStatus.created)) {
              try {
                final updated = await OrderAppUserService.updateOrder(existingOrder.id, payload);
                final serverOrder = Order.fromJson(Map<String, dynamic>.from(updated));
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
              } catch (e) {
                // fallback to create
                final created = await OrderAppUserService.createOrder(payload);
                final serverOrder = Order.fromJson(Map<String, dynamic>.from(created));
                ref.read(currentOrderProvider.notifier).setOrder(serverOrder);
                ref.read(orderItemsProvider.notifier).setItems(serverOrder.items);
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
              }
            } else {
              final created = await OrderAppUserService.createOrder(payload);
              final serverOrder = Order.fromJson(Map<String, dynamic>.from(created));
              ref.read(currentOrderProvider.notifier).setOrder(serverOrder);
              ref.read(orderItemsProvider.notifier).setItems(serverOrder.items);

              // Keep order history in sync so 'Của tôi' shows this order
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
            }

            // Clear cart after creating order locally
            ref.read(cartItemsProvider.notifier).clearCart();

            appRouter.push('/order-confirmation', extra: widget.booking);
          } catch (e) {
            // If create fails, still navigate to confirmation so user can retry
            Navigator.pop(context);
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Không thể tạo đơn: $e')));
            appRouter.push('/order-confirmation', extra: widget.booking);
          }
        },
      ),
    );
  }

  String _formatPrice(double price) {
    return '${price.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    )}đ';
  }

  void _showSearchDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Tìm kiếm món ăn'),
        content: TextField(
          controller: _searchController,
          decoration: const InputDecoration(
            hintText: 'Nhập tên món ăn...',
            prefixIcon: Icon(Icons.search),
          ),
          onChanged: (value) {
            setState(() {
              searchQuery = value;
            });
          },
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _searchController.clear();
              setState(() {
                searchQuery = '';
              });
            },
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
            },
            child: const Text('Tìm kiếm'),
          ),
        ],
      ),
    );
  }
}