class AppUser {
  final int id;
  final String name;
  final String email;
  final String? phone;
  final String? address;
  final String? avatar;
  final DateTime? birthDate;
  final DateTime? joinDate;
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
    this.loyaltyPoints = 0,
    this.totalOrders = 0,
    this.favoriteTable,
    this.membershipTier = 'Regular',
  });

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: json['id'] as int,
        name: json['name'] as String,
        email: json['email'] as String,
        phone: json['phone'] as String?,
        address: json['address'] as String?,
        avatar: json['avatar'] as String?,
        birthDate: json['birthDate'] != null 
            ? DateTime.parse(json['birthDate'] as String) 
            : null,
        joinDate: json['joinDate'] != null 
            ? DateTime.parse(json['joinDate'] as String) 
            : null,
        loyaltyPoints: (json['loyaltyPoints'] as int?) ?? 0,
        totalOrders: (json['totalOrders'] as int?) ?? 0,
        favoriteTable: json['favoriteTable'] as String?,
        membershipTier: json['membershipTier'] as String? ?? 'Regular',
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'phone': phone,
        'address': address,
        'avatar': avatar,
        'birthDate': birthDate?.toIso8601String(),
        'joinDate': joinDate?.toIso8601String(),
        'loyaltyPoints': loyaltyPoints,
        'totalOrders': totalOrders,
        'favoriteTable': favoriteTable,
        'membershipTier': membershipTier,
      };

  AppUser copyWith({
    int? id,
    String? name,
    String? email,
    String? phone,
    String? address,
    String? avatar,
    DateTime? birthDate,
    DateTime? joinDate,
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
      loyaltyPoints: loyaltyPoints ?? this.loyaltyPoints,
      totalOrders: totalOrders ?? this.totalOrders,
      favoriteTable: favoriteTable ?? this.favoriteTable,
      membershipTier: membershipTier ?? this.membershipTier,
    );
  }
}


