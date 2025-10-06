
import 'package:restaurant_reservation_app/src/data/datasources/data_source_adapter_app_user.dart';
import 'package:restaurant_reservation_app/src/data/datasources/api_config.dart';
import 'package:restaurant_reservation_app/src/domain/entities/reservation.dart';
import 'package:restaurant_reservation_app/src/domain/entities/table.dart' as ent_table;
import 'package:restaurant_reservation_app/src/domain/entities/user.dart';
import 'package:restaurant_reservation_app/src/domain/repositories/reservation_repository.dart';

class ReservationRepositoryImpl implements ReservationRepository {
  ReservationRepositoryImpl();

  @override
  Future<List<Reservation>> getReservations() async {
    final raw = await DataSourceAdapterAppUser.getReservations_app_user();
    return raw.map<Reservation>((item) {
      if (item is Reservation) return item;
      final map = item as Map<String, dynamic>;
      return Reservation(
        id: map['id'].toString(),
        user: User(
          id: (map['user']?['id'] ?? '').toString(),
          name: map['user']?['name'] ?? '',
          email: map['user']?['email'] ?? '',
        ),
        table: ent_table.Table(
          id: (map['table']?['id'] ?? '').toString(),
          tableNumber: (map['table']?['tableNumber'] as int?) ?? 0,
          capacity: (map['table']?['capacity'] as int?) ?? 0,
          isOccupied: map['table']?['isOccupied'] ?? false,
        ),
        dateTime: DateTime.parse(map['dateTime'] ?? DateTime.now().toIso8601String()),
        numberOfGuests: (map['numberOfGuests'] as int?) ?? (map['guests'] as int?) ?? 1,
      );
    }).toList();
  }

  @override
  Future<Reservation> createReservation(Reservation reservation) async {
    final raw = await DataSourceAdapterAppUser.createReservation_app_user({
      // top-level linkage fields expected by backend
  'user_id': ApiConfig.currentUserId.isNotEmpty ? ApiConfig.currentUserId : reservation.user.id.toString(),
  'table_id': reservation.table.id.toString(),
      'user': {
        'id': reservation.user.id,
        'name': reservation.user.name,
        'email': reservation.user.email,
      },
      'table': {
        'id': reservation.table.id,
        'tableNumber': reservation.table.tableNumber,
        'capacity': reservation.table.capacity,
      },
      'dateTime': reservation.dateTime.toIso8601String(),
      'numberOfGuests': reservation.numberOfGuests,
      // backend model expects reservation_time and num_people
      'reservation_time': reservation.dateTime.toIso8601String(),
      'num_people': reservation.numberOfGuests,
      // ask backend to persist as confirmed for app-user bookings
      'status': 'confirmed',
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
        name: map['user']?['name'] ?? '',
        email: map['user']?['email'] ?? '',
      ),
      table: ent_table.Table(
        id: (map['table']?['id'] ?? '').toString(),
        tableNumber: (map['table']?['tableNumber'] as int?) ?? 0,
        capacity: (map['table']?['capacity'] as int?) ?? 0,
        isOccupied: map['table']?['isOccupied'] ?? false,
      ),
      dateTime: DateTime.parse(map['dateTime'] ?? map['reservation_time'] ?? DateTime.now().toIso8601String()),
      numberOfGuests: (map['numberOfGuests'] as int?) ?? (map['num_people'] as int?) ?? (map['guests'] as int?) ?? 1,
    );
  }
}
