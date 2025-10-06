
import 'package:restaurant_reservation_app/src/data/datasources/data_source_adapter_app_user.dart';
import 'package:restaurant_reservation_app/src/domain/entities/table.dart';
import 'package:restaurant_reservation_app/src/domain/repositories/table_repository.dart';

class TableRepositoryImpl implements TableRepository {
  TableRepositoryImpl();

  @override
  Future<List<Table>> getTables() async {
    final raw = await DataSourceAdapterAppUser.getTables_app_user();
    return raw.map<Table>((item) {
      if (item is Table) return item;
      final map = item as Map<String, dynamic>;
      return Table(
        id: map['id'].toString(),
        tableNumber: (map['tableNumber'] as int?) ?? (map['id'] as int?) ?? 0,
        capacity: (map['capacity'] as int?) ?? 0,
        isOccupied: map['isOccupied'] ?? false,
      );
    }).toList();
  }
}
