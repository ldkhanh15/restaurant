enum TableStatus { available, reserved, occupied, cleaning }
enum TableType { regular, vip, couple, group }

class DiningTable {
  final String id;
  final String name; // table_number
  final int capacity;
  final String location;
  final double price; // This can be used for deposit
  final TableStatus status;
  final TableType type;
  final String? image;
  final double? x;
  final double? y;
  final double? width;
  final double? height;

  // New fields from user request
  final double? deposit;
  final int? cancel_minutes;
  final List<String>? panorama_urls;
  final List<String>? amenities;
  final String? description;

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
    // new fields
    this.deposit,
    this.cancel_minutes,
    this.panorama_urls,
    this.amenities,
    this.description,
  });

  factory DiningTable.fromJson(Map<String, dynamic> json) {
    return DiningTable(
      id: json['id']?.toString() ?? '',
      name: json['table_number']?.toString() ?? json['name'] as String,
      capacity: json['capacity'] as int,
      location: json['location'] as String? ?? 'N/A',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      status: TableStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => TableStatus.available, // Provide a default value
      ),
      type: TableType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => TableType.regular, // Provide a default value
      ),
      image: json['image'] as String?,
      x: (json['x'] as num?)?.toDouble(),
      y: (json['y'] as num?)?.toDouble(),
      width: (json['width'] as num?)?.toDouble(),
      height: (json['height'] as num?)?.toDouble(),
      // new fields
      deposit: (json['deposit'] as num?)?.toDouble(),
      cancel_minutes: json['cancel_minutes'] as int?,
      panorama_urls: json['panorama_urls'] != null ? List<String>.from(json['panorama_urls']) : null,
      amenities: json['amenities'] != null ? List<String>.from(json['amenities']) : null,
      description: json['description'] as String?,
    );
  }

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
        // new fields
        'deposit': deposit,
        'cancel_minutes': cancel_minutes,
        'panorama_urls': panorama_urls,
        'amenities': amenities,
        'description': description,
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
    double? deposit,
    int? cancel_minutes,
    List<String>? panorama_urls,
    List<String>? amenities,
    String? description,
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
      deposit: deposit ?? this.deposit,
      cancel_minutes: cancel_minutes ?? this.cancel_minutes,
      panorama_urls: panorama_urls ?? this.panorama_urls,
      amenities: amenities ?? this.amenities,
      description: description ?? this.description,
    );
  }
}