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
        id: json['id']?.toString() ?? (json['item_id']?.toString() ?? ''),
        name: (() {
          if (json['name'] is String) return json['name'] as String;
          if (json['dish'] is Map<String, dynamic> && (json['dish']['name'] is String)) return json['dish']['name'] as String;
          if (json['menu_item'] is Map<String, dynamic> && (json['menu_item']['name'] is String)) return json['menu_item']['name'] as String;
          return (json['title'] ?? json['label'] ?? '').toString();
        })(),
        price: (() {
          try {
            if (json['price'] is num) return (json['price'] as num).toDouble();
            if (json['unit_price'] is num) return (json['unit_price'] as num).toDouble();
            if (json['dish'] is Map<String, dynamic> && json['dish']['price'] is num) return (json['dish']['price'] as num).toDouble();
            // try parseable strings
            final p = (json['price'] ?? json['unit_price'] ?? (json['dish'] is Map ? json['dish']['price'] : null));
            return p != null ? double.tryParse(p.toString()) ?? 0.0 : 0.0;
          } catch (_) {
            return 0.0;
          }
        })(),
        quantity: (() {
          try {
            if (json['quantity'] is int) return json['quantity'] as int;
            if (json['qty'] is int) return json['qty'] as int;
            if (json['quantity'] is String) return int.tryParse(json['quantity'] as String) ?? 1;
            if (json['qty'] is String) return int.tryParse(json['qty'] as String) ?? 1;
            if (json['count'] is int) return json['count'] as int;
            // fallback to nested dish quantity
            if (json['dish'] is Map<String, dynamic> && json['dish']['quantity'] is int) return json['dish']['quantity'] as int;
          } catch (_) {}
          return 1;
        })(),
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
        specialNote: json['specialNote'] as String? ?? json['note'] as String?,
        kitchenStatus: KitchenStatus.values.firstWhere(
            (e) => e.name == (json['kitchenStatus'] ?? json['kitchen_status']),
            orElse: () => KitchenStatus.pending),
        estimatedTime: (json['estimatedTime'] is int) ? json['estimatedTime'] as int : (json['estimated_time'] is int ? json['estimated_time'] as int : 0),
        actualTime: (json['actualTime'] is int) ? json['actualTime'] as int? : (json['actual_time'] is int ? json['actual_time'] as int? : null),
        image: (() {
          if (json['image'] is String && (json['image'] as String).isNotEmpty) return json['image'] as String;
          if (json['dish'] is Map<String, dynamic> && json['dish']['image'] is String) return json['dish']['image'] as String;
          if (json['menu_item'] is Map<String, dynamic> && json['menu_item']['image'] is String) return json['menu_item']['image'] as String;
          return '';
        })(),
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

  factory Order.fromJson(Map<String, dynamic> json) {
    // helper to convert dynamic element to OrderItem
    OrderItem toItem(dynamic e) {
      if (e is Map<String, dynamic>) return OrderItem.fromJson(e);
      if (e is Map) return OrderItem.fromJson(Map<String, dynamic>.from(e));
      // fallback
      return OrderItem.fromJson({'id': e.toString(), 'name': e.toString(), 'price': 0, 'quantity': 1, 'customizations': []});
    }

    List<OrderItem> parsedItems = <OrderItem>[];
    try {
      // Candidates where items could live
      final candidates = <dynamic>[
        json['items'],
        json['order_items'],
        json['orderItems'],
        json['pre_order_items'],
        json['preOrderItems'],
        json['items_data'],
        json['rows'],
        json['data'],
      ];

      // Also consider reservation.pre_order_items
      if (json['reservation'] is Map && (json['reservation']['pre_order_items'] != null)) {
        candidates.add(json['reservation']['pre_order_items']);
      }

      for (final c in candidates) {
        if (c == null) continue;
        if (c is List<dynamic>) {
          parsedItems = c.map((e) => toItem(e)).toList();
          break;
        }
        if (c is String) {
          try {
            final decoded = jsonDecode(c);
            if (decoded is List<dynamic>) {
              parsedItems = decoded.map((e) => toItem(e)).toList();
              break;
            }
            if (decoded is Map && decoded['data'] is List<dynamic>) {
              parsedItems = (decoded['data'] as List<dynamic>).map((e) => toItem(e)).toList();
              break;
            }
          } catch (_) {
            continue;
          }
        }
        if (c is Map && c['rows'] is List<dynamic>) {
          parsedItems = (c['rows'] as List<dynamic>).map((e) => toItem(e)).toList();
          break;
        }
        if (c is Map && c['data'] is List<dynamic>) {
          parsedItems = (c['data'] as List<dynamic>).map((e) => toItem(e)).toList();
          break;
        }
      }
    } catch (_) {
      parsedItems = <OrderItem>[];
    }

    // Map monetary fields from backend snake_case names if present
    final subtotalVal = (((json['subtotal'] ?? json['total_amount'] ?? json['totalAmount']) is num)
            ? (json['subtotal'] ?? json['total_amount'] ?? json['totalAmount']) as num
            : num.tryParse((json['subtotal'] ?? json['total_amount'] ?? json['totalAmount'] ?? '0').toString()) ?? 0)
        .toDouble();

    final serviceChargeVal = (((json['serviceCharge'] ?? json['service_charge']) is num)
            ? (json['serviceCharge'] ?? json['service_charge']) as num
            : num.tryParse((json['serviceCharge'] ?? json['service_charge'] ?? '0').toString()) ?? 0)
        .toDouble();

    final taxVal = (((json['tax'] ?? json['tax_amount']) is num)
            ? (json['tax'] ?? json['tax_amount']) as num
            : num.tryParse((json['tax'] ?? json['tax_amount'] ?? '0').toString()) ?? 0)
        .toDouble();

    final totalVal = (((json['total'] ?? json['final_amount'] ?? json['finalAmount'] ?? json['total_amount']) is num)
            ? (json['total'] ?? json['final_amount'] ?? json['finalAmount'] ?? json['total_amount']) as num
            : num.tryParse((json['total'] ?? json['final_amount'] ?? json['finalAmount'] ?? json['total_amount'] ?? '0').toString()) ?? 0)
        .toDouble();

    final result = Order(
      id: json['id'].toString(),
      bookingId: (json['bookingId'] ?? json['reservation_id'] ?? json['reservationId'] ?? '').toString(),
      items: parsedItems,
      subtotal: subtotalVal,
      serviceCharge: serviceChargeVal,
      tax: taxVal,
      total: totalVal,
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

    // Post-processing fallback: if no items were parsed, try to build from reservation/pre_order_items
    try {
      if (result.items.isEmpty) {
        dynamic pre = json['pre_order_items'] ?? json['preOrderItems'];
        if (pre == null && json['reservation'] is Map) pre = (json['reservation'] as Map)['pre_order_items'] ?? (json['reservation'] as Map)['preOrderItems'];
        if (pre != null) {
          final built = Order._buildFromPreOrder(pre);
          if (built.isNotEmpty) {
            // rebuild result with items and recomputed totals
            final subtotalComputed = built.fold<double>(0.0, (s, it) => s + it.price * it.quantity);
            final totalComputed = subtotalComputed + serviceChargeVal + taxVal;
            return result.copyWith(items: built, subtotal: subtotalComputed, total: totalComputed);
          }
        }
      }
    } catch (_) {}

    return result;
  }

  // Build items from reservation/pre-order entries when backend returns those shapes.
  static List<OrderItem> _buildFromPreOrder(dynamic rawList) {
    try {
      if (rawList is List<dynamic>) {
        return rawList.map((e) {
          try {
      final m = e is Map<String, dynamic>
        ? e
        : (e is Map ? Map<String, dynamic>.from(e) : {'name': e.toString(), 'price': 0, 'quantity': 1});
      final dish = (m['dish'] is Map) ? Map<String, dynamic>.from(m['dish']) : null;
      // support shape with dish_id (reservation pre_order_items)
      final dishId = m['dish_id']?.toString() ?? m['dishId']?.toString();
      final id = m['id']?.toString() ?? (dish?['id']?.toString() ?? dishId ?? '');
      final name = (m['name'] as String?) ?? (dish != null ? (dish['name']?.toString() ?? '') : (m['title']?.toString() ?? dishId ?? ''));
            final price = (() {
              try {
                if (m['price'] is num) return (m['price'] as num).toDouble();
                if (m['unit_price'] is num) return (m['unit_price'] as num).toDouble();
                if (dish != null && dish['price'] is num) return (dish['price'] as num).toDouble();
                // reservation pre_order_items may not include price; try 'unitPrice' or fallback to 0
                if (m['unitPrice'] is num) return (m['unitPrice'] as num).toDouble();
                return double.tryParse((m['price'] ?? m['unitPrice'] ?? dish?['price'] ?? 0).toString()) ?? 0.0;
              } catch (_) {
                return 0.0;
              }
            })();
            final qty = (() {
              try {
                if (m['quantity'] is int) return m['quantity'] as int;
                if (m['qty'] is int) return m['qty'] as int;
                if (m['count'] is int) return m['count'] as int;
                if (m['quantity'] is String) return int.tryParse(m['quantity'] as String) ?? 1;
                if (m['qty'] is String) return int.tryParse(m['qty'] as String) ?? 1;
                // reservation shape uses 'quantity' but sometimes 'qty' or 'amount'
                if (m['amount'] is int) return m['amount'] as int;
                if (m['amount'] is String) return int.tryParse(m['amount'] as String) ?? 1;
              } catch (_) {}
              return 1;
            })();
            return OrderItem(id: id, name: name, price: price, quantity: qty, customizations: <String>[], estimatedTime: 0, image: '');
          } catch (_) {
            return OrderItem(id: '', name: '', price: 0, quantity: 1, customizations: <String>[], estimatedTime: 0, image: '');
          }
        }).toList();
      }
    } catch (_) {}
    return <OrderItem>[];
  }

  // Public wrapper so other modules can synthesize OrderItem lists from reservation pre-order payloads.
  static List<OrderItem> buildFromPreOrder(dynamic rawList) => _buildFromPreOrder(rawList);

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

  /// Total items (sum of quantity) across all order items.
  int get totalItems => items.fold(0, (sum, it) => sum + (it.quantity));

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