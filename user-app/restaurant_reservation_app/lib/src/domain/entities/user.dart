
class User {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String? avatar;
  final String? fullName;
  final String? ranking;
  final int? points;

  User({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.avatar,
    this.fullName,
    this.ranking,
    this.points,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id']?.toString() ?? '',
        name: (json['username'] ?? json['name'] ?? '') as String,
        email: (json['email'] ?? '') as String,
        phone: (json['phone'] ?? json['phone_number']) as String?,
        avatar: (json['avatar'] ?? json['avatar_url']) as String?,
        fullName: (json['full_name'] ?? json['fullName']) as String?,
        ranking: (json['ranking'] ?? json['membershipTier']) as String?,
        points: (json['points'] is int) ? json['points'] as int : (int.tryParse((json['points'] ?? '').toString()) ?? null),
      );
}
