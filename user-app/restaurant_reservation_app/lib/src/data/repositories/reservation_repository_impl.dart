
import 'package:restaurant_reservation_app/src/data/services/reservation_app_user_service_app_user.dart';
import 'package:restaurant_reservation_app/src/domain/entities/reservation.dart';
import 'package:restaurant_reservation_app/src/domain/entities/table.dart' as ent_table;
import 'package:restaurant_reservation_app/src/domain/entities/user.dart';
import 'package:restaurant_reservation_app/src/domain/repositories/reservation_repository.dart'; // Keep this import

class ReservationRepositoryImpl implements ReservationRepository {
  ReservationRepositoryImpl();

  @override
  Future<List<Reservation>> getReservations() async {
    final raw = await ReservationAppUserServiceAppUser.fetchReservations();
    return raw.map<Reservation>((item) {
      if (item is Reservation) return item;
      final map = item as Map<String, dynamic>;
      final userMap = map['user'] as Map<String, dynamic>?;
      final tableMap = map['table'] as Map<String, dynamic>?;

      return Reservation(
        id: map['id'].toString(),
        user: User(
          id: (userMap?['id'] ?? '').toString(),
          name: userMap?['full_name'] ?? userMap?['name'] ?? 'Unknown User',
          email: userMap?['email'] ?? '',
        ),
        table: ent_table.Table(
          id: (tableMap?['id'] ?? '').toString(),
          tableNumber: int.tryParse(tableMap?['table_number']?.toString() ?? '0') ?? 0,
          capacity: (tableMap?['capacity'] as int?) ?? 0,
          isOccupied: tableMap?['status'] != 'available',
          location: tableMap?['location'] as String?,
        ),
        dateTime: DateTime.parse(map['reservation_time'] ?? DateTime.now().toIso8601String()).toLocal(),
        numberOfGuests: (map['num_people'] as int?) ?? 1,
        status: map['status'] as String?,
        createdAt: DateTime.tryParse(map['createdAt'] ?? '')?.toLocal(),
      );
    }).toList();
  }

  @override
  Future<Reservation> createReservation(Reservation reservation) async {
    final raw = await ReservationAppUserServiceAppUser.createReservation({
      // Backend expects these top-level fields. user_id is added by the backend from the auth token.
      'table_id': reservation.table.id,
      'reservation_time': reservation.dateTime.toIso8601String(),
      'num_people': reservation.numberOfGuests,
    });

    var map = raw as Map<String, dynamic>;
    // unwrap common wrappers
    if (map.containsKey('data') && map['data'] is Map<String, dynamic>) {
      map = map['data'] as Map<String, dynamic>;
    }
    if (map.containsKey('reservation') && map['reservation'] is Map<String, dynamic>) {
      map = map['reservation'] as Map<String, dynamic>;
    }
    return Reservation(
      id: map['id'].toString(),
      user: User(
        id: (map['user']?['id'] ?? '').toString(),
        name: map['user']?['full_name'] ?? map['user']?['name'] ?? 'Unknown User',
        email: map['user']?['email'] ?? '',
      ),
      table: ent_table.Table(
        id: (map['table']?['id'] ?? '').toString(),
        tableNumber: int.tryParse(map['table']?['table_number']?.toString() ?? '0') ?? 0,
        capacity: (map['table']?['capacity'] as int?) ?? 0,
        isOccupied: map['table']?['status'] != 'available',
        location: map['table']?['location'] as String?,
      ),
      dateTime: DateTime.parse(map['dateTime'] ?? map['reservation_time'] ?? DateTime.now().toIso8601String()).toLocal(),
      numberOfGuests: (map['numberOfGuests'] as int?) ?? (map['num_people'] as int?) ?? (map['guests'] as int?) ?? 1,
      status: map['status'] as String?,
      createdAt: DateTime.tryParse(map['createdAt'] ?? '')?.toLocal(),
    );
  }
}
