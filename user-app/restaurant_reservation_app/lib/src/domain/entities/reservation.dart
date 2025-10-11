
import 'package:restaurant_reservation_app/src/domain/entities/table.dart';
import 'package:restaurant_reservation_app/src/domain/entities/user.dart';

class Reservation {
  final String id;
  final User user;
  final Table table;
  final DateTime dateTime;
  final int numberOfGuests;
  final String? status;
  final int? durationMinutes;
  final int? timeoutMinutes;
  final bool? confirmationSent;
  final DateTime? createdAt;

  Reservation({
    required this.id,
    required this.user,
    required this.table,
    required this.dateTime,
    required this.numberOfGuests,
    this.status,
    this.durationMinutes,
    this.timeoutMinutes,
    this.confirmationSent,
    this.createdAt,
  });

  /// Tolerant parser for backend responses. Accepts snake_case and camelCase keys.
  factory Reservation.fromJson(Map<String, dynamic> json) {
    // Helper to read keys with both snake_case and camelCase
    dynamic read(String camel, String snake) => json[camel] ?? json[snake];

    final id = read('id', 'id')?.toString() ?? '';

    final userJson = read('user', 'user') as Map<String, dynamic>?;
    final userId = read('user_id', 'user_id')?.toString();

    final tableJson = read('table', 'table') as Map<String, dynamic>?;
    final tableId = read('table_id', 'table_id')?.toString();

    // Parse date/time from multiple possible fields
    final dtRaw = read('reservation_time', 'reservation_time') ?? read('reservationTime', 'reservationTime') ?? read('dateTime', 'dateTime') ?? read('date', 'date');
    DateTime dt;
    if (dtRaw is String) {
      dt = DateTime.parse(dtRaw);
    } else if (dtRaw is DateTime) {
      dt = dtRaw;
    } else {
      dt = DateTime.now();
    }

    final numPeople = (read('num_people', 'num_people') ?? read('numberOfGuests', 'numberOfGuests') ?? json['guests']) as dynamic;
    final numberOfGuests = (numPeople is int) ? numPeople : int.tryParse(numPeople?.toString() ?? '') ?? 1;

    final createdRaw = read('created_at', 'created_at') ?? read('createdAt', 'createdAt');
    DateTime? createdAt;
    if (createdRaw is String) createdAt = DateTime.tryParse(createdRaw);
    if (createdRaw is DateTime) createdAt = createdRaw;

    final status = read('status', 'status')?.toString();
    final duration = (read('duration_minutes', 'duration_minutes') ?? read('durationMinutes', 'durationMinutes')) as dynamic;
    final timeout = (read('timeout_minutes', 'timeout_minutes') ?? read('timeoutMinutes', 'timeoutMinutes')) as dynamic;
    final confirmation = (read('confirmation_sent', 'confirmation_sent') ?? read('confirmationSent', 'confirmationSent')) as dynamic;

    // Build user and table entities (fallback to minimal objects if nested not provided)
    final user = userJson != null
        ? User.fromJson(userJson)
        : User(id: userId ?? '', name: '', email: '', phone: null);

    final table = tableJson != null
        ? Table.fromJson(tableJson)
        : Table(id: tableId ?? '', tableNumber: 0, capacity: 0, isOccupied: false, location: null);

    return Reservation(
      id: id,
      user: user,
      table: table,
      dateTime: dt,
      numberOfGuests: numberOfGuests,
      status: status,
      durationMinutes: duration is int ? duration : (int.tryParse(duration?.toString() ?? '') ?? null),
      timeoutMinutes: timeout is int ? timeout : (int.tryParse(timeout?.toString() ?? '') ?? null),
      confirmationSent: confirmation is bool ? confirmation : (confirmation?.toString().toLowerCase() == 'true' ? true : null),
      createdAt: createdAt,
    );
  }
}
