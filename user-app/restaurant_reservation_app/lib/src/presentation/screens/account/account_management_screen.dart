import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../application/providers.dart';
import '../../../application/socket_manager.dart';
import '../../../app/app.dart';
import '../order/order_detail_screen.dart';
import '../../../data/datasources/api_config.dart';
import '../../../domain/models/user.dart';
import '../../../domain/models/order.dart';
import '../../../data/services/reservation_app_user_service_app_user.dart';
import '../../widgets/main_navigation.dart';
// ...existing imports...

class AccountManagementScreen extends ConsumerStatefulWidget {
  final String? initialTab;
  final String? initialOrderId;
  const AccountManagementScreen({super.key, this.initialTab, this.initialOrderId});

  @override
  ConsumerState<AccountManagementScreen> createState() => _AccountManagementScreenState();
}

class _AccountManagementScreenState extends ConsumerState<AccountManagementScreen> {
  String activeTab = 'profile';
  bool isEditing = false;
  bool _isLoadingOrders = false;
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  // Cache reservation details fetched on-demand to avoid repeated network calls
  final Map<String, Map<String, dynamic>> _reservationCache = {};


  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    // Pre-fetch orders for the user so the Orders tab displays quickly
    if (widget.initialTab != null) activeTab = widget.initialTab!;
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (ApiConfig.baseUrl.isEmpty) return;
      setState(() => _isLoadingOrders = true);
      try {
        await ref.read(orderHistoryProvider.notifier).fetchFromServer();
        // Join socket rooms for each order so realtime updates are received
        try {
          final orders = ref.read(orderHistoryProvider);
          for (final o in orders) {
            try {
              ref.read(orderSocketManagerProvider).joinOrder(o.id);
            } catch (_) {}
          }
        } catch (_) {}
      } catch (e) {
        // ignore errors for now
      } finally {
        if (mounted) setState(() => _isLoadingOrders = false);
        // If the screen was opened with an orderId, try to open that order's screen now
        try {
          final id = widget.initialOrderId;
          if (id != null && id.isNotEmpty) {
            final orders = ref.read(orderHistoryProvider);
            final matchList = orders.where((o) => o.id == id).toList();
            final match = matchList.isNotEmpty ? matchList.first : null;
            if (match != null && mounted) {
              final kitchenStatuses = {
                OrderStatus.waitingKitchenConfirmation,
                OrderStatus.preparing,
                OrderStatus.ready,
                OrderStatus.sentToKitchen,
              };
                if (kitchenStatuses.contains(match.status)) {
                context.push('/kitchen-status');
              } else {
                // OrderConfirmationScreen expects a Booking; try to find booking that matches
                final bookings = ref.read(bookingsProvider);
                final foundList = bookings.where((b) => b.id == match.bookingId || b.serverId == match.bookingId).toList();
                final foundBooking = foundList.isNotEmpty ? foundList.first : null;
                if (foundBooking != null) {
                  appRouter.push('/order-confirmation', extra: foundBooking);
                } else {
                  // fallback to orders tab
                  setState(() => activeTab = 'orders');
                }
              }
            }
          }
        } catch (_) {}
      }
    });
  }

  String _formatPrice(double price) {
    return '${price.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    )}đ';
  }

  String _getStatusText(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending:
        return 'Chờ xử lý';
      case OrderStatus.created:
        return 'Đã tạo';
      case OrderStatus.waitingPayment:
        return 'Chờ thanh toán';
      case OrderStatus.waitingKitchenConfirmation:
        return 'Chờ xác nhận bếp';
      case OrderStatus.preparing:
        return 'Đang chế biến';
      case OrderStatus.ready:
        return 'Sẵn sàng';
      case OrderStatus.sentToKitchen:
        return 'Đã gửi bếp';
      case OrderStatus.paid:
        return 'Đã thanh toán';
      case OrderStatus.completed:
        return 'Hoàn thành';
      case OrderStatus.cancelled:
        return 'Đã hủy';
    }
  }

  Color _getStatusColor(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending:
        return Colors.grey;
      case OrderStatus.created:
        return Colors.blue;
      case OrderStatus.waitingPayment:
        return Colors.orangeAccent;
      case OrderStatus.waitingKitchenConfirmation:
        return Colors.orange;
      case OrderStatus.preparing:
        return Colors.blueAccent;
      case OrderStatus.ready:
        return Colors.green;
      case OrderStatus.sentToKitchen:
        return Colors.orange;
      case OrderStatus.paid:
        return Colors.purple;
      case OrderStatus.completed:
        return Colors.green;
      case OrderStatus.cancelled:
        return Colors.red;
    }
  }

  void _handleSaveProfile() {
    final user = ref.read(userProvider);
    if (user != null) {
      final updatedUser = user.copyWith(
        name: _nameController.text,
        email: _emailController.text,
        phone: _phoneController.text,
        address: _addressController.text,
      );
      ref.read(userProvider.notifier).setUser(updatedUser);
      setState(() {
        isEditing = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đã cập nhật thông tin')),
      );
    }
  }

  void _startEditing() {
    final user = ref.read(userProvider);
    if (user != null) {
      _nameController.text = user.name;
      _emailController.text = user.email;
      _phoneController.text = user.phone ?? '';
      _addressController.text = user.address ?? '';
      setState(() {
        isEditing = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(userProvider);
    final orderHistory = ref.watch(orderHistoryProvider);

    if (user == null) {
      return const Scaffold(
        body: Center(child: Text('Chưa đăng nhập')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tài khoản'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48.0),
          child: Padding(
            padding: const EdgeInsets.all(8.0),
            child: Container(
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceVariant,
                borderRadius: BorderRadius.circular(8.0),
              ),
              child: Row(
      
                children: [
                  Expanded(
                    child: TextButton(
                      style: TextButton.styleFrom(
                        backgroundColor: activeTab == 'profile'
                            ? Theme.of(context).colorScheme.background
                            : Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6.0),
                        ),
                      ),
                      onPressed: () => setState(() => activeTab = 'profile'),
                      child: Text(
                        'Hồ sơ',
                        style: TextStyle(
                          color: activeTab == 'profile'
                              ? Theme.of(context).colorScheme.primary
                              : Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: TextButton(
                      style: TextButton.styleFrom(
                        backgroundColor: activeTab == 'orders'
                            ? Theme.of(context).colorScheme.background
                            : Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6.0),
                        ),
                      ),
                      onPressed: () async {
                        setState(() => activeTab = 'orders');
                        // Trigger fetch from server when orders tab opens
                        setState(() => _isLoadingOrders = true);
                        try {
                          await ref.read(orderHistoryProvider.notifier).fetchFromServer();
                          // join order rooms for realtime updates
                          try {
                            final orders = ref.read(orderHistoryProvider);
                            for (final o in orders) {
                              try {
                                ref.read(orderSocketManagerProvider).joinOrder(o.id);
                              } catch (_) {}
                            }
                          } catch (_) {}
                        } catch (e) {
                          // Show a helpful message if unauthorized or network error
                          final msg = e.toString();
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                            content: Text(msg),
                            action: SnackBarAction(label: 'Đăng nhập', onPressed: () {
                              context.go('/login');
                            }),
                          ));
                        } finally {
                          if (mounted) setState(() => _isLoadingOrders = false);
                        }
                      },
                      child: Text(
                        'Đơn hàng',
                        style: TextStyle(
                          color: activeTab == 'orders'
                              ? Theme.of(context).colorScheme.primary
                              : Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: TextButton(
                      style: TextButton.styleFrom(
                        backgroundColor: activeTab == 'settings'
                            ? Theme.of(context).colorScheme.background
                            : Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6.0),
                        ),
                      ),
                      onPressed: () => setState(() => activeTab = 'settings'),
                      child: Text(
                        'Cài đặt',
                        style: TextStyle(
                          color: activeTab == 'settings'
                              ? Theme.of(context).colorScheme.primary
                              : Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      // Show bottom navigation when this screen is opened directly (not inside
      // the app's `MainNavigation` widget which already provides a nav bar).
      bottomNavigationBar: (context.findAncestorWidgetOfExactType<MainNavigation>() == null)
          ? NavigationBar(
              selectedIndex: 4,
              onDestinationSelected: (index) {
                switch (index) {
                  case 0:
                    context.go('/home');
                    break;
                  case 1:
                    context.go('/my-bookings');
                    break;
                  case 2:
                    context.go('/menu');
                    break;
                  case 3:
                    context.go('/loyalty');
                    break;
                  case 4:
                    context.go('/account');
                    break;
                }
              },
              destinations: const [
                NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Trang chủ'),
                NavigationDestination(icon: Icon(Icons.table_restaurant_outlined), selectedIcon: Icon(Icons.table_restaurant), label: 'Đặt bàn'),
                NavigationDestination(icon: Icon(Icons.restaurant_menu_outlined), selectedIcon: Icon(Icons.restaurant_menu), label: 'Thực đơn'),
                NavigationDestination(icon: Icon(Icons.card_giftcard_outlined), selectedIcon: Icon(Icons.card_giftcard), label: 'Tích điểm'),
                NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Tài khoản'),
              ],
            )
          : null,
      body: Builder(
        builder: (context) {
          if (activeTab == 'profile') {
            return _buildProfileTab(user);
          } else if (activeTab == 'orders') {
            return _buildOrdersTab(orderHistory);
          } else if (activeTab == 'settings') {
            return _buildSettingsTab();
          }
          return const Center(child: Text('Chọn một tab'));
        },
      ),
    );
  }

  Widget _buildProfileTab(AppUser user) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Profile header
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 50,
                    backgroundImage: user.avatar != null 
                        ? NetworkImage(user.avatar!) 
                        : null,
                    child: user.avatar == null 
                        ? const Icon(Icons.person, size: 50)
                        : null,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    user.name,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    user.email,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      Column(
                        children: [
                          Text(
                            '${user.loyaltyPoints}',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                          ),
                          const Text('Điểm tích lũy'),
                        ],
                      ),
                      Column(
                        children: [
                          Text(
                            '${user.totalOrders}',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                          ),
                          const Text('Đơn hàng'),
                        ],
                      ),
                      Column(
                        children: [
                          Text(
                            user.membershipTier,
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                          ),
                          const Text('Hạng thành viên'),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Profile form
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        'Thông tin cá nhân',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const Spacer(),
                      if (!isEditing)
                        TextButton.icon(
                          onPressed: _startEditing,
                          icon: const Icon(Icons.edit),
                          label: const Text('Chỉnh sửa'),
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (isEditing) ...[
                    TextField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        labelText: 'Họ tên',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _emailController,
                      decoration: const InputDecoration(
                        labelText: 'Email',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _phoneController,
                      decoration: const InputDecoration(
                        labelText: 'Số điện thoại',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _addressController,
                      decoration: const InputDecoration(
                        labelText: 'Địa chỉ',
                        border: OutlineInputBorder(),
                      ),
                      maxLines: 2,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => setState(() => isEditing = false),
                            child: const Text('Hủy'),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _handleSaveProfile,
                            child: const Text('Lưu'),
                          ),
                        ),
                      ],
                    ),
                  ] else ...[
                    _buildInfoRow('Họ tên', user.name),
                    _buildInfoRow('Email', user.email),
                    _buildInfoRow('Số điện thoại', user.phone ?? 'Chưa cập nhật'),
                    _buildInfoRow('Địa chỉ', user.address ?? 'Chưa cập nhật'),
                    if (user.birthDate != null)
                      _buildInfoRow('Ngày sinh', '${user.birthDate!.day}/${user.birthDate!.month}/${user.birthDate!.year}'),
                    if (user.joinDate != null)
                      _buildInfoRow('Tham gia', '${user.joinDate!.day}/${user.joinDate!.month}/${user.joinDate!.year}'),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              value,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrdersTab(List<Order> orders) {
    // Debug block showing API and auth state to help troubleshooting why orders may not load
    final apiBase = ApiConfig.baseUrl;
    final tokenLen = ApiConfig.authToken.length;
    final currentUserId = ApiConfig.currentUserId;
    final loggedInUser = ref.read(userProvider);
    final loggedInUserId = loggedInUser?.id ?? '(not logged)';

    Widget _debugCard() => Card(
      color: Colors.grey[50],
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('API: ${apiBase.isEmpty ? '(not set)' : apiBase}', style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 4),
            Text('Token length: $tokenLen', style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 4),
            Text('ApiConfig.currentUserId: ${currentUserId.isEmpty ? '(empty)' : currentUserId}', style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 4),
            Text('Logged-in user id: $loggedInUserId', style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );

    // Show debug card while loading or above the list
    if (_isLoadingOrders) {
      return const Center(child: CircularProgressIndicator());
    }
    // Split orders into past vs current/future based on createdAt date
    final today = DateTime.now();
    final pastOrders = orders.where((o) => o.createdAt.isBefore(DateTime(today.year, today.month, today.day))).toList();
    final currentAndFutureOrders = orders.where((o) => !o.createdAt.isBefore(DateTime(today.year, today.month, today.day))).toList();

    // If both lists are empty, show empty state
    if (pastOrders.isEmpty && currentAndFutureOrders.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Text('Bạn chưa có đơn hàng', style: Theme.of(context).textTheme.bodyLarge),
        ),
      );
    }

    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Row(
              children: [
                Expanded(child: _debugCard()),
                const SizedBox(width: 12),
                ElevatedButton.icon(
                  onPressed: () async {
                    // Refresh orders
                    setState(() => _isLoadingOrders = true);
                    try {
                      await ref.read(orderHistoryProvider.notifier).fetchFromServer();
                    } catch (_) {}
                    if (mounted) setState(() => _isLoadingOrders = false);
                  },
                  icon: const Icon(Icons.refresh),
                  label: const Text('Làm mới'),
                ),
              ],
            ),
          ),
          TabBar(
            labelColor: Theme.of(context).colorScheme.primary,
            unselectedLabelColor: Theme.of(context).colorScheme.onSurfaceVariant,
            tabs: const [
              Tab(text: 'Đơn quá khứ'),
              Tab(text: 'Đơn hiện tại & tương lai'),
            ],
          ),
          const SizedBox(height: 8),
          Expanded(
            child: TabBarView(
              children: [
                // Past orders
                RefreshIndicator(
                  onRefresh: () async {
                    await ref.read(orderHistoryProvider.notifier).fetchFromServer();
                  },
                  child: _ordersListView(pastOrders),
                ),
                // Current and future orders
                RefreshIndicator(
                  onRefresh: () async {
                    await ref.read(orderHistoryProvider.notifier).fetchFromServer();
                  },
                  child: _ordersListView(currentAndFutureOrders),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _ordersListView(List<Order> displayedOrders) {
    if (displayedOrders.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.receipt_long, size: 64, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.2)),
              const SizedBox(height: 12),
              Text('Không có đơn hàng', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              Text('Khi bạn có đơn hàng, chúng sẽ xuất hiện ở đây.', style: Theme.of(context).textTheme.bodySmall, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () async {
                  setState(() => _isLoadingOrders = true);
                  try {
                    await ref.read(orderHistoryProvider.notifier).fetchFromServer();
                  } catch (_) {}
                  if (mounted) setState(() => _isLoadingOrders = false);
                },
                icon: const Icon(Icons.refresh),
                label: const Text('Làm mới'),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: displayedOrders.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final order = displayedOrders[index];
        // Determine display values: prefer parsed model, but fall back to raw server JSON
        double displayTotal = order.total;
        int displayItemsCount = order.totalItems;

        final notifier = ref.read(orderHistoryProvider.notifier);
        final raw = notifier.lastRawOrders;
        Map<String, dynamic>? match;

        if (raw.isNotEmpty) {
          for (final r in raw) {
            try {
              if (r is Map) {
                final keysToCheck = ['id', 'order_id', 'reservation_id', 'bookingId', 'booking_id', 'orderId'];
                for (final k in keysToCheck) {
                  final val = r[k];
                  if (val != null && val.toString() == order.id) {
                    match = Map<String, dynamic>.from(r);
                    break;
                  }
                }
                if (match != null) break;
                if (r['reservation'] is Map) {
                  final res = r['reservation'] as Map;
                  final resId = (res['id'] ?? res['reservation_id'] ?? res['bookingId']);
                  if (resId != null && resId.toString() == order.id) {
                    match = Map<String, dynamic>.from(r);
                    break;
                  }
                }
              }
            } catch (_) {}
          }
        }

        if (match != null) {
          // 1) totals
          try {
            final tVal = match['final_amount'] ?? match['finalAmount'] ?? match['total_amount'] ?? match['totalAmount'] ?? match['total'];
            if (tVal != null) {
              final parsed = double.tryParse(tVal.toString());
              if (parsed != null && parsed > 0) displayTotal = parsed;
            }
          } catch (_) {}

          // 2) direct raw items
          try {
            List<dynamic>? rawItems;
            if ((match['items']) is List<dynamic>) rawItems = (match['items']) as List<dynamic>;
            rawItems ??= (match['pre_order_items']) as List<dynamic>? ?? (match['preOrderItems']) as List<dynamic>?;
            if (rawItems != null && rawItems.isNotEmpty) {
              int s = 0;
              double subt = 0.0;
              for (final ri in rawItems) {
                try {
                  if (ri is Map) {
                    final q = ri['quantity'] ?? ri['qty'] ?? ri['amount'] ?? ri['count'];
                    final qi = (q != null) ? (int.tryParse(q.toString()) ?? 0) : 0;
                    s += (qi > 0) ? qi : 0;
                    final p = ri['price'] ?? ri['unit_price'] ?? ri['unitPrice'] ?? (ri['dish'] is Map ? ri['dish']['price'] : null);
                    final pp = (p != null) ? (double.tryParse(p.toString()) ?? 0.0) : 0.0;
                    subt += pp * ((qi > 0) ? qi : 0);
                  }
                } catch (_) {}
              }
              if (s > 0) displayItemsCount = s;
              if (subt > 0 && (displayTotal == 0 || displayTotal < subt)) displayTotal = subt + (order.serviceCharge) + (order.tax);
            }
          } catch (_) {}

          // 3) reservation fallback (background fetch if needed)
          try {
            final resId = match['reservation_id'] ?? match['reservationId'] ?? (match['reservation'] is Map ? (match['reservation']['id'] ?? match['reservation']['reservation_id']) : null);
            if ((displayItemsCount == 0 || displayTotal == 0) && resId != null && resId.toString().isNotEmpty) {
              final rid = resId.toString();
              if (_reservationCache.containsKey(rid) && _reservationCache[rid] != null) {
                final resMap = _reservationCache[rid]!;
                try {
                  final po = resMap['pre_order_items'] ?? resMap['preOrderItems'] ?? (resMap['data'] is Map ? resMap['data']['pre_order_items'] : null);
                  if (po is List && po.isNotEmpty) {
                    int s = 0;
                    double subt = 0.0;
                    for (final ri in po) {
                      if (ri is Map) {
                        final q = ri['quantity'] ?? ri['qty'] ?? ri['amount'] ?? ri['count'];
                        final qi = (q != null) ? (int.tryParse(q.toString()) ?? 0) : 0;
                        s += (qi > 0) ? qi : 0;
                        final p = ri['price'] ?? ri['unit_price'] ?? ri['unitPrice'] ?? (ri['dish'] is Map ? ri['dish']['price'] : null);
                        final pp = (p != null) ? (double.tryParse(p.toString()) ?? 0.0) : 0.0;
                        subt += pp * ((qi > 0) ? qi : 0);
                      }
                    }
                    if (s > 0) displayItemsCount = s;
                    if (subt > 0 && (displayTotal == 0 || displayTotal < subt)) displayTotal = subt + (order.serviceCharge) + (order.tax);
                  }
                } catch (_) {}
              } else {
                ReservationAppUserServiceAppUser.fetchReservationById(rid).then((fetched) {
                  if (mounted) setState(() {
                    _reservationCache[rid] = fetched;
                  });
                }).catchError((_) {});
              }
            }
          } catch (_) {}
        }

        return Card(
          elevation: 2,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ListTile(
            onTap: () {
              // keep existing navigation logic but compacted
              debugPrint('Order tapped: id=${order.id}');
              try {
                debugPrint('App registered paths: ${appRegisteredPaths.join(', ')}');
              } catch (e) {
                debugPrint('Could not read appRegisteredPaths: $e');
              }

              try {
                appRouter.go('/order-detail/${order.id}', extra: order);
                return;
              } catch (e, st) {
                debugPrint('appRouter.go failed: $e\n$st');
              }

              try {
                appRouter.pushNamed('orderDetail', pathParameters: {'id': order.id}, extra: order);
                return;
              } catch (e, st) {
                debugPrint('appRouter.pushNamed failed: $e\n$st');
              }

              try {
                Navigator.of(context).push(MaterialPageRoute(builder: (ctx) => OrderDetailScreen(order: order)));
              } catch (e, st) {
                debugPrint('Navigator fallback failed: $e\n$st');
              }
            },
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            leading: CircleAvatar(
              radius: 26,
              backgroundColor: _getStatusColor(order.status).withOpacity(0.12),
              child: Text(
                _getStatusText(order.status).split(' ').first[0],
                style: TextStyle(color: _getStatusColor(order.status), fontWeight: FontWeight.bold),
              ),
            ),
            title: Text('#${order.id}', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 4),
                Text('Ngày: ${order.createdAt.day}/${order.createdAt.month}/${order.createdAt.year} ${order.createdAt.hour}:${order.createdAt.minute.toString().padLeft(2, '0')}', style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: 4),
                if (displayItemsCount == 0 && !order.createdAt.isBefore(DateTime.now()))
                  () {
                    String? sampleRawText;
                    String? sampleTruncated;
                    try {
                      final notifier = ref.read(orderHistoryProvider.notifier);
                      final raw = notifier.lastRawOrders;
                      Map<String, dynamic>? match;

                      if (raw.isNotEmpty) {
                        for (final r in raw) {
                          try {
                            if (r is Map) {
                              final keysToCheck = ['id', 'order_id', 'reservation_id', 'bookingId', 'booking_id', 'orderId'];
                              for (final k in keysToCheck) {
                                final val = r[k];
                                if (val != null && val.toString() == order.id) {
                                  match = Map<String, dynamic>.from(r);
                                  break;
                                }
                              }
                              if (match != null) break;

                              if (r['reservation'] is Map) {
                                final res = r['reservation'] as Map;
                                final resId = (res['id'] ?? res['reservation_id'] ?? res['bookingId']);
                                if (resId != null && resId.toString() == order.id) {
                                  match = Map<String, dynamic>.from(r);
                                  break;
                                }
                              }
                            }
                          } catch (_) {}
                        }
                      }

                      debugPrint('[OrderDebug] order id=${order.id} totalItems=${order.totalItems} createdAt=${order.createdAt.toIso8601String()}');
                      debugPrint('[OrderDebug] lastRawOrders length=${raw.length}');
                      if (match != null) {
                        debugPrint('[OrderDebug] matched raw item: ${jsonEncode(match)}');
                        sampleRawText = jsonEncode(match);
                      } else {
                        if (raw.isNotEmpty) {
                          try {
                            sampleRawText = jsonEncode(raw.first);
                            debugPrint('[OrderDebug] no direct match found — sampleRaw=${sampleRawText}');
                          } catch (_) {
                            debugPrint('[OrderDebug] no direct match found and sampleRaw jsonEncode failed');
                          }
                        } else {
                          debugPrint('[OrderDebug] lastRawOrders is empty or not a list');
                        }
                      }
                      if (sampleRawText != null && sampleRawText.isNotEmpty) {
                        sampleTruncated = sampleRawText.length > 200 ? '${sampleRawText.substring(0, 200)}... (truncated)' : sampleRawText;
                      }
                    } catch (e, st) {
                      debugPrint('[OrderDebug] error while trying to log raw orders: $e\n$st');
                    }
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('$displayItemsCount món', style: Theme.of(context).textTheme.bodySmall),
                        if (sampleTruncated != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 6.0),
                            child: Text('DBG: $sampleTruncated', style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 11, color: Colors.redAccent)),
                          ),
                      ],
                    );
                  }() else
                  Text('$displayItemsCount món', style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(_formatPrice(displayTotal), style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.primary)),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getStatusColor(order.status).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: _getStatusColor(order.status)),
                  ),
                  child: Text(_getStatusText(order.status), style: TextStyle(color: _getStatusColor(order.status), fontSize: 12, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSettingsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.notifications),
                title: const Text('Thông báo'),
                subtitle: const Text('Quản lý thông báo'),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: () {
                  // Navigate to notifications settings
                },
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.security),
                title: const Text('Bảo mật'),
                subtitle: const Text('Mật khẩu và xác thực'),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: () {
                  // Navigate to security settings
                },
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.privacy_tip),
                title: const Text('Quyền riêng tư'),
                subtitle: const Text('Cài đặt quyền riêng tư'),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: () {
                  // Navigate to privacy settings
                },
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Card(
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.rate_review),
                title: const Text('Đánh giá & Khiếu nại'),
                subtitle: const Text('Viết đánh giá và phản hồi'),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: () {
                  context.push('/reviews');
                },
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.local_offer),
                title: const Text('Voucher của tôi'),
                subtitle: const Text('Quản lý voucher đã đổi'),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: () {
                  context.push('/vouchers');
                },
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.chat),
                title: const Text('Chat với nhà hàng'),
                subtitle: const Text('Hỗ trợ trực tuyến'),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: () {
                  context.push('/chat');
                },
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.help),
                title: const Text('Trợ giúp'),
                subtitle: const Text('Câu hỏi thường gặp'),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: () {
                  // Navigate to help
                },
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.info),
                title: const Text('Về ứng dụng'),
                subtitle: const Text('Phiên bản và thông tin'),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: () {
                  // Navigate to about
                },
              ),
            ],
          ),
        ),
      ],
    );
  }
}
