import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../application/providers.dart';
import '../../application/socket_manager.dart';
import '../../data/services/order_app_user_service_app_user.dart';
import '../../domain/models/order.dart';
import '../../domain/models/menu.dart';
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


  void handleBookTable(Booking newBooking) async {
    // Try to persist booking to backend via CreateReservation usecase.
    try {
      final repo = ReservationRepositoryImpl();
      final usecase = CreateReservation(repo);
      final currentUser = ref.read(userProvider);

      // Combine date and time correctly
      final timeParts = newBooking.time.split(':');
      final hour = int.tryParse(timeParts[0]) ?? 0;
      final minute = int.tryParse(timeParts[1]) ?? 0;
      final reservationDateTime = DateTime(
        newBooking.date.year,
        newBooking.date.month,
        newBooking.date.day,
        hour,
        minute,
        ).toUtc(); // Convert to UTC before sending

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
      // debug: log reservation and current user id
      // ignore: avoid_print
      print('[TableBookingScreen] creating reservation, ApiConfig.currentUserId=${ApiConfig.currentUserId}');
      // ignore: avoid_print
      print('[TableBookingScreen] reservation payload dateTime=${reservation.dateTime.toIso8601String()} numberOfGuests=${reservation.numberOfGuests} table.id=${reservation.table.id}');

      final created = await usecase.call(reservation);

      // Map created Reservation to Booking model expected by providers
      final createdBooking = Booking(
        id: created.id,
  serverId: created.id.toString(),
        tableId: created.table.id, // Already a string
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

      // Update providers with server-backed booking
      ref.read(bookingsProvider.notifier).addBooking(createdBooking);
      // Refresh bookings from server to get canonical ids/statuses
      await _loadBookingsFromServer();
      // show success
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
          print('Failed to update table status on backend: $e');
        }
      }

      // Close dialog and navigate
      setState(() {
        isBookingOpen = false;
        selectedTable = null;
      });

      if (mounted) {
        // After booking, switch to the 'myBookings' tab
        setState(() => activeTab = "myBookings");
        _loadBookingsFromServer();
      }
    } catch (e) {
      // Fallback to local behavior if API call fails
      // show error to user
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
      });
      // Attempt to refresh bookings; if API is unreachable this will silently fail
      try {
        await _loadBookingsFromServer();
      } catch (_) {}
      if (mounted) {
        setState(() => activeTab = "myBookings");
        _loadBookingsFromServer();
      }
    }
  }

  Future<void> onOrderFood(Booking booking) async {
    // If there's an existing order for this booking, load its items into the cart and set current order
    try {
      // ignore: avoid_print
      print('[TableBookingScreen] onOrderFood: fetching orders for booking=${booking.id} serverId=${booking.serverId}');
      final raw = await OrderAppUserService.fetchOrdersForUser(page: 1, limit: 100);
      // ignore: avoid_print
      print('[TableBookingScreen] fetched raw orders=${raw.length}');
      final orders = raw.map((e) => Order.fromJson(e as Map<String, dynamic>)).where((o) => o.bookingId == booking.id || o.bookingId == booking.serverId).toList();
      // ignore: avoid_print
      print('[TableBookingScreen] matched orders=${orders.length}');
      // Show a quick SnackBar so testers can see counts in the UI when reproducing the flow
      if (mounted) {
        try {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Tải orders: ${raw.length}, khớp: ${orders.length}')));
        } catch (_) {}
      }
      if (orders.isNotEmpty) {
        // Prefer an order that actually contains items; fallback to the first result
        final last = orders.firstWhere((o) => o.items.isNotEmpty, orElse: () => orders.first);
        // populate cart from order items
        final cartNotifier = ref.read(cartItemsProvider.notifier);
        cartNotifier.clearCart();
        // ignore: avoid_print
        print('[TableBookingScreen] populating cart from order id=${last.id} items=${last.items.length}');
        for (final oi in last.items) {
          final ci = CartItem(
            id: oi.id.toString(),
            name: oi.name,
            price: oi.price,
            quantity: oi.quantity,
            image: oi.image,
            customizations: oi.customizations,
            specialNote: oi.specialNote,
          );
          cartNotifier.addItem(ci);
          // ignore: avoid_print
          print('[TableBookingScreen] added cart item id=${ci.id} name=${ci.name} qty=${ci.quantity}');
        }
        // set current order and order items providers
        ref.read(currentOrderProvider.notifier).setOrder(last);
        ref.read(orderItemsProvider.notifier).setItems(last.items);
      }
      else {
        // Fallback: sometimes backend stores table_id/reservation_id in raw shape differently.
        try {
          Map<String, dynamic>? matchedRaw;
          for (final e in raw) {
            if (e is Map<String, dynamic>) {
              final rid = (e['reservation_id'] ?? e['reservationId'] ?? e['reservation'] ?? '').toString();
              final tid = (e['table_id'] ?? e['tableId'] ?? e['table'] ?? '').toString();
              if (rid.isNotEmpty && (rid == booking.serverId || rid == booking.id)) {
                matchedRaw = e;
                // ignore: avoid_print
                print('[TableBookingScreen] fallback matched by reservation_id=$rid');
                break;
              }
              if (tid.isNotEmpty && tid == booking.tableId) {
                matchedRaw = e;
                // ignore: avoid_print
                print('[TableBookingScreen] fallback matched by table_id=$tid');
                break;
              }
            }
          }
          if (matchedRaw != null) {
            final o = Order.fromJson(matchedRaw);
            if (o.items.isNotEmpty) {
              final cartNotifier = ref.read(cartItemsProvider.notifier);
              cartNotifier.clearCart();
              // ignore: avoid_print
              print('[TableBookingScreen] populating cart from fallback order id=${o.id} items=${o.items.length}');
              for (final oi in o.items) {
                final ci = CartItem(
                  id: oi.id.toString(),
                  name: oi.name,
                  price: oi.price,
                  quantity: oi.quantity,
                  image: oi.image,
                  customizations: oi.customizations,
                  specialNote: oi.specialNote,
                );
                cartNotifier.addItem(ci);
                // ignore: avoid_print
                print('[TableBookingScreen] added cart item (fallback) id=${ci.id} name=${ci.name} qty=${ci.quantity}');
              }
              ref.read(currentOrderProvider.notifier).setOrder(o);
              ref.read(orderItemsProvider.notifier).setItems(o.items);
            }
          }
        } catch (e) {
          // ignore: avoid_print
          print('[TableBookingScreen] fallback match error: $e');
        }
      }
    } catch (e) {
      // ignore: avoid_print
      print('[TableBookingScreen] onOrderFood error: $e');
    }

    if (!mounted) return;
    context.go('/menu', extra: booking);
  }

  Future<void> _loadBookingsFromServer() async {
    if (_isLoadingBookings) return;
    setState(() {
      _isLoadingBookings = true;
    });
    try {
      // Fetch raw data to ensure correct parsing, bypassing the repository
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
          time: TimeOfDay.fromDateTime(reservationTime).format(context),
          guests: (map['num_people'] is int) ? map['num_people'] as int : 1,
          status: status,
          location: tableMap?['location'] ?? 'N/A',
          price: (tableMap?['price'] as num?)?.toDouble() ?? 0.0,
          createdAt: (DateTime.tryParse(map['createdAt'] ?? '') ?? DateTime.now()).toLocal(),
        );
      }).toList();

      ref.read(bookingsProvider.notifier).setBookings(fetched);
    } catch (e) {
      // debug error
      // ignore: avoid_print
      print('[TableBookingScreen] failed to load reservations: $e');
      // keep existing bookings (maybe mock or previously created ones)
    } finally {
      setState(() {
        _isLoadingBookings = false;
      });
    }
  }

  void _handleEditBooking(Booking booking) {
    // Open BookingDialog pre-filled by setting selectedTable and isBookingOpen
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
    // When dialog saves, call update
    void onUpdate(Booking updated) async {
      try {
        // call backend update: prefer server-side reservation id (UUID) when available
        final idStr = (booking.serverId != null && booking.serverId!.isNotEmpty)
            ? booking.serverId!
            : booking.id.toString();
      // Combine date and time correctly for update
      final timeParts = updated.time.split(':');
      final hour = int.tryParse(timeParts[0]) ?? 0;
      final minute = int.tryParse(timeParts[1]) ?? 0;
      final reservationDateTime = DateTime(
        updated.date.year,
        updated.date.month,
        updated.date.day,
        hour,
        minute,
      ).toUtc(); // Convert to UTC before sending

        final payload = {
        'reservation_time': reservationDateTime.toIso8601String(),
        'num_people': updated.guests,
        };
  await ReservationAppUserServiceAppUser.updateReservation(idStr, payload);
  final updatedBooking = updated;
        ref.read(bookingsProvider.notifier).updateBooking(updatedBooking);
      } catch (e) {
        // fallback: update local provider
        ref.read(bookingsProvider.notifier).updateBooking(updated);
      } finally {
        setState(() {
          isBookingOpen = false;
          selectedTable = null;
        });
      }
    }

    // show dialog via floatingActionButton (the widget will pick up editingBooking via constructor)
    // we replace floatingActionButton temporarily by passing editingBooking and onUpdate when built
    // To keep changes small, we store the onUpdate callback in state via a closure - using a simplistic approach: call showDialog
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
    // optimistic remove
    try {
      // Prefer serverId (UUID) when present to delete the correct reservation on backend
      final idStr = (booking.serverId != null && booking.serverId!.isNotEmpty)
          ? booking.serverId!
          : booking.id.toString();
  await ReservationAppUserServiceAppUser.cancelReservation(idStr);
      // Update the booking in the provider with the new 'cancelled' status
      final updatedBooking = Booking.fromReservation(
        Booking.toReservation(booking), // Convert existing booking to reservation entity
        context,
      ).copyWith(status: BookingStatus.cancelled); // Create a new booking model with updated status

      ref.read(bookingsProvider.notifier).updateBooking(updatedBooking);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đã hủy đặt bàn')));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Hủy thất bại: $e')));
    }
  }

  Future<void> _openOrderDialog(Booking booking) async {
    // Fetch orders for user and filter by booking id
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
                            // Close dialog then navigate to the menu screen so user can add items to cart
                            Navigator.of(ctx).pop();
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
                                  // Set current order so the target screens can display it
                                  try {
                                    ref.read(currentOrderProvider.notifier).setOrder(o);
                                    ref.read(orderItemsProvider.notifier).setItems(o.items);
                                  } catch (_) {}
                                  // Navigate to appropriate screen depending on order status
                                  if (o.status == OrderStatus.pending) {
                                    context.go('/order-confirmation', extra: booking);
                                  } else if (o.status == OrderStatus.waitingKitchenConfirmation || o.status == OrderStatus.sentToKitchen || o.status == OrderStatus.preparing || o.status == OrderStatus.ready) {
                                    // For any kitchen-involved state, open the kitchen status screen
                                    context.go('/kitchen-status');
                                  } else {
                                    // Default: open confirmation to view/edit
                                    context.go('/order-confirmation', extra: booking);
                                  }
                                } else if (val == 'send') {
                                  try {
                                    final updated = await OrderAppUserService.sendToKitchen(o.id);
                                    // optimistic notify: update providers
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
                                    } catch (_) {}
                                    // inform user
                                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đã gửi tới bếp')));
                                  } catch (e) {
                                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Gửi tới bếp thất bại: $e')));
                                  }
                                } else if (val == 'follow') {
                                  try {
                                    // set current order so kitchen screen shows details immediately
                                    ref.read(currentOrderProvider.notifier).setOrder(o);
                                    ref.read(orderItemsProvider.notifier).setItems(o.items);
                                  } catch (_) {}
                                  try {
                                    ref.read(orderSocketManagerProvider).joinOrder(o.id);
                                  } catch (_) {}
                                  Navigator.of(ctx).pop();
                                  context.go('/kitchen-status');
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

  @override
  void initState() {
    super.initState();
    // Defer initializer until after first frame so context & ref are ready.
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!_initialized) {
        _initialized = true;
        try {
          await initializeAppUserData_app_user(ref);
          setState(() {});
        } catch (e) {
          // ignore: avoid_print
          print('[TableBookingScreen] initializer failed: $e');
        }
      }
    });
  }

  Widget build(BuildContext context) {
    final availableTables = ref.watch(tablesProvider);
    final myBookings = ref.watch(bookingsProvider);

    return Scaffold(
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
                        backgroundColor: activeTab == "available"
                            ? Theme.of(context).colorScheme.background
                            : Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6.0),
                        ),
                      ),
                      onPressed: () => setState(() => activeTab = "available"),
                      child: Text(
                        'Danh sách',
                        style: TextStyle(
                          color: activeTab == "available"
                              ? Theme.of(context).colorScheme.primary
                              : Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: TextButton(
                      style: TextButton.styleFrom(
                        backgroundColor: activeTab == "map"
                            ? Theme.of(context).colorScheme.background
                            : Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6.0),
                        ),
                      ),
                      onPressed: () => setState(() => activeTab = "map"),
                      child: Text(
                        'Sơ đồ',
                        style: TextStyle(
                          color: activeTab == "map"
                              ? Theme.of(context).colorScheme.primary
                              : Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: TextButton(
                      style: TextButton.styleFrom(
                        backgroundColor: activeTab == "myBookings"
                            ? Theme.of(context).colorScheme.background
                            : Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6.0),
                        ),
                      ),
                      onPressed: () {
                        setState(() => activeTab = "myBookings");
                        // load from server when viewing my bookings
                        _loadBookingsFromServer();
                      },
                      child: Text(
                        'Của tôi',
                        style: TextStyle(
                          color: activeTab == "myBookings"
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
      body: Builder(
        builder: (context) {
          if (activeTab == "available") {
            // If we're configured to use a remote API but haven't received tables yet,
            // show a friendly loading / retry UI. This helps diagnose network/init issues.
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
                      // Try to re-run the initializer which fetches and sets tables
                      await initializeAppUserData_app_user(ref);
                      setState(() {});
                    }, child: const Text('Tải lại')),
                  ],
                ),
              );
            }

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

            return ListView.builder(
              padding: const EdgeInsets.all(16.0),
              itemCount: myBookings.length,
              itemBuilder: (context, index) {
                final booking = myBookings[index];

                // combine date + time into a DateTime for comparisons
                DateTime bookingDateTime;
                try {
                  final dt = booking.date;
                  try {
                    final parsed = DateFormat.Hm().parse(booking.time);
                    bookingDateTime = DateTime(dt.year, dt.month, dt.day, parsed.hour, parsed.minute);
                  } catch (_) {
                    bookingDateTime = dt;
                  }
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
                              if (!isPast)
                                ElevatedButton.icon(onPressed: () => onOrderFood(booking), icon: const Icon(Icons.restaurant_menu), label: const Text('Gọi món')),
                              if (!isPast)
                                ElevatedButton.icon(onPressed: () => _openOrderDialog(booking), icon: const Icon(Icons.receipt_long), label: const Text('Order')),
                              ElevatedButton.icon(onPressed: isPast ? null : () { final currentOrder = ref.read(currentOrderProvider); if (currentOrder != null && currentOrder.bookingId == booking.id) context.go('/payment'); else context.go('/menu', extra: booking); }, icon: const Icon(Icons.payment), label: const Text('Thanh toán')),
                              OutlinedButton(onPressed: isPast ? null : () => _handleEditBooking(booking), child: const Text('Chỉnh sửa')),
                              OutlinedButton(onPressed: isPast ? null : () => _handleCancelBooking(booking), style: OutlinedButton.styleFrom(foregroundColor: isPast ? Theme.of(context).colorScheme.onSurfaceVariant : Theme.of(context).colorScheme.error), child: const Text('Hủy đặt')),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
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