import '../datasources/data_source_adapter.dart';

class ReviewAppUserService {
  static Future<List<dynamic>> fetchReviews() async {
    return DataSourceAdapter.getReviews();
  }

  static Future<dynamic> createReview(dynamic review) async {
    return DataSourceAdapter.createReview(review);
  }
}