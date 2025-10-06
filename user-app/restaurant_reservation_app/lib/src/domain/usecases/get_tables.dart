
import 'package:restaurant_reservation_app/src/domain/entities/table.dart';
import 'package:restaurant_reservation_app/src/domain/repositories/table_repository.dart';

class GetTables {
  final TableRepository repository;

  GetTables(this.repository);

  Future<List<Table>> call() {
    return repository.getTables();
  }
}
