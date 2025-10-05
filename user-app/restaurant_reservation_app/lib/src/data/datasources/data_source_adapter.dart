import 'local/mock_data_source.dart';
import 'remote/remote_data_source.dart';
import 'api_config.dart';

/// Adapter that switches between remote and mock datasource depending on ApiConfig.baseUrl
class DataSourceAdapter {
  static final MockDataSource _mock = MockDataSource();
  static RemoteDataSource? _remote;

  static RemoteDataSource get _ensureRemote {
    _remote ??= RemoteDataSource(ApiConfig.baseUrl);
    return _remote!;
  }

  static Future<List<dynamic>> getMenuItems() async {
    if (ApiConfig.baseUrl.isEmpty) return _mock.getMenuItems();
    return _ensureRemote.getMenuItems();
  }

  static Future<List<dynamic>> getTables() async {
    if (ApiConfig.baseUrl.isEmpty) return _mock.getTables();
    return _ensureRemote.getTables();
  }

  static Future<List<dynamic>> getReservations() async {
    if (ApiConfig.baseUrl.isEmpty) return _mock.getReservations();
    return _ensureRemote.getReservations();
  }

  static Future<dynamic> createReservation(dynamic reservation) async {
    if (ApiConfig.baseUrl.isEmpty) return _mock.createReservation(reservation);
    return _ensureRemote.createReservation(reservation);
  }
}
