import 'package:flutter/material.dart';
import '../entities/reservation.dart' as ent_reservation;
import '../entities/user.dart' as ent_user;
import '../entities/table.dart' as ent_table;

enum BookingStatus { pending, confirmed, seated, completed, cancelled, no_show }

class Booking {
  final String id; // Should be String for UUIDs
  final String tableId; // Should be String for UUIDs
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

  factory Booking.fromJson(Map<String, dynamic> json) {
    dynamic read(String a, String b) => json[a] ?? json[b] ?? json[a.toLowerCase()];

    final id = read('id', 'id')?.toString() ?? '';
    final tableId = (read('tableId', 'table_id') ?? read('table_id', 'tableId'))?.toString() ?? '';
    final tableName = read('tableName', 'table_name') as String? ?? (json['table'] is Map ? (json['table']['table_number']?.toString() ?? '') : '');
    final serverId = read('serverId', 'server_id') as String?;

    final dateRaw = read('date', 'reservation_time') ?? read('reservationTime', 'reservation_time');
    DateTime date;
    if (dateRaw is String) date = DateTime.parse(dateRaw);
    else if (dateRaw is DateTime) date = dateRaw;
    else date = DateTime.now();

    final time = read('time', 'time') as String? ?? '';

    final guestsRaw = read('guests', 'guests') ?? read('numberOfGuests', 'num_people') ?? read('numberOfGuests', 'numberOfGuests');
    final guests = (guestsRaw is int) ? guestsRaw : int.tryParse(guestsRaw?.toString() ?? '') ?? 1;

    final notes = read('notes', 'notes') as String?;

    final statusRaw = read('status', 'status') as String? ?? 'pending';
    BookingStatus status;
    try {
      status = BookingStatus.values.firstWhere((e) => e.name == statusRaw);
    } catch (_) {
      status = BookingStatus.pending;
    }

    final location = read('location', 'location') as String? ?? '';

    final priceRaw = read('price', 'price');
  final price = (priceRaw is num) ? priceRaw.toDouble() : (double.tryParse(priceRaw?.toString() ?? '') ?? 0.0);

    final createdRaw = read('createdAt', 'created_at');
    DateTime createdAt;
    if (createdRaw is String) createdAt = DateTime.parse(createdRaw);
    else if (createdRaw is DateTime) createdAt = createdRaw;
    else createdAt = DateTime.now();

    return Booking(
      id: id,
      tableId: tableId,
      tableName: tableName,
      serverId: serverId,
      date: date,
      time: time,
      guests: guests,
      notes: notes,
      status: status,
  location: location,
      price: price,
      createdAt: createdAt,
    );
  }

  // Helper to convert from Reservation entity
  factory Booking.fromReservation(ent_reservation.Reservation reservation, BuildContext context) {
    final statusString = reservation.status?.toLowerCase() ?? 'pending';
    final status = BookingStatus.values.firstWhere(
      (e) => e.name == statusString,
      orElse: () => BookingStatus.pending,
    );

    return Booking(
      id: reservation.id, // Already a string
      serverId: reservation.id,
      tableId: reservation.table.id, // Already a string
      tableName: reservation.table.tableNumber.toString(),
      date: reservation.dateTime,
      time: TimeOfDay.fromDateTime(reservation.dateTime).format(context),
      guests: reservation.numberOfGuests,
      status: status,
      location: reservation.table.location ?? '',
      price: 0.0, // Price might not be on reservation entity, default to 0
      createdAt: reservation.createdAt ?? DateTime.now(),
    );
  }

  // Helper to convert to Reservation entity
  static ent_reservation.Reservation toReservation(Booking booking) {
    return ent_reservation.Reservation(
      id: booking.serverId ?? booking.id.toString(),
      user: ent_user.User( // Correctly reference ent_user.User
        id: '', // User ID should be fetched from a provider
        name: '', // User name should be fetched from a provider
        email: '', // User email should be fetched from a provider
      ),
      table: ent_table.Table( // Correctly reference ent_table.Table
        id: booking.tableId.toString(),
        tableNumber: int.tryParse(booking.tableName) ?? 0,
        capacity: booking.guests,
        isOccupied: false,
        location: booking.location,
      ),
      dateTime: booking.date,
      numberOfGuests: booking.guests,
      status: booking.status.name,
      createdAt: booking.createdAt,
    );
  }

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
    String? id,
    String? tableId,
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
