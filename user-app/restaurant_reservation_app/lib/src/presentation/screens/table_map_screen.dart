import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../application/providers.dart';
import '../../domain/models/table.dart';

/// Clean, minimal table-map screen that positions tables by location and x/y.
class TableMapScreen extends ConsumerWidget {
  final void Function(DiningTable) onTableSelect;

  const TableMapScreen({super.key, required this.onTableSelect});

  static final ValueNotifier<String> _selectedLocation = ValueNotifier<String>('Tất cả');

  Widget _tableTile(DiningTable t, double w, double h) => Container(
        width: w,
        height: h,
        decoration: BoxDecoration(
          color: Colors.grey.shade200,
          border: Border.all(color: Colors.black26),
          borderRadius: BorderRadius.circular(8),
        ),
        alignment: Alignment.center,
        child: Text(t.name, textAlign: TextAlign.center),
      );

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tables = ref.watch(tablesProvider);

    // Build location list
    final locations = <String>{};
    for (final t in tables) {
      locations.add(t.location.isEmpty ? 'Chưa xác định' : t.location);
    }
    final locationList = ['Tất cả', ...locations];

    return Scaffold(
      body: Column(
        children: [
          SizedBox(
            height: 56,
            child: ValueListenableBuilder<String>(
              valueListenable: _selectedLocation,
              builder: (context, selected, _) {
                return ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  scrollDirection: Axis.horizontal,
                  itemCount: locationList.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (ctx, i) {
                    final loc = locationList[i];
                    return ChoiceChip(
                      label: Text(loc, overflow: TextOverflow.ellipsis),
                      selected: loc == selected,
                      onSelected: (_) => _selectedLocation.value = loc,
                    );
                  },
                );
              },
            ),
          ),
          Expanded(
            child: InteractiveViewer(
              panEnabled: true,
              minScale: 0.5,
              maxScale: 3,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Container(
                  width: double.infinity,
                  height: 800,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.2),
                    border: Border.all(color: Theme.of(context).dividerColor),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: LayoutBuilder(builder: (context, constraints) {
                    final floorW = constraints.maxWidth;
                    final floorH = constraints.maxHeight;
                    final selected = _selectedLocation.value;

                    List<DiningTable> visibleTables;
                    if (selected == 'Tất cả') {
                      visibleTables = tables;
                    } else {
                      visibleTables = tables.where((t) => (t.location.isEmpty ? 'Chưa xác định' : t.location) == selected).toList();
                    }

                    // Compute bounds for normalization
                    final coords = visibleTables.where((t) => t.x != null && t.y != null).toList();
                    double minX = 0, maxX = 0, minY = 0, maxY = 0;
                    if (coords.isNotEmpty) {
                      final xs = coords.map((t) => t.x!.toDouble()).toList();
                      final ys = coords.map((t) => t.y!.toDouble()).toList();
                      minX = xs.reduce(math.min);
                      maxX = xs.reduce(math.max);
                      minY = ys.reduce(math.min);
                      maxY = ys.reduce(math.max);
                    }

                    final spanX = (maxX - minX) == 0 ? 1.0 : (maxX - minX);
                    final spanY = (maxY - minY) == 0 ? 1.0 : (maxY - minY);

                    final padding = 16.0;
                    final scaleX = (floorW - padding * 2) / spanX;
                    final scaleY = (floorH - padding * 2) / spanY;

                    final children = <Widget>[];
                    for (var i = 0; i < visibleTables.length; i++) {
                      final t = visibleTables[i];
                      final w = t.width ?? 80.0;
                      final h = t.height ?? 60.0;

                      double left, top;
                      if (t.x != null && t.y != null) {
                        left = padding + (t.x!.toDouble() - minX) * scaleX - w / 2;
                        top = padding + (t.y!.toDouble() - minY) * scaleY - h / 2;
                      } else {
                        left = padding + (i % 6) * (w + 12);
                        top = padding + (i ~/ 6) * (h + 12);
                      }

                      left = left.clamp(0.0, floorW - w);
                      top = top.clamp(0.0, floorH - h);

                      children.add(Positioned(
                        left: left,
                        top: top,
                        child: GestureDetector(
                          onTap: () => onTableSelect(t),
                          child: _tableTile(t, w, h),
                        ),
                      ));
                    }

                    return Stack(children: children);
                  }),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
