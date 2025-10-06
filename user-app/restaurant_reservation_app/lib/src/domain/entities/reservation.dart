
import 'package:restaurant_reservation_app/src/domain/entities/table.dart';
import 'package:restaurant_reservation_app/src/domain/entities/user.dart';

class Reservation {
  final String id;
  final User user;
  final Table table;
  final DateTime dateTime;
  final int numberOfGuests;

  Reservation({
    required this.id,
    required this.user,
    required this.table,
    required this.dateTime,
    required this.numberOfGuests,
  });
}
