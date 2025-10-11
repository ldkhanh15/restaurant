import '../services/review_app_user_service.dart';
import '../../domain/models/review.dart';

abstract class IReviewRepository {
  Future<List<Review>> getReviews();
  Future<Review> createReview(Map<String, dynamic> review);
}

class ReviewRepository implements IReviewRepository {
  @override
  Future<List<Review>> getReviews() async {
    final rawData = await ReviewAppUserService.fetchReviews();
    return rawData.map((r) => Review.fromJson(r as Map<String, dynamic>)).toList();
  }

  @override
  Future<Review> createReview(Map<String, dynamic> review) async {
    final rawData = await ReviewAppUserService.createReview(review);
    return Review.fromJson(rawData as Map<String, dynamic>);
  }
}