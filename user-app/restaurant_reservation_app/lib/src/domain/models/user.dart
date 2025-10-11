class AppUser {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String? address;
  final String? avatar;
  final DateTime? birthDate;
  final DateTime? joinDate;
  final String? role;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final int loyaltyPoints;
  final int totalOrders;
  final String? favoriteTable;
  final String membershipTier;

  const AppUser({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.address,
    this.avatar,
    this.birthDate,
    this.joinDate,
    this.role,
    this.createdAt,
    this.updatedAt,
    this.loyaltyPoints = 0,
    this.totalOrders = 0,
    this.favoriteTable,
    this.membershipTier = 'Regular',
  });

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: (json['id'] ?? '').toString(),
        name: (json['name'] ?? json['full_name'] ?? '') as String,
        email: (json['email'] ?? '') as String,
        phone: (json['phone'] ?? json['phone_number']) as String?,
        address: json['address'] as String?,
        avatar: (json['avatar'] ?? json['avatar_url']) as String?,
        birthDate: json['birthDate'] != null
            ? DateTime.tryParse(json['birthDate'] as String)
            : null,
        joinDate: json['joinDate'] != null
            ? DateTime.tryParse(json['joinDate'] as String)
            : null,
        role: json['role'] as String?,
        createdAt: json['created_at'] != null
            ? DateTime.tryParse(json['created_at'] as String)
            : (json['createdAt'] != null
                ? DateTime.tryParse(json['createdAt'] as String)
                : null),
        updatedAt: json['updated_at'] != null
            ? DateTime.tryParse(json['updated_at'] as String)
            : null,
        loyaltyPoints: (json['loyalty_points'] ?? json['loyaltyPoints'] as int?) ?? 0,
        totalOrders: (json['total_orders'] ?? json['totalOrders'] as int?) ?? 0,
        favoriteTable: (json['favorite_table'] ?? json['favoriteTable']) as String?,
        membershipTier:
            (json['membership_tier'] ?? json['membershipTier']) as String? ?? 'Regular',
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'phone': phone,
        'address': address,
        'avatar': avatar,
        'birthDate': birthDate?.toIso8601String(),
        'join_date': joinDate?.toIso8601String(),
        'role': role,
        'created_at': createdAt?.toIso8601String(),
        'updated_at': updatedAt?.toIso8601String(),
        'loyalty_points': loyaltyPoints,
        'total_orders': totalOrders,
        'favorite_table': favoriteTable,
        'membership_tier': membershipTier,
      };

  AppUser copyWith({
    String? id,
    String? name,
    String? email,
    String? phone,
    String? address,
    String? avatar,
    DateTime? birthDate,
    DateTime? joinDate,
    String? role,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? loyaltyPoints,
    int? totalOrders,
    String? favoriteTable,
    String? membershipTier,
  }) {
    return AppUser(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      avatar: avatar ?? this.avatar,
      birthDate: birthDate ?? this.birthDate,
      joinDate: joinDate ?? this.joinDate,
      role: role ?? this.role,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      loyaltyPoints: loyaltyPoints ?? this.loyaltyPoints,
      totalOrders: totalOrders ?? this.totalOrders,
      favoriteTable: favoriteTable ?? this.favoriteTable,
      membershipTier: membershipTier ?? this.membershipTier,
    );
  }
}