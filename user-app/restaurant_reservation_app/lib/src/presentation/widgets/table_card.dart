import 'package:flutter/material.dart';
import '../../domain/models/table.dart';

class TableCard extends StatelessWidget {
  final DiningTable table;
  final Function(DiningTable) onBook;

  const TableCard({
    super.key,
    required this.table,
    required this.onBook,
  });

  Color _getStatusColor(TableStatus status) {
    switch (status) {
      case TableStatus.available:
        return Colors.green;
      case TableStatus.reserved:
        return Colors.orange;
      case TableStatus.occupied:
        return Colors.red;
      case TableStatus.cleaning:
        return Colors.blue;
    }
  }

  String _getStatusText(TableStatus status) {
    switch (status) {
      case TableStatus.available:
        return 'Trống';
      case TableStatus.reserved:
        return 'Đã đặt';
      case TableStatus.occupied:
        return 'Sử dụng';
      case TableStatus.cleaning:
        return 'Dọn dẹp';
    }
  }

  IconData _getTypeIcon(TableType type) {
    switch (type) {
      case TableType.vip:
        return Icons.star;
      case TableType.couple:
        return Icons.favorite;
      case TableType.group:
        return Icons.group;
      default:
        return Icons.table_restaurant;
    }
  }

  String _formatPrice(double price) {
    if (price == 0) return 'Miễn phí';
    return '${price.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    )}đ';
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16.0),
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header: Icon, Name, Location, Status
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(_getTypeIcon(table.type), color: Theme.of(context).colorScheme.primary, size: 32),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        // Some data sources include the word "Bàn" inside the name already
                        // so display the name as-is. If the name does not contain the word
                        // we keep it unchanged (the design already shows the word inside
                        // mock data). This prevents "Bàn Bàn VIP 1" duplicates.
                        table.name,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        table.location,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Theme.of(context).colorScheme.onSurfaceVariant,
                            ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 120),
                  child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: _getStatusColor(table.status).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    _getStatusText(table.status),
                    style: TextStyle(
                      color: _getStatusColor(table.status),
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Description
            if (table.description != null && table.description!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 12.0),
                child: Text(
                  table.description!,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ),

            const Divider(),
            const SizedBox(height: 12),

            // Details: Capacity, Deposit, Cancellation
              // Use Wrap instead of Row so chips can wrap on small screens and avoid overflow
              Wrap(
                spacing: 8.0,
                runSpacing: 6.0,
                children: [
                  _buildInfoChip(context, Icons.people_outline, '${table.capacity} người'),
                  if (table.deposit != null && table.deposit! > 0)
                    _buildInfoChip(context, Icons.account_balance_wallet_outlined, 'Cọc: ${_formatPrice(table.deposit!)}'),
                  if (table.cancel_minutes != null)
                    _buildInfoChip(context, Icons.history, 'Hủy trước ${table.cancel_minutes} phút'),
                ],
              ),
            
            // Amenities
            if (table.amenities != null && table.amenities!.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text('Tiện ích', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 4,
                children: table.amenities!.map((amenity) => _buildInfoChip(context, _getAmenityIcon(amenity), amenity)).toList(),
              )
            ],

            const SizedBox(height: 16),

            // Action Button: always allow opening booking dialog. Availability is checked per-date/time
            Align(
              alignment: Alignment.centerRight,
              child: ElevatedButton.icon(
                onPressed: () => onBook(table),
                icon: const Icon(Icons.bookmark_add_outlined),
                label: const Text('Đặt ngay'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoChip(BuildContext context, IconData icon, String label) {
    return Chip(
      avatar: Icon(icon, size: 16, color: Theme.of(context).colorScheme.onSurfaceVariant),
      label: Text(label),
      backgroundColor: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.5),
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
      labelStyle: Theme.of(context).textTheme.bodySmall,
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
      visualDensity: VisualDensity.compact,
    );
  }

  IconData _getAmenityIcon(String amenity) {
    // Simple mapping, can be expanded
    final lowerAmenity = amenity.toLowerCase();
    if (lowerAmenity.contains('wifi')) return Icons.wifi;
    if (lowerAmenity.contains('cửa sổ') || lowerAmenity.contains('window')) return Icons.window;
    if (lowerAmenity.contains('riêng tư') || lowerAmenity.contains('private')) return Icons.lock_outline;
    if (lowerAmenity.contains('ổ cắm') || lowerAmenity.contains('power')) return Icons.power_outlined;
    if (lowerAmenity.contains('ban công') || lowerAmenity.contains('balcony')) return Icons.balcony;
    return Icons.check_box_outline_blank;
  }
}
