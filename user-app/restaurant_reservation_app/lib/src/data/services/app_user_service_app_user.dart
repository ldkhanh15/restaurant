import '../datasources/data_source_adapter_app_user.dart';

class AppUserServiceAppUser {
  static Future<List<dynamic>> fetchMenuItems() async {
    return DataSourceAdapterAppUser.getMenuItems_app_user();
  }

  static Future<List<dynamic>> fetchTables() async {
    return DataSourceAdapterAppUser.getTables_app_user();
  }

  static Future<List<dynamic>> fetchReservations() async {
    return DataSourceAdapterAppUser.getReservations_app_user();
  }

  static Future<dynamic> createReservation(dynamic payload) async {
    return DataSourceAdapterAppUser.createReservation_app_user(payload);
  }
}
