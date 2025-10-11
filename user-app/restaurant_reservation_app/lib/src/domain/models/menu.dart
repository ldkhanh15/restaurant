class MenuCategory {
  final String id;
  final String name;
  final List<MenuItem> items;

  const MenuCategory({
    required this.id, 
    required this.name,
    required this.items,
  });

  factory MenuCategory.fromJson(Map<String, dynamic> json) => MenuCategory(
        id: json['id'] as String,
        name: json['name'] as String,
        items: (json['items'] as List<dynamic>)
            .map((item) => MenuItem.fromJson(item as Map<String, dynamic>))
            .toList(),
      );

  Map<String, dynamic> toJson() => {
        'id': id, 
        'name': name,
        'items': items.map((item) => item.toJson()).toList(),
      };
}

class MenuItem {
  final String id;
  final String name;
  final String description;
  final double price;
  final String image;
  final double rating;
  final bool popular;
  final String categoryId;

  const MenuItem({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.image,
    required this.rating,
    required this.popular,
    required this.categoryId,
  });

  factory MenuItem.fromJson(Map<String, dynamic> json) => MenuItem(
        id: json['id'].toString(),
        name: json['name'] as String,
        description: json['description'] as String,
        price: (json['price'] as num).toDouble(),
        image: json['image'] as String,
        rating: (json['rating'] as num).toDouble(),
        popular: json['popular'] as bool,
        categoryId: json['categoryId'] as String,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'description': description,
        'price': price,
        'image': image,
        'rating': rating,
        'popular': popular,
        'categoryId': categoryId,
      };

  MenuItem copyWith({
    String? id,
    String? name,
    String? description,
    double? price,
    String? image,
    double? rating,
    bool? popular,
    String? categoryId,
  }) {
    return MenuItem(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      price: price ?? this.price,
      image: image ?? this.image,
      rating: rating ?? this.rating,
      popular: popular ?? this.popular,
      categoryId: categoryId ?? this.categoryId,
    );
  }
}

class CartItem {
  final String id;
  final String name;
  final double price;
  final int quantity;
  final String image;
  final List<String> customizations;
  final String? specialNote;

  const CartItem({
    required this.id,
    required this.name,
    required this.price,
    required this.quantity,
    required this.image,
    required this.customizations,
    this.specialNote,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) => CartItem(
        id: json['id'].toString(),
        name: json['name'] as String,
        price: (json['price'] as num).toDouble(),
        quantity: json['quantity'] as int,
        image: json['image'] as String,
        customizations: (json['customizations'] as List<dynamic>?)
                ?.map((e) => e as String)
                .toList() ??
            [],
        specialNote: json['specialNote'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'price': price,
        'quantity': quantity,
        'image': image,
        'customizations': customizations,
        'specialNote': specialNote,
      };

  CartItem copyWith({
    String? id,
    String? name,
    double? price,
    int? quantity,
    String? image,
    List<String>? customizations,
    String? specialNote,
  }) {
    return CartItem(
      id: id ?? this.id,
      name: name ?? this.name,
      price: price ?? this.price,
      quantity: quantity ?? this.quantity,
      image: image ?? this.image,
      customizations: customizations ?? this.customizations,
      specialNote: specialNote ?? this.specialNote,
    );
  }

  double get totalPrice => price * quantity;
}