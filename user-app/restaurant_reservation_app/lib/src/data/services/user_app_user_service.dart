import '../datasources/data_source_adapter.dart';

class UserAppUserService {
  static Future<dynamic> fetchUserProfile() async {
    return DataSourceAdapter.getUserProfile();
  }

  static Future<dynamic> updateUserProfile(dynamic payload) async {
    return DataSourceAdapter.updateUserProfile(payload);
  }
}