
import 'package:restaurant_reservation_app/src/domain/entities/reservation.dart';

abstract class ReservationRepository {
  Future<List<Reservation>> getReservations();
  Future<Reservation> createReservation(Reservation reservation);
}
