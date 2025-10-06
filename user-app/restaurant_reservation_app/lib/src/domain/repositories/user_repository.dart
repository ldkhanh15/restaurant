
import 'package:restaurant_reservation_app/src/domain/entities/user.dart';

abstract class UserRepository {
  Future<List<User>> getUsers();
}
