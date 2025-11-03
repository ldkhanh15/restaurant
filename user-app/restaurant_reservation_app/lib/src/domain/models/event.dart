enum EventCategory { music, food, party, workshop }
enum AvailabilityStatus { available, full }

class Event {
  final String id;
  final String title;
  final String description;
  final DateTime date;
  final String time;
  final String location;
  final double price;
  final int capacity;
  final int registered;
  final EventCategory category;
  final AvailabilityStatus status;
  final String image;

  const Event({
    required this.id,
    required this.title,
    required this.description,
    required this.date,
    required this.time,
    required this.location,
    required this.price,
    required this.capacity,
    required this.registered,
    required this.category,
    required this.status,
    required this.image,
  });

  factory Event.fromJson(Map<String, dynamic> json) => Event(
        id: json['id'].toString(),
        title: (json['title'] ?? json['name'] ?? '').toString(),
        description: (json['description'] ?? json['desc'] ?? '').toString(),
        date: (() {
          final v = json['date'] ?? json['event_date'] ?? json['start_date'] ?? json['created_at'] ?? DateTime.now().toIso8601String();
          try {
            return DateTime.parse(v.toString());
          } catch (_) {
            return DateTime.now();
          }
        })(),
        time: (json['time'] ?? json['start_time'] ?? '').toString(),
        location: (json['location'] ?? json['venue'] ?? '').toString(),
        price: (() {
          final p = json['price'] ?? json['ticket_price'] ?? 0;
          if (p is num) return p.toDouble();
          if (p is String) return double.tryParse(p) ?? 0.0;
          return 0.0;
        })(),
        capacity: (() {
          final c = json['capacity'] ?? json['max_capacity'] ?? 0;
          if (c is int) return c;
          if (c is num) return c.toInt();
          return int.tryParse(c.toString()) ?? 0;
        })(),
        registered: (() {
          final r = json['registered'] ?? json['attendees'] ?? 0;
          if (r is int) return r;
          if (r is num) return r.toInt();
          return int.tryParse(r.toString()) ?? 0;
        })(),
        category: (() {
          final c = (json['category'] ?? json['categoryName'] ?? 'music').toString();
          return EventCategory.values.firstWhere(
              (e) => e.name.toLowerCase() == c.toLowerCase(),
              orElse: () => EventCategory.music);
        })(),
        status: (() {
          final s = (json['status'] ?? '').toString();
          return AvailabilityStatus.values.firstWhere(
              (e) => e.name.toLowerCase() == s.toLowerCase(),
              orElse: () {
                // heuristic: if capacity > registered -> available
                try {
                  final cap = (() {
                    final c = json['capacity'] ?? json['max_capacity'] ?? 0;
                    if (c is num) return c.toInt();
                    return int.tryParse(c.toString()) ?? 0;
                  })();
                  final reg = (() {
                    final r = json['registered'] ?? json['attendees'] ?? 0;
                    if (r is num) return r.toInt();
                    return int.tryParse(r.toString()) ?? 0;
                  })();
                  return cap - reg > 0 ? AvailabilityStatus.available : AvailabilityStatus.full;
                } catch (_) {
                  return AvailabilityStatus.available;
                }
              });
        })(),
        image: (json['image'] ?? json['imageUrl'] ?? '').toString(),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
        'date': date.toIso8601String(),
        'time': time,
        'location': location,
        'price': price,
        'capacity': capacity,
        'registered': registered,
        'category': category.name,
        'status': status.name,
        'image': image,
      };

  Event copyWith({
    String? id,
    String? title,
    String? description,
    DateTime? date,
    String? time,
    String? location,
    double? price,
    int? capacity,
    int? registered,
    EventCategory? category,
    AvailabilityStatus? status,
    String? image,
  }) {
    return Event(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      date: date ?? this.date,
      time: time ?? this.time,
      location: location ?? this.location,
      price: price ?? this.price,
      capacity: capacity ?? this.capacity,
      registered: registered ?? this.registered,
      category: category ?? this.category,
      status: status ?? this.status,
      image: image ?? this.image,
    );
  }
}

class EventBooking {
  final String id;
  final String eventId;
  final String eventTitle;
  final DateTime date;
  final String time;
  final int guests;
  final String status;
  final DateTime bookingDate;
  final String? notes;

  const EventBooking({
    required this.id,
    required this.eventId,
    required this.eventTitle,
    required this.date,
    required this.time,
    required this.guests,
    required this.status,
    required this.bookingDate,
    this.notes,
  });

  factory EventBooking.fromJson(Map<String, dynamic> json) => EventBooking(
        id: json['id'].toString(),
        eventId: json['eventId'].toString(),
        eventTitle: json['eventTitle'] as String,
        date: DateTime.parse(json['date'] as String),
        time: json['time'] as String,
        guests: json['guests'] as int,
        status: json['status'] as String,
        bookingDate: DateTime.parse(json['bookingDate'] as String),
        notes: json['notes'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'eventId': eventId,
        'eventTitle': eventTitle,
        'date': date.toIso8601String(),
        'time': time,
        'guests': guests,
        'status': status,
        'bookingDate': bookingDate.toIso8601String(),
        'notes': notes,
      };

  EventBooking copyWith({
    String? id,
    String? eventId,
    String? eventTitle,
    DateTime? date,
    String? time,
    int? guests,
    String? status,
    DateTime? bookingDate,
    String? notes,
  }) {
    return EventBooking(
      id: id ?? this.id,
      eventId: eventId ?? this.eventId,
      eventTitle: eventTitle ?? this.eventTitle,
      date: date ?? this.date,
      time: time ?? this.time,
      guests: guests ?? this.guests,
      status: status ?? this.status,
      bookingDate: bookingDate ?? this.bookingDate,
      notes: notes ?? this.notes,
    );
  }
}