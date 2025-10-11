enum TableStatus { available, reserved, occupied }
enum TableType { regular, vip, couple, group }

class DiningTable {
  final String id; // Should be String for UUIDs
  final String name;
  final int capacity;
  final String location;
  final double price;
  final TableStatus status;
  final TableType type;
  final String? image;
  final double? x;
  final double? y;
  final double? width;
  final double? height;

  const DiningTable({
    required this.id,
    required this.name,
    required this.capacity,
    required this.location,
    required this.price,
    required this.status,
    required this.type,
    this.image,
    this.x,
    this.y,
    this.width,
    this.height,
  });

  factory DiningTable.fromJson(Map<String, dynamic> json) => DiningTable(
        id: json['id']?.toString() ?? '',
        name: json['name'] as String,
        capacity: json['capacity'] as int,
        location: json['location'] as String,
        price: (json['price'] as num).toDouble(),
        status: TableStatus.values.firstWhere((e) => e.name == json['status']),
        type: TableType.values.firstWhere((e) => e.name == json['type']),
        image: json['image'] as String?,
        x: json['x'] as double?,
        y: json['y'] as double?,
        width: json['width'] as double?,
        height: json['height'] as double?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'capacity': capacity,
        'location': location,
        'price': price,
        'status': status.name,
        'type': type.name,
        'image': image,
        'x': x,
        'y': y,
        'width': width,
        'height': height,
      };

  DiningTable copyWith({
    String? id,
    String? name,
    int? capacity,
    String? location,
    double? price,
    TableStatus? status,
    TableType? type,
    String? image,
    double? x,
    double? y,
    double? width,
    double? height,
  }) {
    return DiningTable(
      id: id ?? this.id,
      name: name ?? this.name,
      capacity: capacity ?? this.capacity,
      location: location ?? this.location,
      price: price ?? this.price,
      status: status ?? this.status,
      type: type ?? this.type,
      image: image ?? this.image,
      x: x ?? this.x,
      y: y ?? this.y,
      width: width ?? this.width,
      height: height ?? this.height,
    );
  }
}
