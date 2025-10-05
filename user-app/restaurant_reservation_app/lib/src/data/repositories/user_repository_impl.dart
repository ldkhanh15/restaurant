
import 'package:restaurant_reservation_app/src/data/datasources/local/mock_data_source.dart';
import 'package:restaurant_reservation_app/src/domain/entities/user.dart';
import 'package:restaurant_reservation_app/src/domain/repositories/user_repository.dart';

class UserRepositoryImpl implements UserRepository {
  final MockDataSource dataSource;

  UserRepositoryImpl({required this.dataSource});

  @override
  Future<List<User>> getUsers() {
    return dataSource.getUsers();
  }
}
