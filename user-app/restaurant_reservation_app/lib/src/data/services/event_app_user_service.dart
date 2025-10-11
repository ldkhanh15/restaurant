import '../datasources/data_source_adapter.dart';

class EventAppUserService {
  static Future<List<dynamic>> fetchEvents() async {
    return DataSourceAdapter.getEvents();
  }

  static Future<dynamic> fetchEventById(String id) async {
    return DataSourceAdapter.getEventById(id);
  }

  static Future<dynamic> createEventBooking(dynamic booking) async {
    return DataSourceAdapter.createEventBooking(booking);
  }
}