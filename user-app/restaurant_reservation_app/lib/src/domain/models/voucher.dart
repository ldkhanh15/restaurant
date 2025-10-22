enum VoucherType { discount, freebie, upgrade }

enum VoucherStatus { active, used, expired, cancelled }

class Voucher {
  final String id;
  final String code;
  final String name;
  final String description;
  final VoucherType type;
  final VoucherStatus status;
  final double? discountPercentage; // For discount vouchers
  final double? discountAmount; // Fixed amount discount
  final double? minimumOrderAmount; // Minimum order to use voucher
  final DateTime createdAt;
  final DateTime validFrom;
  final DateTime validUntil;
  final DateTime? usedAt;
  final String? orderId; // Order where voucher was used
  final String iconPath;
  final String colorHex;

  const Voucher({
    required this.id,
    required this.code,
    required this.name,
    required this.description,
    required this.type,
    required this.status,
    this.discountPercentage,
    this.discountAmount,
    this.minimumOrderAmount,
    required this.createdAt,
    required this.validFrom,
    required this.validUntil,
    this.usedAt,
    this.orderId,
    required this.iconPath,
    required this.colorHex,
  });

  factory Voucher.fromJson(Map<String, dynamic> json) {
    return Voucher(
      id: json['id'] as String,
      code: json['code'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      type: VoucherType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => VoucherType.discount,
      ),
      status: VoucherStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => VoucherStatus.active,
      ),
      discountPercentage: json['discountPercentage'] as double?,
      discountAmount: json['discountAmount'] as double?,
      minimumOrderAmount: json['minimumOrderAmount'] as double?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      validFrom: DateTime.parse(json['validFrom'] as String),
      validUntil: DateTime.parse(json['validUntil'] as String),
      usedAt: json['usedAt'] != null 
          ? DateTime.parse(json['usedAt'] as String)
          : null,
      orderId: json['orderId'] as String?,
      iconPath: json['iconPath'] as String,
      colorHex: json['colorHex'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'code': code,
      'name': name,
      'description': description,
      'type': type.name,
      'status': status.name,
      'discountPercentage': discountPercentage,
      'discountAmount': discountAmount,
      'minimumOrderAmount': minimumOrderAmount,
      'createdAt': createdAt.toIso8601String(),
      'validFrom': validFrom.toIso8601String(),
      'validUntil': validUntil.toIso8601String(),
      'usedAt': usedAt?.toIso8601String(),
      'orderId': orderId,
      'iconPath': iconPath,
      'colorHex': colorHex,
    };
  }

  Voucher copyWith({
    String? id,
    String? code,
    String? name,
    String? description,
    VoucherType? type,
    VoucherStatus? status,
    double? discountPercentage,
    double? discountAmount,
    double? minimumOrderAmount,
    DateTime? createdAt,
    DateTime? validFrom,
    DateTime? validUntil,
    DateTime? usedAt,
    String? orderId,
    String? iconPath,
    String? colorHex,
  }) {
    return Voucher(
      id: id ?? this.id,
      code: code ?? this.code,
      name: name ?? this.name,
      description: description ?? this.description,
      type: type ?? this.type,
      status: status ?? this.status,
      discountPercentage: discountPercentage ?? this.discountPercentage,
      discountAmount: discountAmount ?? this.discountAmount,
      minimumOrderAmount: minimumOrderAmount ?? this.minimumOrderAmount,
      createdAt: createdAt ?? this.createdAt,
      validFrom: validFrom ?? this.validFrom,
      validUntil: validUntil ?? this.validUntil,
      usedAt: usedAt ?? this.usedAt,
      orderId: orderId ?? this.orderId,
      iconPath: iconPath ?? this.iconPath,
      colorHex: colorHex ?? this.colorHex,
    );
  }

  bool get isValid {
    final now = DateTime.now();
    return status == VoucherStatus.active &&
           now.isAfter(validFrom) &&
           now.isBefore(validUntil);
  }

  bool get isExpired {
    return DateTime.now().isAfter(validUntil);
  }

  String get displayValidUntil {
    return "${validUntil.day.toString().padLeft(2, '0')}/${validUntil.month.toString().padLeft(2, '0')}/${validUntil.year}";
  }
}

/// Represents the state for the voucher screen, including all categories of vouchers
/// and the loading/error status.
class VoucherState {
  final List<Voucher> activeVouchers;
  final List<Voucher> usedVouchers;
  final List<Voucher> expiredVouchers;

  const VoucherState({
    this.activeVouchers = const [],
    this.usedVouchers = const [],
    this.expiredVouchers = const [],
  });

  VoucherState copyWith({
    List<Voucher>? activeVouchers,
    List<Voucher>? usedVouchers,
    List<Voucher>? expiredVouchers,
  }) {
    return VoucherState(
      activeVouchers: activeVouchers ?? this.activeVouchers,
      usedVouchers: usedVouchers ?? this.usedVouchers,
      expiredVouchers: expiredVouchers ?? this.expiredVouchers,
    );
  }
}
