enum PaymentMethodType { cash, card, momo, banking, vnpay }
enum PaymentStatus { pending, processing, completed, failed }

class PaymentMethod {
  final String id;
  final PaymentMethodType type;
  final String name;
  final String description;
  final String iconPath; // Path to asset icon

  const PaymentMethod({
    required this.id,
    required this.type,
    required this.name,
    required this.description,
    required this.iconPath,
  });

  factory PaymentMethod.fromJson(Map<String, dynamic> json) => PaymentMethod(
        id: json['id'] as String,
        type: PaymentMethodType.values.firstWhere((e) => e.name == json['type']),
        name: json['name'] as String,
        description: json['description'] as String,
        iconPath: json['iconPath'] as String,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.name,
        'name': name,
        'description': description,
        'iconPath': iconPath,
      };
}

class Payment {
  final String id;
  final String orderId;
  final PaymentMethodType method;
  final double amount;
  final double serviceCharge;
  final double tax;
  final double totalAmount;
  final PaymentStatus status;
  final DateTime paymentDate;
  final String? transactionId;
  final String? notes;

  const Payment({
    required this.id,
    required this.orderId,
    required this.method,
    required this.amount,
    required this.serviceCharge,
    required this.tax,
    required this.totalAmount,
    required this.status,
    required this.paymentDate,
    this.transactionId,
    this.notes,
  });

  factory Payment.fromJson(Map<String, dynamic> json) => Payment(
        id: json['id'] as String,
        orderId: json['orderId'].toString(),
        method: PaymentMethodType.values.firstWhere((e) => e.name == json['method']),
        amount: (json['amount'] as num).toDouble(),
        serviceCharge: (json['serviceCharge'] as num).toDouble(),
        tax: (json['tax'] as num).toDouble(),
        totalAmount: (json['totalAmount'] as num).toDouble(),
        status: PaymentStatus.values.firstWhere((e) => e.name == json['status']),
        paymentDate: DateTime.parse(json['paymentDate'] as String),
        transactionId: json['transactionId'] as String?,
        notes: json['notes'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'orderId': orderId,
        'method': method.name,
        'amount': amount,
        'serviceCharge': serviceCharge,
        'tax': tax,
        'totalAmount': totalAmount,
        'status': status.name,
        'paymentDate': paymentDate.toIso8601String(),
        'transactionId': transactionId,
        'notes': notes,
      };
}
