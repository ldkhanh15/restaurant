import '../datasources/data_source_adapter.dart';

class ReservationAppUserServiceAppUser {
  static Future<List<dynamic>> fetchReservations() async {
    return DataSourceAdapter.getReservations();
  }

  static Future<Map<String, dynamic>> fetchReservationById(String id) async {
    final res = await DataSourceAdapter.getReservationById(id);
    if (res == null) throw Exception('Reservation not found');
    if (res is Map<String, dynamic>) return res;
    // try to cast dynamic object to map if possible
    try {
      return Map<String, dynamic>.from(res as Map);
    } catch (e) {
      return {'id': id};
    }
  }

  static Future<dynamic> createReservation(dynamic payload) async {
    return DataSourceAdapter.createReservation(payload);
  }

  static Future<dynamic> updateReservation(String id, dynamic payload) async {
    return DataSourceAdapter.updateReservation(id, payload);
  }

  static Future<Map<String, dynamic>> cancelReservation(String id) async {
    return DataSourceAdapter.cancelReservation(id) as Future<Map<String, dynamic>>;
  }

  static Future<Map<String, dynamic>> confirmReservation(String id) async {
    return DataSourceAdapter.confirmReservation(id) as Future<Map<String, dynamic>>;
  }
}
