import 'package:flutter/material.dart';
import '../../domain/models/menu.dart';

class CustomizationDialog extends StatefulWidget {
  final MenuItem item;
  final Function(List<String>, String?) onConfirm;

  const CustomizationDialog({
    super.key,
    required this.item,
    required this.onConfirm,
  });

  @override
  State<CustomizationDialog> createState() => _CustomizationDialogState();
}

class _CustomizationDialogState extends State<CustomizationDialog> {
  final List<String> _selectedCustomizations = [];
  final TextEditingController _specialNoteController = TextEditingController();

  final List<String> _availableCustomizations = [
    'Không cay',
    'Ít cay',
    'Cay vừa',
    'Cay nhiều',
    'Không hành',
    'Không tỏi',
    'Ít muối',
    'Nhiều rau',
    'Không đá',
    'Ít đá',
  ];

  String _formatPrice(double price) {
    return '${price.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    )}đ';
  }

  @override
  void dispose() {
    _specialNoteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: Container(
        constraints: const BoxConstraints(maxHeight: 600),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
              ),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      widget.item.image,
                      width: 60,
                      height: 60,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          width: 60,
                          height: 60,
                          color: Colors.grey[300],
                          child: const Icon(Icons.restaurant, color: Colors.white),
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.item.name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          _formatPrice(widget.item.price),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close, color: Colors.white),
                  ),
                ],
              ),
            ),
            
            // Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Customizations
                    Text(
                      'Tùy chỉnh món ăn',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _availableCustomizations.map((customization) {
                        final isSelected = _selectedCustomizations.contains(customization);
                        return FilterChip(
                          label: Text(customization),
                          selected: isSelected,
                          onSelected: (selected) {
                            setState(() {
                              if (selected) {
                                _selectedCustomizations.add(customization);
                              } else {
                                _selectedCustomizations.remove(customization);
                              }
                            });
                          },
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 24),
                    
                    // Special note
                    Text(
                      'Ghi chú đặc biệt',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _specialNoteController,
                      decoration: const InputDecoration(
                        hintText: 'Nhập ghi chú đặc biệt...',
                        border: OutlineInputBorder(),
                      ),
                      maxLines: 3,
                    ),
                    const SizedBox(height: 24),
                    
                    // Selected customizations summary
                    if (_selectedCustomizations.isNotEmpty) ...[
                      Text(
                        'Tùy chỉnh đã chọn:',
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _selectedCustomizations.map((customization) {
                          return Chip(
                            label: Text(customization),
                            onDeleted: () {
                              setState(() {
                                _selectedCustomizations.remove(customization);
                              });
                            },
                          );
                        }).toList(),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            
            // Actions
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceVariant,
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(12)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Hủy'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        widget.onConfirm(_selectedCustomizations, _specialNoteController.text.isEmpty ? null : _specialNoteController.text);
                        Navigator.pop(context);
                      },
                      child: const Text('Xác nhận'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
