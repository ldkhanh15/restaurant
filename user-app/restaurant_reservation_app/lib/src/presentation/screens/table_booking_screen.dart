import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/app.dart';
import '../../application/providers.dart';
import '../widgets/app_bottom_navigation.dart';
import '../widgets/main_navigation.dart';
import '../../application/socket_manager.dart';
import '../../data/services/order_app_user_service_app_user.dart';
import '../../domain/models/order.dart';
// ...existing imports
import '../../domain/models/booking.dart';
import '../../domain/models/table.dart';
import '../../domain/entities/reservation.dart' as ent_reservation;
import '../../domain/entities/user.dart' as ent_user;
import '../../domain/entities/table.dart' as ent_table_entity;
import '../../data/repositories/reservation_repository_impl.dart';
import '../../data/services/reservation_app_user_service_app_user.dart';
import '../../data/services/table_app_user_service_app_user.dart';
import '../../data/datasources/api_config.dart';
import '../../data/services/app_user_initializer_app_user.dart';
import 'package:intl/intl.dart';
import '../../domain/usecases/create_reservation.dart';
import '../widgets/table_card.dart';
import '../widgets/booking_dialog.dart';
import 'table_map_screen.dart';
import 'kitchen/kitchen_status_screen.dart';

class TableBookingScreen extends ConsumerStatefulWidget {
  final String? initialTab;
  const TableBookingScreen({super.key, this.initialTab});

  @override
  ConsumerState<TableBookingScreen> createState() => _TableBookingScreenState();
}

class _TableBookingScreenState extends ConsumerState<TableBookingScreen> {
  String activeTab = "available"; // "available", "map", "myBookings"
  DiningTable? selectedTable;
  bool isBookingOpen = false;
  bool _isLoadingBookings = false;
  bool _initialized = false;
  // Filters for "Của tôi"
  String bookingPeriodFilter = 'upcoming'; // 'upcoming' or 'past'
  String bookingTypeFilter = 'all'; // 'all', 'call', 'order', 'paid'

  void handleBookTable(Booking newBooking) async {
    // debug: log when booking handler is invoked
    // ignore: avoid_print
    print('[TableBookingScreen] handleBookTable called with booking: ${newBooking.tableId} ${newBooking.date} ${newBooking.time}');
    try {
      final repo = ReservationRepositoryImpl();
      final usecase = CreateReservation(repo);
      final currentUser = ref.read(userProvider);

      final timeParts = newBooking.time.split(':');
      final hour = int.tryParse(timeParts[0]) ?? 0;
      final minute = int.tryParse(timeParts[1]) ?? 0;
      final reservationDateTime = DateTime(
        newBooking.date.year,
        newBooking.date.month,
        newBooking.date.day,
        hour,
        minute,
      ).toUtc();

      final reservation = ent_reservation.Reservation(
        id: '',
        user: ent_user.User(id: currentUser?.id.toString() ?? '', name: currentUser?.name ?? 'Unknown', email: currentUser?.email ?? ''),
        table: ent_table_entity.Table(
          id: newBooking.tableId,
          tableNumber: int.tryParse(newBooking.tableName) ?? 0,
          capacity: newBooking.guests,
          isOccupied: false,
        ),
        dateTime: reservationDateTime,
        numberOfGuests: newBooking.guests,
      );

      final created = await usecase.call(reservation);

      final createdBooking = Booking(
        id: created.id,
        serverId: created.id.toString(),
        tableId: created.table.id,
        tableName: newBooking.tableName,
        date: DateTime(created.dateTime.year, created.dateTime.month, created.dateTime.day),
        time: '${created.dateTime.hour.toString().padLeft(2, '0')}:${created.dateTime.minute.toString().padLeft(2, '0')}',
        guests: created.numberOfGuests,
        notes: null,
        status: BookingStatus.confirmed,
        location: '',
        price: 0.0,
        createdAt: DateTime.now(),
      );

      ref.read(bookingsProvider.notifier).addBooking(createdBooking);
      await _loadBookingsFromServer();

      // Ensure order history is fresh so paid orders show up in 'Của tôi'
      try {
        await ref.read(orderHistoryProvider.notifier).fetchFromServer();
      } catch (_) {}

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đặt bàn thành công')));
      }
      if (selectedTable != null) {
        ref.read(tablesProvider.notifier).updateTable(
          selectedTable!.copyWith(status: TableStatus.reserved),
        );
        try {
          await TableAppUserServiceAppUser.updateTableStatus(selectedTable!.id.toString(), 'reserved');
        } catch (e) {
          debugPrint('updateTableStatus error: $e');
        }
      }

      setState(() {
        isBookingOpen = false;
        selectedTable = null;
        activeTab = 'myBookings';
      });
      _loadBookingsFromServer();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Không thể tạo đặt chỗ: $e')));
      }
      ref.read(bookingsProvider.notifier).addBooking(newBooking);
      if (selectedTable != null) {
        ref.read(tablesProvider.notifier).updateTable(
          selectedTable!.copyWith(status: TableStatus.reserved),
        );
      }
      setState(() {
        isBookingOpen = false;
        selectedTable = null;
        activeTab = 'myBookings';
      });
      try {
        await _loadBookingsFromServer();
      } catch (e) {
        debugPrint('load bookings after create error: $e');
      }
    }
  }

  Future<void> onOrderFood(Booking booking) async {
    try {
      final raw = await OrderAppUserService.fetchOrdersForUser(page: 1, limit: 100);
      final orders = raw.map((e) => Order.fromJson(e as Map<String, dynamic>)).where((o) => o.bookingId == booking.id || o.bookingId == booking.serverId).toList();
        if (orders.isNotEmpty) {
          // Do not auto-restore previous orders and do not prompt the user.
          // The cart remains empty when opening the menu; users can use the 'Đặt lại' action
          // in the order detail screen if they want to reorder.
        } else {
        Map<String, dynamic>? matchedRaw;
        for (final e in raw) {
          if (e is Map<String, dynamic>) {
            final rid = (e['reservation_id'] ?? e['reservationId'] ?? e['reservation'] ?? '').toString();
            final tid = (e['table_id'] ?? e['tableId'] ?? e['table'] ?? '').toString();
            if (rid.isNotEmpty && (rid == booking.serverId || rid == booking.id)) {
              matchedRaw = e;
              break;
            }
            if (tid.isNotEmpty && tid == booking.tableId) {
              matchedRaw = e;
              break;
            }
          }
        }
        if (matchedRaw != null) {
          // Found a matched order/reservation but we will NOT restore items automatically
          // and we won't prompt the user. Keep the cart empty on entry.
        }
      }
    } catch (e) {
      debugPrint('onOrderFood error: $e');
    }

  if (!mounted) return;
  // Ensure cart starts empty when opening the menu from the bookings flow.
  // Restoration of previous orders is still available via explicit dialogs above.
  try {
    ref.read(cartItemsProvider.notifier).clearCart();
  } catch (_) {}
  context.push('/menu', extra: booking);
  }

  Future<void> _loadBookingsFromServer() async {
    if (_isLoadingBookings) return;
    setState(() {
      _isLoadingBookings = true;
    });
    try {
      final reservationsRaw = await ReservationAppUserServiceAppUser.fetchReservations();
      final availableTables = ref.read(tablesProvider);
      final fetched = reservationsRaw.map((r) {
        final map = r as Map<String, dynamic>;
        final tableMap = map['table'] as Map<String, dynamic>?;
        final tableId = tableMap?['id']?.toString() ?? map['table_id']?.toString() ?? '';

        String tableName;
        if (tableMap != null) {
          tableName = tableMap['table_number']?.toString() ?? 'Unknown Table';
        } else {
          try {
            final table = availableTables.firstWhere((t) => t.id == tableId);
            tableName = table.name;
          } catch (e) {
            tableName = 'Unknown Table';
          }
        }

        final reservationTime = (DateTime.tryParse(map['reservation_time'] ?? '') ?? DateTime.now()).toLocal();
        final statusString = (map['status'] ?? 'pending').toString();
        final status = BookingStatus.values.firstWhere(
          (e) => e.name == statusString,
          orElse: () => BookingStatus.pending,
        );

        return Booking(
          id: map['id']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString(),
          serverId: map['id']?.toString(),
          tableId: tableId,
          tableName: tableName,
          date: reservationTime,
          time: DateFormat.Hm().format(reservationTime),
          guests: (map['num_people'] is int) ? map['num_people'] as int : 1,
          status: status,
          location: tableMap?['location'] ?? 'N/A',
          price: (tableMap?['price'] as num?)?.toDouble() ?? 0.0,
          createdAt: (DateTime.tryParse(map['createdAt'] ?? '') ?? DateTime.now()).toLocal(),
        );
      }).toList();

      ref.read(bookingsProvider.notifier).setBookings(fetched);
    } catch (e) {
      debugPrint('loadBookings mapping error: $e');
    }
    finally {
      setState(() {
        _isLoadingBookings = false;
      });
    }
  }

  void _handleEditBooking(Booking booking) {
    final table = DiningTable(
      id: booking.tableId,
      name: booking.tableName,
      capacity: booking.guests,
      location: booking.location,
      price: booking.price,
      status: TableStatus.available,
      type: TableType.regular,
    );
    setState(() {
      selectedTable = table;
      isBookingOpen = true;
    });

    void onUpdate(Booking updated) async {
      try {
        final idStr = (booking.serverId != null && booking.serverId!.isNotEmpty) ? booking.serverId! : booking.id.toString();
        final timeParts = updated.time.split(':');
        final hour = int.tryParse(timeParts[0]) ?? 0;
        final minute = int.tryParse(timeParts[1]) ?? 0;
        final reservationDateTime = DateTime(
          updated.date.year,
          updated.date.month,
          updated.date.day,
          hour,
          minute,
        ).toUtc();

        final payload = {
          'reservation_time': reservationDateTime.toIso8601String(),
          'num_people': updated.guests,
        };
        await ReservationAppUserServiceAppUser.updateReservation(idStr, payload);
        ref.read(bookingsProvider.notifier).updateBooking(updated);
      } catch (e) {
        ref.read(bookingsProvider.notifier).updateBooking(updated);
      } finally {
        setState(() {
          isBookingOpen = false;
          selectedTable = null;
        });
      }
    }

    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        child: BookingDialog(
          table: table,
          editingBooking: booking,
          onBook: (_) {},
          onCancel: () => Navigator.of(ctx).pop(),
          onUpdate: (b) {
            Navigator.of(ctx).pop();
            onUpdate(b);
          },
        ),
      ),
    );
  }

  void _handleCancelBooking(Booking booking) async {
    try {
      final idStr = (booking.serverId != null && booking.serverId!.isNotEmpty) ? booking.serverId! : booking.id.toString();
      await ReservationAppUserServiceAppUser.cancelReservation(idStr);
      if (!mounted) return;
      final updatedBooking = Booking.fromReservation(
        Booking.toReservation(booking),
        context,
      ).copyWith(status: BookingStatus.cancelled);

      ref.read(bookingsProvider.notifier).updateBooking(updatedBooking);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đã hủy đặt bàn')));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Hủy thất bại: $e')));
      }
    }
  }

  Future<void> _openOrderDialog(Booking booking) async {
    showDialog<void>(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => FutureBuilder<List<dynamic>>(
        future: OrderAppUserService.fetchOrdersForUser(page: 1, limit: 100),
        builder: (c, snap) {
          if (snap.connectionState == ConnectionState.waiting) return const Center(child: SizedBox(height: 120, child: Center(child: CircularProgressIndicator())));
          if (snap.hasError) return AlertDialog(title: const Text('Lỗi'), content: Text('Không thể tải orders: ${snap.error}'), actions: [TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Đóng'))]);
          final raw = snap.data ?? [];
          final orders = raw.map((e) => Order.fromJson(e as Map<String, dynamic>)).where((o) => o.bookingId == booking.id || o.bookingId == booking.serverId).toList();

          return AlertDialog(
            title: Text('Order - ${booking.tableName}'),
            content: SizedBox(
              width: double.maxFinite,
              child: orders.isEmpty
                  ? Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text('Chưa có order nào cho bàn này.'),
                        const SizedBox(height: 12),
                        ElevatedButton(
                          onPressed: () {
                            Navigator.of(ctx).pop();
                            if (!mounted) return;
                            // Clear cart so menu opens with an empty cart
                            try {
                              ref.read(cartItemsProvider.notifier).clearCart();
                            } catch (_) {}
                            context.go('/menu', extra: booking);
                          },
                          child: const Text('Gọi món'),
                        )
                      ],
                    )
                  : ListView.builder(
                      shrinkWrap: true,
                      itemCount: orders.length,
                      itemBuilder: (context, idx) {
                        final o = orders[idx];
                        return Card(
                          child: ListTile(
                            title: Text('Order #${o.id} - ${o.status.name}'),
                            subtitle: Text('Tổng: ${o.total.toStringAsFixed(0)}đ - ${o.items.length} món'),
                            trailing: PopupMenuButton<String>(
                              onSelected: (val) async {
                                if (val == 'goto') {
                                  Navigator.of(ctx).pop();
                                  try {
                                    ref.read(currentOrderProvider.notifier).setOrder(o);
                                    ref.read(orderItemsProvider.notifier).setItems(o.items);
                                  } catch (_) {}
                                  if (o.status == OrderStatus.pending) {
                                    appRouter.push('/order-confirmation', extra: booking);
                                  } else if (o.status == OrderStatus.waitingKitchenConfirmation || o.status == OrderStatus.sentToKitchen || o.status == OrderStatus.preparing || o.status == OrderStatus.ready) {
                                    Navigator.push(context, MaterialPageRoute(builder: (_) => const KitchenStatusScreen()));
                                  } else {
                                    appRouter.push('/order-confirmation', extra: booking);
                                  }
                                } else if (val == 'send') {
                                  final messenger = ScaffoldMessenger.of(context);
                                  try {
                                    final updated = await OrderAppUserService.sendToKitchen(o.id);
                                    final updatedOrder = Order.fromJson(Map<String, dynamic>.from(updated));
                                    try {
                                      final list = ref.read(orderHistoryProvider);
                                      final idx2 = list.indexWhere((it) => it.id == updatedOrder.id);
                                      if (idx2 != -1) {
                                        final copy = list.toList();
                                        copy[idx2] = updatedOrder;
                                        ref.read(orderHistoryProvider.notifier).setOrders(copy);
                                      } else {
                                        ref.read(orderHistoryProvider.notifier).addOrder(updatedOrder);
                                      }
                                    } catch (e) {
                                      debugPrint('update order history error: $e');
                                    }
                                    if (!mounted) return;
                                    messenger.showSnackBar(const SnackBar(content: Text('Đã gửi tới bếp')));
                                  } catch (e) {
                                    messenger.showSnackBar(SnackBar(content: Text('Gửi tới bếp thất bại: $e')));
                                  }
                                } else if (val == 'follow') {
                                  try {
                                    ref.read(currentOrderProvider.notifier).setOrder(o);
                                    ref.read(orderItemsProvider.notifier).setItems(o.items);
                                  } catch (e) {
                                    debugPrint('set current order error: $e');
                                  }
                                  try {
                                    ref.read(orderSocketManagerProvider).joinOrder(o.id);
                                  } catch (e) {
                                    debugPrint('join order socket error: $e');
                                  }
                                  Navigator.of(ctx).pop();
                                  if (!mounted) return;
                                  Navigator.push(context, MaterialPageRoute(builder: (_) => const KitchenStatusScreen()));
                                }
                              },
                              itemBuilder: (menuCtx) => [
                                const PopupMenuItem(value: 'goto', child: Text('Mở order')),
                                const PopupMenuItem(value: 'send', child: Text('Gửi tới bếp')),
                                const PopupMenuItem(value: 'follow', child: Text('Theo dõi')),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Đóng')),
            ],
          );
        },
      ),
    );
  }

  /// Find the most relevant order for [booking] (currentOrderProvider or orderHistory)
  /// and navigate to the correct screen depending on its status.
  Future<void> _openOrNavigateToOrder(Booking booking) async {
    try {
      // Prefer the currentOrder if it matches
      final current = ref.read(currentOrderProvider);
      Order? found;
      if (current != null && (current.bookingId == booking.id || current.bookingId == booking.serverId)) {
        found = current;
      }

      // Fallback to cached order history
      if (found == null) {
        final list = ref.read(orderHistoryProvider);
        final matches = list.where((o) => (o.bookingId == booking.id || o.bookingId == booking.serverId)).toList();
        if (matches.isNotEmpty) found = matches.first;
      }

      // If still not found, try fetching from server once
      if (found == null) {
        try {
          final raw = await OrderAppUserService.fetchOrdersForUser(page: 1, limit: 100);
          final fetched = raw.map((e) => Order.fromJson(e as Map<String, dynamic>)).where((o) => o.bookingId == booking.id || o.bookingId == booking.serverId).toList();
          if (fetched.isNotEmpty) {
            found = fetched.first;
            // update provider cache
            try {
              ref.read(orderHistoryProvider.notifier).addOrder(found);
            } catch (_) {}
          }
        } catch (_) {}
      }

      if (found != null) {
        // Capture a non-null local order variable to avoid nullable access across awaits.
  Order orderToUse = found;
        // Try to fetch the freshest order details (may contain items) by id
        try {
          // Some cached orders may have empty items; fetch full details from server if possible
          final detailedRaw = await OrderAppUserService.getOrderById(orderToUse.id);
          try {
            final detailed = Order.fromJson(Map<String, dynamic>.from(detailedRaw));
            ref.read(currentOrderProvider.notifier).setOrder(detailed);
            ref.read(orderItemsProvider.notifier).setItems(detailed.items);
            orderToUse = detailed;
          } catch (_) {
            // fallback: use cached orderToUse
            try {
              ref.read(currentOrderProvider.notifier).setOrder(orderToUse);
              ref.read(orderItemsProvider.notifier).setItems(orderToUse.items);
            } catch (_) {}
          }
        } catch (e) {
          // network failed: still attempt to set cached order so UI can at least show something
          try {
            ref.read(currentOrderProvider.notifier).setOrder(orderToUse);
            ref.read(orderItemsProvider.notifier).setItems(orderToUse.items);
          } catch (_) {}
        }

        // Navigate based on status
        if (!mounted) return;
        if (orderToUse.status == OrderStatus.pending) {
          // Open order confirmation / details where user can view ordered items
          appRouter.push('/order-confirmation', extra: booking);
        } else if (orderToUse.status == OrderStatus.waitingKitchenConfirmation || orderToUse.status == OrderStatus.sentToKitchen || orderToUse.status == OrderStatus.preparing || orderToUse.status == OrderStatus.ready) {
          // Go to kitchen status / tracking screen
          Navigator.push(context, MaterialPageRoute(builder: (_) => const KitchenStatusScreen()));
        } else {
          // default to order confirmation
          appRouter.push('/order-confirmation', extra: booking);
        }
      } else {
        // No order: open the order dialog to allow user to create one (same as Gọi món flow)
        _openOrderDialog(booking);
      }
    } catch (e) {
      // fallback: open dialog
      _openOrderDialog(booking);
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!_initialized) {
        _initialized = true;
        try {
          await initializeAppUserData_app_user(ref);
          setState(() {});
        } catch (e) {
          debugPrint('initState initializeAppUserData error: $e');
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final availableTables = ref.watch(tablesProvider);
    final myBookings = ref.watch(bookingsProvider);

    return Scaffold(
      bottomNavigationBar: (context.findAncestorWidgetOfExactType<MainNavigation>() == null)
          ? const AppBottomNavigation(selectedIndex: 1)
          : null,
      appBar: AppBar(
        title: const Text('Đặt bàn'),
        actions: [
          if (activeTab == 'myBookings')
            TextButton(
              onPressed: () => context.go('/'),
              child: Text(
                'Quay về',
                style: TextStyle(color: Theme.of(context).colorScheme.onPrimary),
              ),
            ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(64),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 8.0),
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
                        backgroundColor: activeTab == "available" ? Theme.of(context).colorScheme.background : Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6.0),
                        ),
                      ),
                      onPressed: () => setState(() => activeTab = "available"),
                      child: Text(
                        'Danh sách',
                        style: TextStyle(
                          color: activeTab == "available" ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: TextButton(
                      style: TextButton.styleFrom(
                        backgroundColor: activeTab == "map" ? Theme.of(context).colorScheme.background : Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6.0),
                        ),
                      ),
                      onPressed: () => setState(() => activeTab = "map"),
                      child: Text(
                        'Sơ đồ',
                        style: TextStyle(
                          color: activeTab == "map" ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: TextButton(
                      style: TextButton.styleFrom(
                        backgroundColor: activeTab == "myBookings" ? Theme.of(context).colorScheme.background : Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6.0),
                        ),
                      ),
                      onPressed: () async {
                        setState(() => activeTab = "myBookings");
                        try {
                          await ref.read(orderHistoryProvider.notifier).fetchFromServer();
                        } catch (_) {}
                        _loadBookingsFromServer();
                      },
                      child: Text(
                        'Của tôi',
                        style: TextStyle(
                          color: activeTab == "myBookings" ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.onSurfaceVariant,
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
      body: Builder(
        builder: (context) {
          if (availableTables.isEmpty && ApiConfig.baseUrl.isNotEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const CircularProgressIndicator(),
                  const SizedBox(height: 12),
                  const Text('Đang tải danh sách bàn...'),
                  const SizedBox(height: 8),
                  ElevatedButton(onPressed: () async {
                    await initializeAppUserData_app_user(ref);
                    setState(() {});
                  }, child: const Text('Tải lại')),
                ],
              ),
            );
        }
          if (activeTab == "available") {
            return ListView.builder(
              padding: const EdgeInsets.all(16.0),
              itemCount: availableTables.length,
              itemBuilder: (context, index) {
                final table = availableTables[index];
                return TableCard(
                  table: table,
                  onBook: (selectedTable) {
                    setState(() {
                      this.selectedTable = selectedTable;
                      isBookingOpen = true;
                    });
                  },
                );
              },
            );
          } else if (activeTab == "map") {
            return TableMapScreen(
              onTableSelect: (table) {
                setState(() {
                  selectedTable = table;
                  isBookingOpen = true;
                });
              },
            );
          } else if (activeTab == "myBookings") {
            if (_isLoadingBookings) return const Center(child: CircularProgressIndicator());

            // Filters UI: Period (Past / Present & Future) and Type (Gọi món / Order / Thanh toán / Tất cả)
            Widget _buildFilters() {
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Period toggle
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              backgroundColor: bookingPeriodFilter == 'upcoming' ? Theme.of(context).colorScheme.background : Colors.transparent,
                            ),
                            onPressed: () => setState(() => bookingPeriodFilter = 'upcoming'),
                            child: Text('Hiện tại & tương lai', style: TextStyle(color: bookingPeriodFilter == 'upcoming' ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.onSurfaceVariant)),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              backgroundColor: bookingPeriodFilter == 'past' ? Theme.of(context).colorScheme.background : Colors.transparent,
                            ),
                            onPressed: () => setState(() => bookingPeriodFilter = 'past'),
                            child: Text('Quá khứ', style: TextStyle(color: bookingPeriodFilter == 'past' ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.onSurfaceVariant)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    // Type filters
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              backgroundColor: bookingTypeFilter == 'all' ? Theme.of(context).colorScheme.background : Colors.transparent,
                            ),
                            onPressed: () => setState(() => bookingTypeFilter = 'all'),
                            child: Text('Tất cả', style: TextStyle(color: bookingTypeFilter == 'all' ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.onSurfaceVariant)),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              backgroundColor: bookingTypeFilter == 'call' ? Theme.of(context).colorScheme.background : Colors.transparent,
                            ),
                            onPressed: () => setState(() => bookingTypeFilter = 'call'),
                            child: Text('Gọi món', style: TextStyle(color: bookingTypeFilter == 'call' ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.onSurfaceVariant)),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              backgroundColor: bookingTypeFilter == 'order' ? Theme.of(context).colorScheme.background : Colors.transparent,
                            ),
                            onPressed: () => setState(() => bookingTypeFilter = 'order'),
                            child: Text('Order', style: TextStyle(color: bookingTypeFilter == 'order' ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.onSurfaceVariant)),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              backgroundColor: bookingTypeFilter == 'paid' ? Theme.of(context).colorScheme.background : Colors.transparent,
                            ),
                            onPressed: () => setState(() => bookingTypeFilter = 'paid'),
                            child: Text('Thanh toán', style: TextStyle(color: bookingTypeFilter == 'paid' ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.onSurfaceVariant)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            }

            // If no bookings, show placeholder
            if (myBookings.isEmpty) {
              return Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('Bạn chưa có đặt chỗ nào.'),
                    const SizedBox(height: 12),
                    ElevatedButton(onPressed: _loadBookingsFromServer, child: const Text('Tải lại')),
                  ],
                ),
              );
            }

            // Build filtered bookings list based on period and type filters
            final orders = ref.watch(orderHistoryProvider);
            final current = ref.watch(currentOrderProvider);

            final List bookingsFiltered = myBookings.where((booking) {
              DateTime bookingDateTime;
              try {
                final dt = booking.date;
                final parsed = DateFormat.Hm().parse(booking.time);
                bookingDateTime = DateTime(dt.year, dt.month, dt.day, parsed.hour, parsed.minute);
              } catch (_) {
                bookingDateTime = booking.date;
              }

              final now = DateTime.now();
              final isPast = bookingDateTime.isBefore(now);

              if (bookingPeriodFilter == 'past' && !isPast) return false;
              if (bookingPeriodFilter == 'upcoming' && isPast) return false;

              Order? matched;
              if (current != null && (current.bookingId == booking.id || current.bookingId == booking.serverId)) matched = current;
              if (matched == null) {
                try {
                  final matches = orders.where((o) => o.bookingId == booking.id || o.bookingId == booking.serverId).toList();
                  if (matches.isNotEmpty) matched = matches.first;
                } catch (_) {}
              }

              final hasOrder = matched != null;
              final isPaid = matched != null && matched.status == OrderStatus.paid;

              switch (bookingTypeFilter) {
                case 'call':
                  return !hasOrder;
                case 'order':
                  return hasOrder && !isPaid;
                case 'paid':
                  return isPaid;
                case 'all':
                default:
                  return true;
              }
            }).toList();

            return Column(
              children: [
                _buildFilters(),
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16.0),
                    itemCount: bookingsFiltered.length,
                    itemBuilder: (context, index) {
                      final booking = bookingsFiltered[index];

                      DateTime bookingDateTime;
                      try {
                        final dt = booking.date;
                        final parsed = DateFormat.Hm().parse(booking.time);
                        bookingDateTime = DateTime(dt.year, dt.month, dt.day, parsed.hour, parsed.minute);
                      } catch (_) {
                        bookingDateTime = booking.date;
                      }

                      final now = DateTime.now();
                      final isPast = bookingDateTime.isBefore(now);

                      return Card(
                        margin: const EdgeInsets.only(bottom: 16.0),
                        child: Opacity(
                          opacity: isPast ? 0.6 : 1.0,
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(child: Text(booking.tableName, style: Theme.of(context).textTheme.titleMedium)),
                                    if (isPast)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(color: Theme.of(context).colorScheme.surfaceVariant, borderRadius: BorderRadius.circular(8)),
                                        child: Text('Đã qua', style: Theme.of(context).textTheme.bodySmall),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 8.0),
                                Wrap(
                                  spacing: 12,
                                  runSpacing: 4,
                                  crossAxisAlignment: WrapCrossAlignment.center,
                                  children: [
                                    Row(mainAxisSize: MainAxisSize.min, children: [
                                      Icon(Icons.calendar_today, size: 16, color: Theme.of(context).colorScheme.onSurfaceVariant),
                                      const SizedBox(width: 4),
                                      Text('${booking.date.day}/${booking.date.month}/${booking.date.year}', style: Theme.of(context).textTheme.bodySmall),
                                    ]),
                                    Row(mainAxisSize: MainAxisSize.min, children: [
                                      Icon(Icons.access_time, size: 16, color: Theme.of(context).colorScheme.onSurfaceVariant),
                                      const SizedBox(width: 4),
                                      Text(booking.time, style: Theme.of(context).textTheme.bodySmall),
                                    ]),
                                    Row(mainAxisSize: MainAxisSize.min, children: [
                                      Icon(Icons.people, size: 16, color: Theme.of(context).colorScheme.onSurfaceVariant),
                                      const SizedBox(width: 4),
                                      Text('${booking.guests} người', style: Theme.of(context).textTheme.bodySmall),
                                    ]),
                                  ],
                                ),
                                if (booking.notes != null && booking.notes!.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 8.0), child: Text('Ghi chú: ${booking.notes}', style: Theme.of(context).textTheme.bodySmall?.copyWith(fontStyle: FontStyle.italic))),
                                const SizedBox(height: 16.0),
                                Wrap(
                                  alignment: WrapAlignment.end,
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: [
                                    Builder(builder: (ctx) {
                                      final orders = ref.watch(orderHistoryProvider);
                                      final current = ref.watch(currentOrderProvider);

                                      Order? matched;
                                      if (current != null && (current.bookingId == booking.id || current.bookingId == booking.serverId)) matched = current;
                                      if (matched == null) {
                                        try {
                                          final matches = orders.where((o) => o.bookingId == booking.id || o.bookingId == booking.serverId).toList();
                                          if (matches.isNotEmpty) matched = matches.first;
                                        } catch (_) {
                                          matched = null;
                                        }
                                      }

                                      final hasOrder = matched != null;
                                      final isPaid = matched != null && matched.status == OrderStatus.paid;

                                      if (!isPast) {
                                        if (isPaid) {
                                          return ElevatedButton.icon(
                                            onPressed: null,
                                            icon: const Icon(Icons.check_circle, color: Colors.white),
                                            label: const Text('Đã thanh toán'),
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: Colors.green,
                                              disabledBackgroundColor: Colors.green,
                                            ),
                                          );
                                        }

                                        return hasOrder
                                            ? ElevatedButton.icon(onPressed: () => _openOrNavigateToOrder(booking), icon: const Icon(Icons.receipt_long), label: const Text('Order'))
                                            : ElevatedButton.icon(onPressed: () => onOrderFood(booking), icon: const Icon(Icons.restaurant_menu), label: const Text('Gọi món'));
                                      }

                                      return const SizedBox.shrink();
                                    }),
                                    Builder(builder: (ctx2) {
                                      final orders = ref.watch(orderHistoryProvider);
                                      final current = ref.watch(currentOrderProvider);
                                      Order? matched;
                                      if (current != null && (current.bookingId == booking.id || current.bookingId == booking.serverId)) matched = current;
                                      try {
                                        final matches = orders.where((o) => o.bookingId == booking.id || o.bookingId == booking.serverId).toList();
                                        if (matches.isNotEmpty) matched ??= matches.first;
                                      } catch (_) {}
                                      final isPaid = matched != null && matched.status == OrderStatus.paid;

                                      return Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          ElevatedButton.icon(
                                            onPressed: isPaid ? null : () => _handleEditBooking(booking),
                                            icon: const Icon(Icons.edit),
                                            label: const Text('Sửa'),
                                          ),
                                          const SizedBox(width: 8),
                                          ElevatedButton.icon(
                                            onPressed: isPaid ? null : () => _handleCancelBooking(booking),
                                            icon: const Icon(Icons.close),
                                            label: const Text('Hủy'),
                                          ),
                                        ],
                                      );
                                    }),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            );
          }

          return const Center(child: Text("Chọn một tab"));
        },
      ),
      floatingActionButton: selectedTable != null && isBookingOpen
          ? BookingDialog(
              table: selectedTable!,
              onBook: handleBookTable,
              onCancel: () {
                setState(() {
                  isBookingOpen = false;
                  selectedTable = null;
                });
              },
            )
          : null,
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }
}