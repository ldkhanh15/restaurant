
import 'package:restaurant_reservation_app/src/domain/entities/table.dart';

abstract class TableRepository {
  Future<List<Table>> getTables();
}
