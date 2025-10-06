
import 'package:restaurant_reservation_app/src/domain/entities/reservation.dart';
import 'package:restaurant_reservation_app/src/domain/repositories/reservation_repository.dart';

class GetReservations {
  final ReservationRepository repository;

  GetReservations(this.repository);

  Future<List<Reservation>> call() {
    return repository.getReservations();
  }
}
