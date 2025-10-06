
import 'package:restaurant_reservation_app/src/domain/entities/user.dart';
import 'package:restaurant_reservation_app/src/domain/repositories/user_repository.dart';

class GetUsers {
  final UserRepository repository;

  GetUsers(this.repository);

  Future<List<User>> call() {
    return repository.getUsers();
  }
}
