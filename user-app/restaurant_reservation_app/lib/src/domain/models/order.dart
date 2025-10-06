enum KitchenStatus { pending, preparing, ready, served }

class OrderItem {
  final int id;
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
        id: json['id'] as int,
        name: json['name'] as String,
        price: (json['price'] as num).toDouble(),
        quantity: json['quantity'] as int,
        customizations: (json['customizations'] as List<dynamic>?)
                ?.map((e) => e as String)
                .toList() ??
            [],
        specialNote: json['specialNote'] as String?,
        kitchenStatus: KitchenStatus.values.firstWhere(
            (e) => e.name == json['kitchenStatus'],
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
    int? id,
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

enum OrderStatus { created, sentToKitchen, completed, cancelled }

class Order {
  final int id;
  final int bookingId;
  final List<OrderItem> items;
  final double subtotal;
  final double serviceCharge;
  final double tax;
  final double total;
  final OrderStatus status;
  final DateTime createdAt;
  final String? specialInstructions;

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
  });

  factory Order.fromJson(Map<String, dynamic> json) => Order(
        id: json['id'] as int,
        bookingId: json['bookingId'] as int,
        items: (json['items'] as List<dynamic>)
            .map((e) => OrderItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        subtotal: (json['subtotal'] as num).toDouble(),
        serviceCharge: (json['serviceCharge'] as num).toDouble(),
        tax: (json['tax'] as num).toDouble(),
        total: (json['total'] as num).toDouble(),
        status: OrderStatus.values.firstWhere((e) => e.name == json['status']),
        createdAt: DateTime.parse(json['createdAt'] as String),
        specialInstructions: json['specialInstructions'] as String?,
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
    int? id,
    int? bookingId,
    List<OrderItem>? items,
    double? subtotal,
    double? serviceCharge,
    double? tax,
    double? total,
    OrderStatus? status,
    DateTime? createdAt,
    String? specialInstructions,
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
    );
  }
}


