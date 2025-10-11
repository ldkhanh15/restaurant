import '../datasources/data_source_adapter.dart';

class TableAppUserServiceAppUser {
  static Future<List<dynamic>> fetchTables() async {
    return DataSourceAdapter.getTables();
  }

  static Future<List<dynamic>> fetchAvailableTables() async {
    // This method is specific to remote data source and not in the generic adapter.
    // If needed for mock, it should be added to the adapter.
    // For now, we assume it's only used when online.
    return DataSourceAdapter.getTables(); // Fallback to get all tables
  }

  static Future<Map<String, dynamic>> updateTableStatus(String id, String status) async {
    return DataSourceAdapter.updateTableStatus(id, status) as Future<Map<String, dynamic>>;
  }
}
