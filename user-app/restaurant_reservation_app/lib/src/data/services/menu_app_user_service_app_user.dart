import '../datasources/data_source_adapter.dart';

// This class will now use the consolidated RemoteAppUserDataSource
class MenuAppUserServiceAppUser {
  static Future<List<dynamic>> fetchMenuItems() async {
    return DataSourceAdapter.getMenuItems();
  }
}