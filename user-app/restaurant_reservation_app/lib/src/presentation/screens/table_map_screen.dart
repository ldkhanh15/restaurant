import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../application/providers.dart';
import '../../domain/models/table.dart';

class TableMapScreen extends ConsumerWidget {
  final Function(DiningTable) onTableSelect;

  const TableMapScreen({super.key, required this.onTableSelect});

  Color _getTableColor(TableStatus status, TableType type) {
    if (status == TableStatus.available) {
      switch (type) {
        case TableType.vip:
          return Colors.yellow[200]!;
        case TableType.couple:
          return Colors.pink[200]!;
        case TableType.group:
          return Colors.green[200]!;
        default:
          return Colors.blue[200]!;
      }
    } else if (status == TableStatus.reserved) {
      return Colors.orange[200]!;
    } else {
      return Colors.grey[300]!;
    }
  }

  Color _getTableBorderColor(TableStatus status, TableType type) {
    if (status == TableStatus.available) {
      switch (type) {
        case TableType.vip:
          return Colors.yellow[600]!;
        case TableType.couple:
          return Colors.pink[600]!;
        case TableType.group:
          return Colors.green[600]!;
        default:
          return Colors.blue[600]!;
      }
    } else if (status == TableStatus.reserved) {
      return Colors.orange[600]!;
    } else {
      return Colors.grey[600]!;
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
        return 'Đang sử dụng';
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tables = ref.watch(tablesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sơ đồ bàn'),
        actions: [
          IconButton(
            icon: const Icon(Icons.legend_toggle),
            onPressed: () {
              _showLegend(context);
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Legend
            _buildLegend(context),
            const SizedBox(height: 24),
            // Table Map
            Container(
              height: 500,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Stack(
                children: tables.map((table) {
                  return Positioned(
                    left: table.x ?? 0,
                    top: table.y ?? 0,
                    child: GestureDetector(
                      onTap: () {
                        if (table.status == TableStatus.available) {
                          onTableSelect(table);
                        }
                      },
                      child: Container(
                        width: table.width ?? 60,
                        height: table.height ?? 60,
                        decoration: BoxDecoration(
                          color: _getTableColor(table.status, table.type),
                          border: Border.all(
                            color: _getTableBorderColor(table.status, table.type),
                            width: 2,
                          ),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              _getTableIcon(table.type),
                              size: 16,
                              color: _getTableBorderColor(table.status, table.type),
                            ),
                            const SizedBox(height: 2),
                            Flexible(
                              child: Text(
                                table.name,
                                style: TextStyle(
                                  fontSize: 8,
                                  fontWeight: FontWeight.bold,
                                  color: _getTableBorderColor(table.status, table.type),
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                            Flexible(
                              child: Text(
                                '${table.capacity} người',
                                style: TextStyle(
                                  fontSize: 8,
                                  color: _getTableBorderColor(table.status, table.type),
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                            Flexible(
                              child: Text(
                                _getStatusText(table.status),
                                style: TextStyle(
                                  fontSize: 8,
                                  color: _getTableBorderColor(table.status, table.type),
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 24),
            // Table List
            Text(
              'Danh sách bàn',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            ...tables.map((table) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: _getTableColor(table.status, table.type),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: _getTableBorderColor(table.status, table.type),
                    ),
                  ),
                  child: Icon(
                    _getTableIcon(table.type),
                    color: _getTableBorderColor(table.status, table.type),
                  ),
                ),
                title: Text(table.name),
                subtitle: Text('${table.capacity} người • ${table.location}'),
                trailing: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      _getStatusText(table.status),
                      style: TextStyle(
                        color: _getTableBorderColor(table.status, table.type),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      '${table.price.toStringAsFixed(0)}đ',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
                onTap: () {
                  if (table.status == TableStatus.available) {
                    onTableSelect(table);
                  }
                },
              ),
            )).toList(),
          ],
        ),
      ),
    );
  }

  Widget _buildLegend(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceVariant,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Chú thích',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildLegendItem(context, 'Trống', Colors.blue.shade200, Colors.blue.shade600),
              const SizedBox(width: 16),
              _buildLegendItem(context, 'Đã đặt', Colors.orange.shade200, Colors.orange.shade600),
              const SizedBox(width: 16),
              _buildLegendItem(context, 'Đang sử dụng', Colors.grey.shade300, Colors.grey.shade600),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _buildLegendItem(context, 'VIP', Colors.yellow.shade200, Colors.yellow.shade600, Icons.star),
              const SizedBox(width: 16),
              _buildLegendItem(context, 'Đôi', Colors.pink.shade200, Colors.pink.shade600, Icons.favorite),
              const SizedBox(width: 16),
              _buildLegendItem(context, 'Nhóm', Colors.green.shade200, Colors.green.shade600, Icons.group),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLegendItem(BuildContext context, String label, Color color, Color borderColor, [IconData? icon]) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 20,
          height: 20,
          decoration: BoxDecoration(
            color: color,
            border: Border.all(color: borderColor),
            borderRadius: BorderRadius.circular(4),
          ),
          child: icon != null ? Icon(icon, size: 12, color: borderColor) : null,
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }

  void _showLegend(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Chú thích'),
        content: _buildLegend(context),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Đóng'),
          ),
        ],
      ),
    );
  }
}