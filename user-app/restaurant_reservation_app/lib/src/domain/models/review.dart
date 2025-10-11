class ReviewUser {
  final String id;
  final String name;
  final String? avatar;

  const ReviewUser({required this.id, required this.name, this.avatar});

  factory ReviewUser.fromJson(Map<String, dynamic> json) {
    return ReviewUser(
      id: (json['id'] ?? json['user_id'] ?? json['customerId'] ?? '') as String,
      name: (json['name'] ?? json['customerName'] ?? '') as String,
      avatar: (json['avatar'] ?? json['customerAvatar']) as String?,
    );
  }
}

enum ReviewType { review, complaint }

enum ReviewStatus { pending, approved, rejected }

class Review {
  final String id;

  // Legacy / backend fields
  final String? userId;
  final String? orderId;
  final String? dishId;

  // Mock/front-end friendly fields
  final String? customerId;
  final String? customerName;
  final String? customerAvatar;

  final int rating;

  // comment is canonical internal name; content (in mocks) maps to comment
  final String? comment;
  final DateTime? createdAt;
  final ReviewUser? user;

  final ReviewType? type;
  final ReviewStatus? status;

  final int helpfulCount;
  final String? restaurantResponse;
  final DateTime? responseDate;

  const Review({
    required this.id,
    this.userId,
    this.orderId,
    this.dishId,
    this.customerId,
    this.customerName,
    this.customerAvatar,
    required this.rating,
    String? comment,
    String? content,
    this.createdAt,
    this.user,
    this.type,
    this.status,
    this.helpfulCount = 0,
    this.restaurantResponse,
    this.responseDate,
  }) : comment = comment ?? content;

  factory Review.fromJson(Map<String, dynamic> json) {
    // Accept multiple shapes (backend snake_case or front-end mock camelCase)
    String id = (json['id'] ?? json['reviewId'] ?? '') as String;

    String? userId = (json['user_id'] ?? json['userId'] ?? json['customerId']) as String?;
    String? orderId = (json['order_id'] ?? json['orderId']) as String?;
    String? dishId = (json['dish_id'] ?? json['dishId']) as String?;

    int rating = (json['rating'] is int)
        ? json['rating'] as int
        : int.tryParse((json['rating'] ?? '0').toString()) ?? 0;

    String? comment = (json['comment'] ?? json['content']) as String?;

    DateTime? createdAt;
    final createdRaw = json['created_at'] ?? json['createdAt'];
    if (createdRaw != null) {
      try {
        createdAt = DateTime.parse(createdRaw as String);
      } catch (_) {
        createdAt = null;
      }
    }

    ReviewUser? user;
    if (json['user'] != null && json['user'] is Map<String, dynamic>) {
      user = ReviewUser.fromJson(json['user'] as Map<String, dynamic>);
    } else if (json['customerName'] != null) {
      user = ReviewUser(
        id: (json['customerId'] ?? '') as String,
        name: (json['customerName'] ?? '') as String,
        avatar: (json['customerAvatar']) as String?,
      );
    }

    ReviewType? type;
    if (json['type'] != null) {
      final t = json['type'].toString().toLowerCase();
      if (t == 'review') type = ReviewType.review;
      if (t == 'complaint') type = ReviewType.complaint;
    }

    ReviewStatus? status;
    if (json['status'] != null) {
      final s = json['status'].toString().toLowerCase();
      if (s == 'pending') status = ReviewStatus.pending;
      if (s == 'approved') status = ReviewStatus.approved;
      if (s == 'rejected') status = ReviewStatus.rejected;
    }

    int helpfulCount = 0;
    if (json['helpfulCount'] != null) {
      helpfulCount = (json['helpfulCount'] is int)
          ? json['helpfulCount'] as int
          : int.tryParse(json['helpfulCount'].toString()) ?? 0;
    } else if (json['helpful_count'] != null) {
      helpfulCount = (json['helpful_count'] is int)
          ? json['helpful_count'] as int
          : int.tryParse(json['helpful_count'].toString()) ?? 0;
    }

    String? restaurantResponse = (json['restaurantResponse'] ?? json['restaurant_response']) as String?;

    DateTime? responseDate;
    final respRaw = json['responseDate'] ?? json['response_date'];
    if (respRaw != null) {
      try {
        responseDate = DateTime.parse(respRaw as String);
      } catch (_) {
        responseDate = null;
      }
    }

    return Review(
      id: id,
      userId: userId,
      orderId: orderId,
      dishId: dishId,
      customerId: (json['customerId'] ?? json['customer_id']) as String?,
      customerName: (json['customerName'] ?? json['customer_name']) as String?,
      customerAvatar: (json['customerAvatar'] ?? json['customer_avatar']) as String?,
      rating: rating,
      comment: comment,
      createdAt: createdAt,
      user: user,
      type: type,
      status: status,
      helpfulCount: helpfulCount,
      restaurantResponse: restaurantResponse,
      responseDate: responseDate,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'order_id': orderId,
      'dish_id': dishId,
      'rating': rating,
      'comment': comment,
      'created_at': createdAt?.toIso8601String(),
      'type': type != null ? type.toString().split('.').last : null,
      'status': status != null ? status.toString().split('.').last : null,
      'helpfulCount': helpfulCount,
      'restaurantResponse': restaurantResponse,
      'responseDate': responseDate?.toIso8601String(),
    };
  }

  Review copyWith({
    String? id,
    String? userId,
    String? orderId,
    String? dishId,
    String? customerId,
    String? customerName,
    String? customerAvatar,
    int? rating,
    String? comment,
    DateTime? createdAt,
    ReviewUser? user,
    ReviewType? type,
    ReviewStatus? status,
    int? helpfulCount,
    String? restaurantResponse,
    DateTime? responseDate,
  }) {
    return Review(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      orderId: orderId ?? this.orderId,
      dishId: dishId ?? this.dishId,
      customerId: customerId ?? this.customerId,
      customerName: customerName ?? this.customerName,
      customerAvatar: customerAvatar ?? this.customerAvatar,
      rating: rating ?? this.rating,
      comment: comment ?? this.comment,
      createdAt: createdAt ?? this.createdAt,
      user: user ?? this.user,
      type: type ?? this.type,
      status: status ?? this.status,
      helpfulCount: helpfulCount ?? this.helpfulCount,
      restaurantResponse: restaurantResponse ?? this.restaurantResponse,
      responseDate: responseDate ?? this.responseDate,
    );
  }
}
