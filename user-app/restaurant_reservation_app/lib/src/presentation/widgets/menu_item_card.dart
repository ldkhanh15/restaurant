import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../domain/models/menu.dart';
import 'customization_dialog.dart';
import '../screens/menu/dish_detail_screen.dart';

class MenuItemCard extends StatefulWidget {
  final MenuItem item;
  final bool isOrderMode;
  final Function(MenuItem, int, List<String>, String?) onAddToCart;

  const MenuItemCard({
    super.key,
    required this.item,
    required this.isOrderMode,
    required this.onAddToCart,
  });

  @override
  State<MenuItemCard> createState() => _MenuItemCardState();
}

class _MenuItemCardState extends State<MenuItemCard> {
  int quantity = 1;

  String _formatPrice(double price) {
    return '${price.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    )}đ';
  }

  Widget _buildStars(double rating) {
    return Row(
      children: List.generate(5, (index) {
        return Icon(
          index < rating.floor() ? Icons.star : Icons.star_border,
          size: 16,
          color: Colors.amber,
        );
      }),
    );
  }

  void _showCustomizationDialog() {
    showDialog(
      context: context,
      builder: (context) => CustomizationDialog(
        item: widget.item,
        onConfirm: (customizations, specialNote) {
          widget.onAddToCart(widget.item, quantity, customizations, specialNote);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
            onTap: !widget.isOrderMode
            ? () {
                // Show detail as a popup so we keep the underlying menu list active.
                showDishDetailPopup(context, widget.item);
              }
            : null,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            AspectRatio(
              aspectRatio: 16 / 9,
              child: Image.network(
                widget.item.image,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    color: Colors.grey[300],
                    child: const Icon(Icons.restaurant, size: 50),
                  );
                },
              ),
            ),
            
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title and rating
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          widget.item.name,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      if (widget.item.popular)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.red,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text(
                            'Phổ biến',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  
                  // Rating
                  Row(
                    children: [
                      _buildStars(widget.item.rating),
                      const SizedBox(width: 8),
                      Text(
                        '${widget.item.rating}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  
                  // Description
                  Text(
                    widget.item.description,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  // Price and action
                  Row(
                    children: [
                      Text(
                        _formatPrice(widget.item.price),
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                      ),
                      const Spacer(),
                      if (widget.isOrderMode) ...[
                        // Quantity controls
                        Row(
                          children: [
                            IconButton(
                              onPressed: quantity > 1 ? () => setState(() => quantity--) : null,
                              icon: const Icon(Icons.remove),
                              style: IconButton.styleFrom(
                                backgroundColor: Theme.of(context).colorScheme.surfaceVariant,
                              ),
                            ),
                            Container(
                              width: 40,
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              child: Text(
                                quantity.toString(),
                                textAlign: TextAlign.center,
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                            ),
                            IconButton(
                              onPressed: () => setState(() => quantity++),
                              icon: const Icon(Icons.add),
                              style: IconButton.styleFrom(
                                backgroundColor: Theme.of(context).colorScheme.primary,
                                foregroundColor: Colors.white,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          onPressed: _showCustomizationDialog,
                          child: const Text('Thêm'),
                        ),
                      ] else if (!widget.isOrderMode)
                        ElevatedButton(
                          onPressed: () {
                            showDishDetailPopup(context, widget.item);
                          },
                          child: const Text('Xem chi tiết'),
                        ),
                    ],
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