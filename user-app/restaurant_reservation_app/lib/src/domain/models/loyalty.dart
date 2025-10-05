enum PointTransactionType { earn, redeem }
enum RewardCategory { discount, freebie, upgrade }

class PointHistory {
  final String id;
  final PointTransactionType type;
  final int points;
  final String description;
  final DateTime date;

  const PointHistory({
    required this.id,
    required this.type,
    required this.points,
    required this.description,
    required this.date,
  });

  factory PointHistory.fromJson(Map<String, dynamic> json) => PointHistory(
        id: json['id'] as String,
        type: PointTransactionType.values.firstWhere((e) => e.name == json['type']),
        points: json['points'] as int,
        description: json['description'] as String,
        date: DateTime.parse(json['date'] as String),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.name,
        'points': points,
        'description': description,
        'date': date.toIso8601String(),
      };
}

class MembershipTier {
  final String name;
  final int pointsRequired;
  final List<String> benefits;
  final String iconPath; // Path to asset icon
  final String colorHex; // Hex color string

  const MembershipTier({
    required this.name,
    required this.pointsRequired,
    required this.benefits,
    required this.iconPath,
    required this.colorHex,
  });

  factory MembershipTier.fromJson(Map<String, dynamic> json) => MembershipTier(
        name: json['name'] as String,
        pointsRequired: json['pointsRequired'] as int,
        benefits: (json['benefits'] as List<dynamic>).map((e) => e as String).toList(),
        iconPath: json['iconPath'] as String,
        colorHex: json['colorHex'] as String,
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'pointsRequired': pointsRequired,
        'benefits': benefits,
        'iconPath': iconPath,
        'colorHex': colorHex,
      };
}

class Reward {
  final String id;
  final String name;
  final String description;
  final int pointsRequired;
  final RewardCategory category;
  final bool available;
  final DateTime validUntil;

  const Reward({
    required this.id,
    required this.name,
    required this.description,
    required this.pointsRequired,
    required this.category,
    required this.available,
    required this.validUntil,
  });

  factory Reward.fromJson(Map<String, dynamic> json) => Reward(
        id: json['id'] as String,
        name: json['name'] as String,
        description: json['description'] as String,
        pointsRequired: json['pointsRequired'] as int,
        category: RewardCategory.values.firstWhere((e) => e.name == json['category']),
        available: json['available'] as bool,
        validUntil: DateTime.parse(json['validUntil'] as String),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'description': description,
        'pointsRequired': pointsRequired,
        'category': category.name,
        'available': available,
        'validUntil': validUntil.toIso8601String(),
      };

  Reward copyWith({
    String? id,
    String? name,
    String? description,
    int? pointsRequired,
    RewardCategory? category,
    bool? available,
    DateTime? validUntil,
  }) {
    return Reward(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      pointsRequired: pointsRequired ?? this.pointsRequired,
      category: category ?? this.category,
      available: available ?? this.available,
      validUntil: validUntil ?? this.validUntil,
    );
  }
}

class PointTransaction {
  final String id;
  final String type; // 'earn' or 'redeem'
  final int points;
  final String description;
  final DateTime date;

  const PointTransaction({
    required this.id,
    required this.type,
    required this.points,
    required this.description,
    required this.date,
  });

  factory PointTransaction.fromJson(Map<String, dynamic> json) => PointTransaction(
        id: json['id'] as String,
        type: json['type'] as String,
        points: json['points'] as int,
        description: json['description'] as String,
        date: DateTime.parse(json['date'] as String),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type,
        'points': points,
        'description': description,
        'date': date.toIso8601String(),
      };

  PointTransaction copyWith({
    String? id,
    String? type,
    int? points,
    String? description,
    DateTime? date,
  }) {
    return PointTransaction(
      id: id ?? this.id,
      type: type ?? this.type,
      points: points ?? this.points,
      description: description ?? this.description,
      date: date ?? this.date,
    );
  }
}
