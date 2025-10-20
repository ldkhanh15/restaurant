import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../application/providers.dart';
import '../../domain/models/table.dart';

class TableMapScreen extends ConsumerWidget {
  final Function(DiningTable) onTableSelect;

  const TableMapScreen({super.key, required this.onTableSelect});

  Color _getTableColor(TableStatus status) {
    switch (status) {
      case TableStatus.available:
        return Colors.green.shade200;
      case TableStatus.reserved:
        return Colors.orange.shade200;
      case TableStatus.occupied:
        return Colors.red.shade200;
      case TableStatus.cleaning:
        return Colors.blue.shade200;
    }
  }

  Color _getTableBorderColor(TableStatus status) {
    switch (status) {
      case TableStatus.available:
        return Colors.green.shade700;
      case TableStatus.reserved:
        return Colors.orange.shade700;
      case TableStatus.occupied:
        return Colors.red.shade700;
      case TableStatus.cleaning:
        return Colors.blue.shade700;
    }
  }

  IconData _getTableIcon(TableType type) {
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

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tables = ref.watch(tablesProvider);

    return Scaffold(
      // The AppBar is inherited from the parent screen (TableBookingScreen)
      body: InteractiveViewer(
        panEnabled: true,
        minScale: 0.5,
        maxScale: 4,
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Container(
            width: 600, // Fixed width for the map container
            height: 800, // Fixed height for the map container
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.3),
              border: Border.all(color: Theme.of(context).dividerColor),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Stack(
              children: tables.map((table) {
                // Use default positions if null
                final left = table.x ?? (tables.indexOf(table) % 5) * 110.0 + 20;
                final top = table.y ?? (tables.indexOf(table) ~/ 5) * 110.0 + 20;

                return Positioned(
                  left: left,
                  top: top,
                  child: GestureDetector(
                      onTap: () {
                        // Allow opening booking dialog regardless of current table.status.
                        // Availability for specific date/time will be checked inside the booking dialog.
                        onTableSelect(table);
                      },
                    child: Tooltip(
                      message: '${_getStatusText(table.status)}\nSức chứa: ${table.capacity}',
                      child: Container(
                        width: table.width ?? 80,
                        height: table.height ?? 80,
                        decoration: BoxDecoration(
                          color: _getTableColor(table.status),
                          border: Border.all(
                            color: _getTableBorderColor(table.status),
                            width: 2,
                          ),
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 8,
                              offset: const Offset(0, 4),
                            )
                          ]
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              _getTableIcon(table.type),
                              size: 24,
                              color: _getTableBorderColor(table.status),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              // Use the table name exactly as provided to avoid duplicating
                              // the word "Bàn" when it's already present in the data.
                              table.name,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: _getTableBorderColor(table.status),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ),
      ),
    );
  }
}
