enum BookingStatus { pending, confirmed, cancelled }

class Booking {
  final int id;
  final int tableId;
  final String tableName;
  final String? serverId;
  final DateTime date;
  final String time;
  final int guests;
  final String? notes;
  final BookingStatus status;
  final String location;
  final double price;
  final DateTime createdAt;

  const Booking({
    required this.id,
    required this.tableId,
    required this.tableName,
    this.serverId,
    required this.date,
    required this.time,
    required this.guests,
    this.notes,
    required this.status,
    required this.location,
    required this.price,
    required this.createdAt,
  });

  factory Booking.fromJson(Map<String, dynamic> json) => Booking(
        id: json['id'] as int,
        tableId: json['tableId'] as int,
        tableName: json['tableName'] as String,
    serverId: json['serverId'] as String?,
        date: DateTime.parse(json['date'] as String),
        time: json['time'] as String,
        guests: json['guests'] as int,
        notes: json['notes'] as String?,
        status: BookingStatus.values.firstWhere((e) => e.name == json['status']),
        location: json['location'] as String,
        price: (json['price'] as num).toDouble(),
        createdAt: DateTime.parse(json['createdAt'] as String),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'tableId': tableId,
        'tableName': tableName,
    'serverId': serverId,
        'date': date.toIso8601String(),
        'time': time,
        'guests': guests,
        'notes': notes,
        'status': status.name,
        'location': location,
        'price': price,
        'createdAt': createdAt.toIso8601String(),
      };

  Booking copyWith({
    int? id,
    int? tableId,
    String? tableName,
    String? serverId,
    DateTime? date,
    String? time,
    int? guests,
    String? notes,
    BookingStatus? status,
    String? location,
    double? price,
    DateTime? createdAt,
  }) {
    return Booking(
      id: id ?? this.id,
      tableId: tableId ?? this.tableId,
      tableName: tableName ?? this.tableName,
      serverId: serverId ?? this.serverId,
      date: date ?? this.date,
      time: time ?? this.time,
      guests: guests ?? this.guests,
      notes: notes ?? this.notes,
      status: status ?? this.status,
      location: location ?? this.location,
      price: price ?? this.price,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
