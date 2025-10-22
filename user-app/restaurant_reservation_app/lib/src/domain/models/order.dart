import 'payment.dart';
import 'dart:convert';

enum KitchenStatus { pending, preparing, ready, served }

class OrderItem {
  final String id;
  final String name;
  final double price;
  final int quantity;
  final List<String> customizations;
  final String? specialNote;
  final KitchenStatus kitchenStatus;
  final int estimatedTime;
  final int? actualTime;
  final String image;

  const OrderItem({
    required this.id,
    required this.name,
    required this.price,
    required this.quantity,
    required this.customizations,
    this.specialNote,
    this.kitchenStatus = KitchenStatus.pending,
    required this.estimatedTime,
    this.actualTime,
    required this.image,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) => OrderItem(
        id: json['id'].toString(),
        name: json['name'] as String,
        price: (json['price'] as num).toDouble(),
        quantity: json['quantity'] as int,
        customizations: (() {
          final raw = json['customizations'];
          if (raw == null) return <String>[];
          try {
            if (raw is List<dynamic>) return raw.map((e) => e.toString()).toList();
            if (raw is String) {
              try {
                final decoded = jsonDecode(raw);
                if (decoded is List<dynamic>) return decoded.map((e) => e.toString()).toList();
                if (decoded is String) return decoded.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
              } catch (_) {
                return raw.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
              }
            }
            if (raw is Map && raw['data'] is List<dynamic>) return (raw['data'] as List<dynamic>).map((e) => e.toString()).toList();
          } catch (_) {}
          return <String>[];
        })(),
        specialNote: json['specialNote'] as String?,
        kitchenStatus: KitchenStatus.values.firstWhere(
            (e) => e.name == (json['kitchenStatus'] ?? json['kitchen_status']),
            orElse: () => KitchenStatus.pending),
        estimatedTime: json['estimatedTime'] as int,
        actualTime: json['actualTime'] as int?,
        image: json['image'] as String,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'price': price,
        'quantity': quantity,
        'customizations': customizations,
        'specialNote': specialNote,
        'kitchenStatus': kitchenStatus.name,
        'estimatedTime': estimatedTime,
        'actualTime': actualTime,
        'image': image,
      };

  OrderItem copyWith({
    String? id,
    String? name,
    double? price,
    int? quantity,
    List<String>? customizations,
    String? specialNote,
    KitchenStatus? kitchenStatus,
    int? estimatedTime,
    int? actualTime,
    String? image,
  }) {
    return OrderItem(
      id: id ?? this.id,
      name: name ?? this.name,
      price: price ?? this.price,
      quantity: quantity ?? this.quantity,
      customizations: customizations ?? this.customizations,
      specialNote: specialNote ?? this.specialNote,
      kitchenStatus: kitchenStatus ?? this.kitchenStatus,
      estimatedTime: estimatedTime ?? this.estimatedTime,
      actualTime: actualTime ?? this.actualTime,
      image: image ?? this.image,
    );
  }

  double get totalPrice => price * quantity;
}

enum OrderStatus { pending, created, waitingPayment, sentToKitchen, waitingKitchenConfirmation, preparing, ready, paid, completed, cancelled }

class Order {
  final String id;
  final String bookingId;
  final List<OrderItem> items;
  final double subtotal;
  final double serviceCharge;
  final double tax;
  final double total;
  final OrderStatus status;
  final DateTime createdAt;
  final String? specialInstructions;
  final PaymentMethodType? paymentMethod;
  final PaymentStatus? paymentStatus;

  const Order({
    required this.id,
    required this.bookingId,
    required this.items,
    required this.subtotal,
    required this.serviceCharge,
    required this.tax,
    required this.total,
    required this.status,
    required this.createdAt,
    this.specialInstructions,
    this.paymentMethod,
    this.paymentStatus,
  });

  factory Order.fromJson(Map<String, dynamic> json) => Order(
        id: json['id'].toString(),
    // bookingId may be provided as bookingId or reservation_id
    bookingId: (json['bookingId'] ?? json['reservation_id'] ?? json['reservationId'] ?? '').toString(),
    // items may be a List, a JSON-encoded String, or a wrapper object. Parse defensively.
    items: (() {
      final raw = json['items'];
      if (raw == null) return <OrderItem>[];
      try {
        if (raw is List<dynamic>) {
          return raw.map((e) => OrderItem.fromJson(e as Map<String, dynamic>)).toList();
        }
        if (raw is String) {
          // try decode JSON string
          try {
            final decoded = jsonDecode(raw);
            if (decoded is List<dynamic>) return decoded.map((e) => OrderItem.fromJson(e as Map<String, dynamic>)).toList();
            if (decoded is Map && decoded['data'] is List<dynamic>) return (decoded['data'] as List<dynamic>).map((e) => OrderItem.fromJson(e as Map<String, dynamic>)).toList();
          } catch (_) {
            // fallback: no parseable list
            return <OrderItem>[];
          }
        }
        if (raw is Map<String, dynamic>) {
          if (raw['rows'] is List<dynamic>) return (raw['rows'] as List<dynamic>).map((e) => OrderItem.fromJson(e as Map<String, dynamic>)).toList();
          if (raw['data'] is List<dynamic>) return (raw['data'] as List<dynamic>).map((e) => OrderItem.fromJson(e as Map<String, dynamic>)).toList();
        }
      } catch (_) {}
      return <OrderItem>[];
    })(),
    // Map monetary fields from backend snake_case names if present
    subtotal: (((json['subtotal'] ?? json['total_amount'] ?? json['totalAmount']) is num)
        ? (json['subtotal'] ?? json['total_amount'] ?? json['totalAmount']) as num
        : num.tryParse((json['subtotal'] ?? json['total_amount'] ?? json['totalAmount'] ?? '0').toString()) ?? 0)
      .toDouble(),
    serviceCharge: (((json['serviceCharge'] ?? json['service_charge']) is num)
        ? (json['serviceCharge'] ?? json['service_charge']) as num
        : num.tryParse((json['serviceCharge'] ?? json['service_charge'] ?? '0').toString()) ?? 0)
      .toDouble(),
    tax: (((json['tax'] ?? json['tax_amount']) is num)
        ? (json['tax'] ?? json['tax_amount']) as num
        : num.tryParse((json['tax'] ?? json['tax_amount'] ?? '0').toString()) ?? 0)
      .toDouble(),
    total: (((json['total'] ?? json['final_amount'] ?? json['finalAmount'] ?? json['total_amount']) is num)
        ? (json['total'] ?? json['final_amount'] ?? json['finalAmount'] ?? json['total_amount']) as num
        : num.tryParse((json['total'] ?? json['final_amount'] ?? json['finalAmount'] ?? json['total_amount'] ?? '0').toString()) ?? 0)
      .toDouble(),
    // Map backend statuses to local enum
    status: _mapStatus((json['status'] ?? json['order_status'] ?? json['orderStatus'])?.toString()),
    createdAt: (json['createdAt'] != null)
      ? DateTime.parse(json['createdAt'] as String)
      : (json['created_at'] != null ? DateTime.parse(json['created_at'] as String) : DateTime.now()),
    specialInstructions: (json['specialInstructions'] as String?) ?? (json['notes'] as String?),
        paymentMethod: json.containsKey('paymentMethod')
            ? (json['paymentMethod'] is String ? _parsePaymentMethod(json['paymentMethod']) : null)
            : (json['payment_method'] != null ? _parsePaymentMethod(json['payment_method']) : null),
        paymentStatus: json.containsKey('paymentStatus')
            ? (json['paymentStatus'] is String ? _parsePaymentStatus(json['paymentStatus']) : null)
            : (json['payment_status'] != null ? _parsePaymentStatus(json['payment_status']) : null),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'bookingId': bookingId,
        'items': items.map((e) => e.toJson()).toList(),
        'subtotal': subtotal,
        'serviceCharge': serviceCharge,
        'tax': tax,
        'total': total,
        'status': status.name,
        'createdAt': createdAt.toIso8601String(),
        'specialInstructions': specialInstructions,
      };

  Order copyWith({
    String? id,
    String? bookingId,
    List<OrderItem>? items,
    double? subtotal,
    double? serviceCharge,
    double? tax,
    double? total,
    OrderStatus? status,
    DateTime? createdAt,
    String? specialInstructions,
    PaymentMethodType? paymentMethod,
    PaymentStatus? paymentStatus,
  }) {
    return Order(
      id: id ?? this.id,
      bookingId: bookingId ?? this.bookingId,
      items: items ?? this.items,
      subtotal: subtotal ?? this.subtotal,
      serviceCharge: serviceCharge ?? this.serviceCharge,
      tax: tax ?? this.tax,
      total: total ?? this.total,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      specialInstructions: specialInstructions ?? this.specialInstructions,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      paymentStatus: paymentStatus ?? this.paymentStatus,
    );
  }

  static PaymentMethodType? _parsePaymentMethod(String? method) {
    if (method == null) return null;
    switch (method.toLowerCase()) {
      case 'cash':
        return PaymentMethodType.cash;
      case 'card':
        return PaymentMethodType.card;
      case 'momo':
        return PaymentMethodType.momo;
      case 'banking':
      case 'vnpay':
        return PaymentMethodType.banking;
      default:
        return null;
    }
  }

  static PaymentStatus? _parsePaymentStatus(String? status) {
    if (status == null) return null;
    switch (status.toLowerCase()) {
      case 'paid':
        return PaymentStatus.completed;
      case 'pending':
        return PaymentStatus.pending;
      case 'processing':
        return PaymentStatus.processing;
      case 'failed':
        return PaymentStatus.failed;
      default:
        return null;
    }
  }

  static OrderStatus _mapStatus(String? raw) {
    if (raw == null) return OrderStatus.created;
    final s = raw.toLowerCase();
    switch (s) {
      case 'pending':
        return OrderStatus.pending;
      case 'created':
        return OrderStatus.created;
      case 'waiting_payment':
      case 'waitingpayment':
        return OrderStatus.waitingPayment;
      case 'waiting_kitchen_confirmation':
      case 'waitingkitchenconfirmation':
        return OrderStatus.waitingKitchenConfirmation;
      case 'preparing':
        return OrderStatus.preparing;
      case 'sent_to_kitchen':
      case 'senttokitchen':
        return OrderStatus.sentToKitchen;
      case 'paid':
        return OrderStatus.paid;
      case 'ready':
        return OrderStatus.ready;
      case 'delivered':
      case 'completed':
        return OrderStatus.completed;
      case 'cancelled':
      case 'canceled':
        return OrderStatus.cancelled;
      default:
        return OrderStatus.created;
    }
  }
}