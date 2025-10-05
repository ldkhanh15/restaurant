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
    }
  }

  String _getStatusText(TableStatus status) {
    switch (status) {
      case TableStatus.available:
        return 'Trống';
      case TableStatus.reserved:
        return 'Đã đặt';
      case TableStatus.occupied:
        return 'Đang sử dụng';
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

  Color _getTypeColor(TableType type) {
    switch (type) {
      case TableType.vip:
        return Colors.yellow;
      case TableType.couple:
        return Colors.pink;
      case TableType.group:
        return Colors.green;
      default:
        return Colors.blue;
    }
  }

  String _formatPrice(double price) {
    return '${price.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    )}đ';
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16.0),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: _getTypeColor(table.type).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: _getTypeColor(table.type),
                      width: 2,
                    ),
                  ),
                  child: Icon(
                    _getTypeIcon(table.type),
                    color: _getTypeColor(table.type),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        table.name,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        table.location,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getStatusColor(table.status).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _getStatusColor(table.status),
                      width: 1,
                    ),
                  ),
                  child: Text(
                    _getStatusText(table.status),
                    style: TextStyle(
                      color: _getStatusColor(table.status),
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Icon(
                  Icons.people,
                  size: 16,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
                const SizedBox(width: 4),
                Text(
                  '${table.capacity} người',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(width: 16),
                Icon(
                  Icons.attach_money,
                  size: 16,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
                const SizedBox(width: 4),
                Text(
                  _formatPrice(table.price),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
                const Spacer(),
                if (table.status == TableStatus.available)
                  ElevatedButton(
                    onPressed: () => onBook(table),
                    child: const Text('Đặt bàn'),
                  )
                else
                  OutlinedButton(
                    onPressed: null,
                    child: const Text('Không khả dụng'),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
