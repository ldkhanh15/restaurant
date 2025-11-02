import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../application/providers.dart';
import '../../../domain/models/event.dart';
import '../../../data/services/event_app_user_service.dart';
import '../../widgets/leading_back_button.dart';

class EventBookingScreen extends ConsumerStatefulWidget {
  const EventBookingScreen({super.key});

  @override
  ConsumerState<EventBookingScreen> createState() => _EventBookingScreenState();
}

class _EventBookingScreenState extends ConsumerState<EventBookingScreen> {
  String activeTab = 'upcoming';
  EventCategory? selectedCategory;
  Event? selectedEvent;
  bool isBookingDialogOpen = false;

  @override
  void initState() {
    super.initState();
    // Fetch events after first frame to avoid using BuildContext across sync gaps
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadEvents());
  }

  Future<void> _loadEvents() async {
    try {
      final List<dynamic> raw = await EventAppUserService.fetchEvents();
      // debug: show how many items returned and a snippet of first item
      // ignore: avoid_print
      print('[EventBookingScreen] fetchEvents returned count=${raw.length}');
      if (raw.isNotEmpty) {
        // ignore: avoid_print
        print('[EventBookingScreen] first event raw=${raw.first}');
      }
      final parsed = raw.map((e) {
          final map = e as Map<String, dynamic>;
          // normalize common server field names to what Event.fromJson expects
          final normalized = <String, dynamic>{
            'id': map['id'] ?? map['event_id'] ?? map['_id'],
            'title': map['title'] ?? map['name'] ?? '',
            'description': map['description'] ?? map['desc'] ?? '',
      'date': map['date'] ?? map['event_date'] ?? map['start_date'] ?? map['created_at'] ?? DateTime.now().toIso8601String(),
      'time': map['time'] ?? map['start_time'] ?? '',
      'location': map['location'] ?? map['venue'] ?? '',
      // price can be returned as string from backend, normalize to double
      'price': (map['price'] is num)
        ? (map['price'] as num).toDouble()
        : double.tryParse((map['price'] ?? map['ticket_price'] ?? '0').toString()) ?? 0.0,
      // capacity/registered may also be string or missing
      'capacity': (map['capacity'] is int)
        ? map['capacity'] as int
        : int.tryParse((map['capacity'] ?? map['max_capacity'] ?? '0').toString()) ?? 0,
      'registered': (map['registered'] is int)
        ? map['registered'] as int
        : int.tryParse((map['registered'] ?? map['attendees'] ?? '0').toString()) ?? 0,
            'category': map['category'] ?? map['categoryName'] ?? 'music',
            'status': map['status'] ?? ((map['capacity'] ?? 0) - (map['registered'] ?? 0) > 0 ? 'available' : 'full'),
            'image': map['image'] ?? map['imageUrl'] ?? '',
          };
          return Event.fromJson(normalized);
        }).toList();

      ref.read(eventsProvider.notifier).setEvents(List<Event>.from(parsed));
    } catch (e, st) {
      // ignore: avoid_print
      print('Failed to load events: $e');
      // ignore: avoid_print
      print(st);
    }
  }


  String _formatPrice(double price) {
    return '${price.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    )}đ';
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'confirmed':
        return 'Đã xác nhận';
      case 'pending':
        return 'Chờ xác nhận';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'confirmed':
        return Colors.green;
      case 'pending':
        return Colors.orange;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getCategoryIcon(EventCategory category) {
    switch (category) {
      case EventCategory.music:
        return Icons.music_note;
      case EventCategory.food:
        return Icons.restaurant;
      case EventCategory.party:
        return Icons.celebration;
      case EventCategory.workshop:
        return Icons.school;
    }
  }

  Color _getCategoryColor(EventCategory category) {
    switch (category) {
      case EventCategory.music:
        return Colors.purple;
      case EventCategory.food:
        return Colors.orange;
      case EventCategory.party:
        return Colors.pink;
      case EventCategory.workshop:
        return Colors.blue;
    }
  }

  void _handleBookEvent(Event event) {
    setState(() {
      selectedEvent = event;
      isBookingDialogOpen = true;
    });
  }

  void _handleConfirmBooking(int guests, String notes) {
    if (selectedEvent == null) return;

    // Build payload expected by backend (nested event booking route will take eventId from params)
    final payload = {
      'numberOfTickets': guests,
      if (notes.isNotEmpty) 'notes': notes,
    };

    // Async create booking on server
    EventAppUserService.createEventBookingForEvent(selectedEvent!.id, payload).then((resp) {
      try {
        // resp may be Map<String, dynamic> or may be nested { status, data }
        final Map<String, dynamic> data = resp is Map<String, dynamic>
            ? (resp.containsKey('data') && resp['data'] is Map<String, dynamic> ? resp['data'] as Map<String, dynamic> : resp)
            : {};

        final bookingId = (data['id'] ?? data['booking_id'] ?? DateTime.now().millisecondsSinceEpoch).toString();
        final eventId = (data['event_id'] ?? data['eventId'] ?? selectedEvent!.id).toString();
        final eventTitle = data['event'] is Map<String, dynamic> ? (data['event']['title'] ?? selectedEvent!.title) : selectedEvent!.title;
        final bookingDateStr = (data['created_at'] ?? data['bookingDate'] ?? DateTime.now().toIso8601String()).toString();
        DateTime bookingDate;
        try {
          bookingDate = DateTime.parse(bookingDateStr);
        } catch (_) {
          bookingDate = DateTime.now();
        }

        final guestsReturned = (data['number_of_tickets'] ?? data['numberOfTickets'] ?? guests) as dynamic;
        final guestsInt = guestsReturned is int ? guestsReturned : int.tryParse(guestsReturned?.toString() ?? '') ?? guests;

        final status = (data['status'] ?? data['bookingStatus'] ?? 'confirmed').toString();

        final booking = EventBooking(
          id: bookingId,
          eventId: eventId,
          eventTitle: eventTitle,
          date: selectedEvent!.date,
          time: selectedEvent!.time,
          guests: guestsInt,
          status: status,
          bookingDate: bookingDate,
          notes: notes.isEmpty ? null : notes,
        );

        ref.read(eventBookingsProvider.notifier).addBooking(booking);

        setState(() {
          isBookingDialogOpen = false;
          selectedEvent = null;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã đăng ký sự kiện thành công')),
        );
      } catch (e) {
        // Parsing error fallback: still close dialog and show error
        setState(() {
          isBookingDialogOpen = false;
          selectedEvent = null;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Đăng ký thất bại: ${e.toString()}')),
        );
      }
    }).catchError((err) {
      setState(() {
        isBookingDialogOpen = false;
        selectedEvent = null;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Đăng ký thất bại: ${err.toString()}')),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final events = ref.watch(eventsProvider);
    final eventBookings = ref.watch(eventBookingsProvider);

    return Scaffold(
      appBar: AppBar(
        leading: const LeadingBackButton(),
        title: const Text('Sự kiện'),
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
                        backgroundColor: activeTab == 'upcoming'
                            ? Theme.of(context).colorScheme.background
                            : Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6.0),
                        ),
                      ),
                      onPressed: () => setState(() => activeTab = 'upcoming'),
                      child: Text(
                        'Sắp diễn ra',
                        style: TextStyle(
                          color: activeTab == 'upcoming'
                              ? Theme.of(context).colorScheme.primary
                              : Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: TextButton(
                      style: TextButton.styleFrom(
                        backgroundColor: activeTab == 'myBookings'
                            ? Theme.of(context).colorScheme.background
                            : Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6.0),
                        ),
                      ),
                      onPressed: () => setState(() => activeTab = 'myBookings'),
                      child: Text(
                        'Đã đăng ký',
                        style: TextStyle(
                          color: activeTab == 'myBookings'
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
          if (activeTab == 'upcoming') {
            return _buildUpcomingEvents(events);
          } else if (activeTab == 'myBookings') {
            return _buildMyBookings(eventBookings);
          }
          return const Center(child: Text('Chọn một tab'));
        },
      ),
      floatingActionButton: selectedEvent != null && isBookingDialogOpen
          ? _buildBookingDialog()
          : null,
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }

  Widget _buildUpcomingEvents(List<Event> events) {
    return Column(
      children: [
        // Category filter
        Container(
          height: 50,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              FilterChip(
                label: const Text('Tất cả'),
                selected: selectedCategory == null,
                onSelected: (selected) {
                  setState(() {
                    selectedCategory = null;
                  });
                },
              ),
              const SizedBox(width: 8),
              ...EventCategory.values.map((category) {
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(_getCategoryName(category)),
                    selected: selectedCategory == category,
                    onSelected: (selected) {
                      setState(() {
                        selectedCategory = selected ? category : null;
                      });
                    },
                  ),
                );
              }).toList(),
            ],
          ),
        ),
        const SizedBox(height: 16),
        
        // Events list
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: events.where((event) => 
              selectedCategory == null || event.category == selectedCategory
            ).length,
            itemBuilder: (context, index) {
              final filteredEvents = events.where((event) => 
                selectedCategory == null || event.category == selectedCategory
              ).toList();
              final event = filteredEvents[index];
              return _buildEventCard(event);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildEventCard(Event event) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Event image
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            child: AspectRatio(
              aspectRatio: 16 / 9,
              child: Image.network(
                event.image,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    color: Colors.grey[300],
                    child: Icon(
                      _getCategoryIcon(event.category),
                      size: 50,
                      color: _getCategoryColor(event.category),
                    ),
                  );
                },
              ),
            ),
          ),
          
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title and category
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        event.title,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _getCategoryColor(event.category).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: _getCategoryColor(event.category)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            _getCategoryIcon(event.category),
                            size: 16,
                            color: _getCategoryColor(event.category),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _getCategoryName(event.category),
                            style: TextStyle(
                              color: _getCategoryColor(event.category),
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                
                // Description
                Text(
                  event.description,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 12),
                
                // Date and time
                Row(
                  children: [
                    Icon(Icons.calendar_today, size: 16, color: Theme.of(context).colorScheme.primary),
                    const SizedBox(width: 4),
                    Text(
                      '${event.date.day}/${event.date.month}/${event.date.year}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(width: 16),
                    Icon(Icons.access_time, size: 16, color: Theme.of(context).colorScheme.primary),
                    const SizedBox(width: 4),
                    Text(
                      event.time,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                
                // Location
                Row(
                  children: [
                    Icon(Icons.location_on, size: 16, color: Theme.of(context).colorScheme.primary),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        event.location,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                
                // Price and capacity
                Row(
                  children: [
                    Text(
                      _formatPrice(event.price),
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '${event.registered}/${event.capacity} người',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                
                // Register button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: event.status == AvailabilityStatus.available
                        ? () => _handleBookEvent(event)
                        : null,
                    child: Text(
                      event.status == AvailabilityStatus.available
                          ? 'Đăng ký ngay'
                          : 'Đã hết chỗ',
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMyBookings(List<EventBooking> bookings) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: bookings.length,
      itemBuilder: (context, index) {
        final booking = bookings[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        booking.eventTitle,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _getStatusColor(booking.status).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: _getStatusColor(booking.status)),
                      ),
                      child: Text(
                        _getStatusText(booking.status),
                        style: TextStyle(
                          color: _getStatusColor(booking.status),
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.calendar_today, size: 16, color: Theme.of(context).colorScheme.primary),
                    const SizedBox(width: 4),
                    Text(
                      '${booking.date.day}/${booking.date.month}/${booking.date.year}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(width: 16),
                    Icon(Icons.access_time, size: 16, color: Theme.of(context).colorScheme.primary),
                    const SizedBox(width: 4),
                    Text(
                      booking.time,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.people, size: 16, color: Theme.of(context).colorScheme.primary),
                    const SizedBox(width: 4),
                    Text(
                      '${booking.guests} người',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
                if (booking.notes != null && booking.notes!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Ghi chú: ${booking.notes}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    OutlinedButton(
                      onPressed: () {
                        // Handle edit booking
                      },
                      child: const Text('Chỉnh sửa'),
                    ),
                    const SizedBox(width: 8),
                    OutlinedButton(
                      onPressed: () {
                        // Handle cancel booking
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Theme.of(context).colorScheme.error,
                      ),
                      child: const Text('Hủy đăng ký'),
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

  Widget _buildBookingDialog() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: EventBookingDialog(
        event: selectedEvent!,
        onConfirm: _handleConfirmBooking,
        onCancel: () {
          setState(() {
            isBookingDialogOpen = false;
            selectedEvent = null;
          });
        },
      ),
    );
  }

  String _getCategoryName(EventCategory category) {
    switch (category) {
      case EventCategory.music:
        return 'Âm nhạc';
      case EventCategory.food:
        return 'Ẩm thực';
      case EventCategory.party:
        return 'Tiệc tùng';
      case EventCategory.workshop:
        return 'Workshop';
    }
  }
}

class EventBookingDialog extends StatefulWidget {
  final Event event;
  final Function(int, String) onConfirm;
  final VoidCallback onCancel;

  const EventBookingDialog({
    super.key,
    required this.event,
    required this.onConfirm,
    required this.onCancel,
  });

  @override
  State<EventBookingDialog> createState() => _EventBookingDialogState();
}

class _EventBookingDialogState extends State<EventBookingDialog> {
  int guests = 1;
  final TextEditingController _notesController = TextEditingController();

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          'Đăng ký ${widget.event.title}',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Số người tham gia',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            IconButton(
              onPressed: guests > 1 ? () => setState(() => guests--) : null,
              icon: const Icon(Icons.remove),
            ),
            Container(
              width: 60,
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                border: Border.all(color: Theme.of(context).colorScheme.outline),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                guests.toString(),
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ),
            IconButton(
              onPressed: guests < widget.event.capacity ? () => setState(() => guests++) : null,
              icon: const Icon(Icons.add),
            ),
            const SizedBox(width: 8),
            Text(
              'người (tối đa ${widget.event.capacity})',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
        const SizedBox(height: 16),
        Text(
          'Ghi chú (tùy chọn)',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _notesController,
          decoration: const InputDecoration(
            hintText: 'Nhập ghi chú đặc biệt...',
            border: OutlineInputBorder(),
          ),
          maxLines: 2,
        ),
        const SizedBox(height: 24),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: widget.onCancel,
                child: const Text('Hủy'),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: ElevatedButton(
                onPressed: () {
                  widget.onConfirm(guests, _notesController.text);
                },
                child: const Text('Xác nhận đăng ký'),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
