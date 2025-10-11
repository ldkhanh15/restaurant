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
        title: json['title'] as String,
        description: json['description'] as String,
        date: DateTime.parse(json['date'] as String),
        time: json['time'] as String,
        location: json['location'] as String,
        price: (json['price'] as num).toDouble(),
        capacity: json['capacity'] as int,
        registered: json['registered'] as int,
        category: EventCategory.values.firstWhere((e) => e.name == json['category']),
        status: AvailabilityStatus.values.firstWhere((e) => e.name == json['status']),
        image: json['image'] as String,
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