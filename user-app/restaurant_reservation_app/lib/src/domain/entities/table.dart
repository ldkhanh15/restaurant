
class Table {
  final String id;
  final int tableNumber;
  final int capacity;
  final bool isOccupied;
  final String? location;
  final String? status;
  final Map<String, dynamic>? panoramaUrls;
  final Map<String, dynamic>? amenities;
  final double? price;

  Table({
    required this.id,
    required this.tableNumber,
    required this.capacity,
    required this.isOccupied,
    this.location,
    this.status,
    this.panoramaUrls,
    this.amenities,
    this.price,
  });

  factory Table.fromJson(Map<String, dynamic> json) {
    // Support both snake_case and camelCase
    dynamic read(String a, String b) => json[a] ?? json[b];

    final id = read('id', 'id')?.toString() ?? '';
    final tn = read('table_number', 'tableNumber') ?? read('tableNumber', 'tableNumber') ?? json['tableNumber'];
    final tableNumber = (tn is int) ? tn : int.tryParse(tn?.toString() ?? '') ?? 0;
    final capacityRaw = read('capacity', 'capacity');
    final capacity = (capacityRaw is int) ? capacityRaw : int.tryParse(capacityRaw?.toString() ?? '') ?? 0;
    final status = read('status', 'status')?.toString();
    final isOccupied = status == 'occupied' || status == 'reserved';
    final location = read('location', 'location') as String?;
    final panorama = read('panorama_urls', 'panoramaUrls') as Map<String, dynamic>?;
    final amenities = read('amenities', 'amenities') as Map<String, dynamic>?;
  final priceRaw = read('price', 'price');
  final price = (priceRaw is num) ? priceRaw.toDouble() : (double.tryParse(priceRaw?.toString() ?? '') ?? null);

    return Table(
      id: id,
      tableNumber: tableNumber,
      capacity: capacity,
      isOccupied: isOccupied,
      location: location,
      status: status,
      panoramaUrls: panorama,
      amenities: amenities,
      price: price,
    );
  }
}
