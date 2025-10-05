enum ReviewType { review, complaint }

enum ReviewStatus { pending, approved, rejected }

class Review {
  final String id;
  final String customerId;
  final String customerName;
  final String? customerAvatar;
  final int rating; // 1-5 stars
  final String content;
  final ReviewType type;
  final ReviewStatus status;
  final DateTime createdAt;
  final int helpfulCount;
  final String? restaurantResponse;
  final DateTime? responseDate;
  final String? orderId; // Optional: link to specific order
  final List<String> images; // Optional: review images

  const Review({
    required this.id,
    required this.customerId,
    required this.customerName,
    this.customerAvatar,
    required this.rating,
    required this.content,
    required this.type,
    required this.status,
    required this.createdAt,
    this.helpfulCount = 0,
    this.restaurantResponse,
    this.responseDate,
    this.orderId,
    this.images = const [],
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['id'] as String,
      customerId: json['customerId'] as String,
      customerName: json['customerName'] as String,
      customerAvatar: json['customerAvatar'] as String?,
      rating: json['rating'] as int,
      content: json['content'] as String,
      type: ReviewType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => ReviewType.review,
      ),
      status: ReviewStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => ReviewStatus.pending,
      ),
      createdAt: DateTime.parse(json['createdAt'] as String),
      helpfulCount: json['helpfulCount'] as int? ?? 0,
      restaurantResponse: json['restaurantResponse'] as String?,
      responseDate: json['responseDate'] != null 
          ? DateTime.parse(json['responseDate'] as String)
          : null,
      orderId: json['orderId'] as String?,
      images: (json['images'] as List<dynamic>?)?.cast<String>() ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'customerId': customerId,
      'customerName': customerName,
      'customerAvatar': customerAvatar,
      'rating': rating,
      'content': content,
      'type': type.name,
      'status': status.name,
      'createdAt': createdAt.toIso8601String(),
      'helpfulCount': helpfulCount,
      'restaurantResponse': restaurantResponse,
      'responseDate': responseDate?.toIso8601String(),
      'orderId': orderId,
      'images': images,
    };
  }

  Review copyWith({
    String? id,
    String? customerId,
    String? customerName,
    String? customerAvatar,
    int? rating,
    String? content,
    ReviewType? type,
    ReviewStatus? status,
    DateTime? createdAt,
    int? helpfulCount,
    String? restaurantResponse,
    DateTime? responseDate,
    String? orderId,
    List<String>? images,
  }) {
    return Review(
      id: id ?? this.id,
      customerId: customerId ?? this.customerId,
      customerName: customerName ?? this.customerName,
      customerAvatar: customerAvatar ?? this.customerAvatar,
      rating: rating ?? this.rating,
      content: content ?? this.content,
      type: type ?? this.type,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      helpfulCount: helpfulCount ?? this.helpfulCount,
      restaurantResponse: restaurantResponse ?? this.restaurantResponse,
      responseDate: responseDate ?? this.responseDate,
      orderId: orderId ?? this.orderId,
      images: images ?? this.images,
    );
  }
}
