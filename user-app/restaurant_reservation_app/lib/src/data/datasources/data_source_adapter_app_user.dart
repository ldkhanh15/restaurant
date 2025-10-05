import 'remote/remote_app_user_data_source.dart';
import 'api_config.dart';

class DataSourceAdapterAppUser {
  static RemoteAppUserDataSource? _remote;

  static RemoteAppUserDataSource get _ensureRemote {
    _remote ??= RemoteAppUserDataSource(ApiConfig.baseUrl);
    return _remote!;
  }

  static Future<List<dynamic>> getMenuItems_app_user() async {
    return _ensureRemote.getMenuItems_app_user();
  }

  static Future<List<dynamic>> getTables_app_user() async {
    return _ensureRemote.getTables_app_user();
  }

  static Future<List<dynamic>> getReservations_app_user() async {
    return _ensureRemote.getReservations_app_user();
  }

  static Future<dynamic> createReservation_app_user(dynamic reservation) async {
    return _ensureRemote.createReservation_app_user(reservation);
  }

  static Future<dynamic> updateReservation_app_user(String id, dynamic payload) async {
    return _ensureRemote.updateReservation_app_user(id, payload);
  }

  static Future<bool> deleteReservation_app_user(String id) async {
    return _ensureRemote.deleteReservation_app_user(id);
  }
}
