import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../application/providers.dart';
import '../../domain/models/booking.dart';
import '../../domain/models/table.dart';
import '../../domain/entities/reservation.dart' as ent_reservation;
import '../../domain/entities/user.dart' as ent_user;
import '../../domain/entities/table.dart' as ent_table_entity;
import '../../data/repositories/reservation_repository_impl.dart';
import '../../data/datasources/data_source_adapter_app_user.dart';
import '../../data/datasources/api_config.dart';
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


  void handleBookTable(Booking newBooking) async {
    // Try to persist booking to backend via CreateReservation usecase.
    try {
      final repo = ReservationRepositoryImpl();
      final usecase = CreateReservation(repo);

      final reservation = ent_reservation.Reservation(
        id: '',
        user: ent_user.User(id: '', name: newBooking.tableName, email: ''),
        table: ent_table_entity.Table(
          id: newBooking.tableId.toString(),
          tableNumber: newBooking.tableId,
          capacity: newBooking.guests,
          isOccupied: false,
        ),
        dateTime: DateTime(
          newBooking.date.year,
          newBooking.date.month,
          newBooking.date.day,
        ),
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
        id: int.tryParse(created.id) ?? DateTime.now().millisecondsSinceEpoch,
  serverId: created.id.toString(),
        tableId: int.tryParse(created.table.id) ?? newBooking.tableId,
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
      }

      // Close dialog and navigate
      setState(() {
        isBookingOpen = false;
        selectedTable = null;
      });

      if (mounted) {
        // After booking, navigate user to their bookings
        context.go('/my-bookings');
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
  if (mounted) context.go('/my-bookings');
    }
  }

  void onOrderFood(Booking booking) {
    context.go('/menu', extra: booking);
  }

  Future<void> _loadBookingsFromServer() async {
    if (_isLoadingBookings) return;
    setState(() {
      _isLoadingBookings = true;
    });
    try {
      // debug info
      // ignore: avoid_print
      print('[TableBookingScreen] ApiConfig.baseUrl = ${ApiConfig.baseUrl}');
      // ignore: avoid_print
      print('[TableBookingScreen] ApiConfig.authToken length = ${ApiConfig.authToken.length}');
      final raw = await DataSourceAdapterAppUser.getReservations_app_user();
      // debug: log raw response size
      // ignore: avoid_print
      print('[TableBookingScreen] raw reservations from server: ${raw.runtimeType} ${raw.length}');
      // raw is a List<dynamic> where each item is Map<String, dynamic>
      final List<Booking> fetched = raw.map<Booking>((item) {
        final map = item as Map<String, dynamic>;
        // ignore: avoid_print
        print('[TableBookingScreen] reservation item id=${map['id']} status=${map['status']}');
        final sid = map['id']?.toString() ?? '';
        final tableMap = map['table'] as Map<String, dynamic>?;
        final tableId = int.tryParse(tableMap?['id']?.toString() ?? '') ?? (tableMap?['tableNumber'] as int?) ?? 0;
        final dateTime = DateTime.tryParse(map['dateTime'] ?? '') ?? DateTime.now();
        final statusStr = (map['status'] ?? '').toString().toLowerCase();
        BookingStatus status = BookingStatus.pending;
        if (statusStr == 'confirmed') status = BookingStatus.confirmed;
        if (statusStr == 'cancelled' || statusStr == 'canceled') status = BookingStatus.cancelled;

        return Booking(
          id: int.tryParse(sid) ?? DateTime.now().millisecondsSinceEpoch,
          serverId: sid,
          tableId: tableId,
          tableName: tableMap?['tableNumber']?.toString() ?? 'Bàn ${tableId}',
          date: DateTime(dateTime.year, dateTime.month, dateTime.day),
          time: '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}',
          guests: (map['numberOfGuests'] as int?) ?? (map['guests'] as int?) ?? 1,
          notes: map['notes'] as String?,
          status: status,
          location: map['location'] as String? ?? '',
          price: (map['price'] is num) ? (map['price'] as num).toDouble() : 0.0,
          createdAt: DateTime.tryParse(map['createdAt'] ?? '') ?? DateTime.now(),
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
        final payload = {
          'dateTime': DateTime(updated.date.year, updated.date.month, updated.date.day).toIso8601String(),
          'numberOfGuests': updated.guests,
        };
  await DataSourceAdapterAppUser.updateReservation_app_user(idStr, payload);
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
      await DataSourceAdapterAppUser.deleteReservation_app_user(idStr);
      // remove from provider
      final list = ref.read(bookingsProvider);
      final newList = list.where((b) => b.id != booking.id).toList();
      ref.read(bookingsProvider.notifier).setBookings(newList);
    } catch (e) {
      // fallback: remove locally
      final list = ref.read(bookingsProvider);
      final newList = list.where((b) => b.id != booking.id).toList();
      ref.read(bookingsProvider.notifier).setBookings(newList);
    }
  }

  @override
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
            if (_isLoadingBookings) {
              return const Center(child: CircularProgressIndicator());
            }

            if (myBookings.isEmpty) {
              return Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('Bạn chưa có đặt chỗ nào.'),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: _loadBookingsFromServer,
                      child: const Text('Tải lại'),
                    ),
                  ],
                ),
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.all(16.0),
              itemCount: myBookings.length,
              itemBuilder: (context, index) {
                final booking = myBookings[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 16.0),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          booking.tableName,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 8.0),
                        Row(
                          children: [
                            Icon(Icons.calendar_today, size: 16, color: Theme.of(context).colorScheme.onSurfaceVariant),
                            const SizedBox(width: 4),
                            Text(
                              '${booking.date.day}/${booking.date.month}/${booking.date.year}',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                            const SizedBox(width: 16),
                            Icon(Icons.access_time, size: 16, color: Theme.of(context).colorScheme.onSurfaceVariant),
                            const SizedBox(width: 4),
                            Text(
                              booking.time,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                            const SizedBox(width: 16),
                            Icon(Icons.people, size: 16, color: Theme.of(context).colorScheme.onSurfaceVariant),
                            const SizedBox(width: 4),
                            Text(
                              '${booking.guests} người',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                        if (booking.notes != null && booking.notes!.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 8.0),
                            child: Text(
                              'Ghi chú: ${booking.notes}',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(fontStyle: FontStyle.italic),
                            ),
                          ),
                        const SizedBox(height: 16.0),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            if (booking.status == BookingStatus.confirmed) ...[
                              ElevatedButton.icon(
                                onPressed: () => onOrderFood(booking),
                                icon: const Icon(Icons.restaurant_menu),
                                label: const Text('Gọi món'),
                              ),
                              const SizedBox(width: 8),
                              ElevatedButton.icon(
                                onPressed: () {
                                  // If there is a current order for this booking, go to payment; otherwise go to menu to create one
                                  final currentOrder = ref.read(currentOrderProvider);
                                  if (currentOrder != null && currentOrder.bookingId == booking.id) {
                                    context.go('/payment');
                                  } else {
                                    context.go('/menu', extra: booking);
                                  }
                                },
                                icon: const Icon(Icons.payment),
                                label: const Text('Thanh toán'),
                              ),
                            ],
                            const SizedBox(width: 8),
                            OutlinedButton(
                              onPressed: () => _handleEditBooking(booking),
                              child: const Text('Chỉnh sửa'),
                            ),
                            const SizedBox(width: 8),
                            OutlinedButton(
                              onPressed: () => _handleCancelBooking(booking),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Theme.of(context).colorScheme.error,
                              ),
                              child: const Text('Hủy đặt'),
                            ),
                          ],
                        ),
                      ],
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