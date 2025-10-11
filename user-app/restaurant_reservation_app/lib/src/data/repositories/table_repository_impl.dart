
import 'package:restaurant_reservation_app/src/data/datasources/data_source_adapter.dart';
import 'package:restaurant_reservation_app/src/domain/entities/table.dart';
import 'package:restaurant_reservation_app/src/domain/repositories/table_repository.dart';

class TableRepositoryImpl implements TableRepository {
  TableRepositoryImpl();

  @override
  Future<List<Table>> getTables() async {
    final raw = await DataSourceAdapter.getTables();
    return raw.map<Table>((item) {
      if (item is Table) return item;
      final map = item as Map<String, dynamic>;
      return Table(
        id: map['id']?.toString() ?? '',
        // The backend might send 'name' or 'table_number'. Handle both.
        tableNumber: (map['table_number'] as int?) ?? int.tryParse(map['name']?.toString() ?? '0') ?? 0,
        capacity: (map['capacity'] as int?) ?? int.tryParse(map['capacity']?.toString() ?? '0') ?? 0,
        // Determine occupancy based on the 'status' field from the backend.
        isOccupied: map['status'] != 'available',
        location: map['location'] as String?,
      );
    }).toList();
  }
}
