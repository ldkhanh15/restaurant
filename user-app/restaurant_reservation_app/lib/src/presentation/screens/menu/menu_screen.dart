import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../application/providers.dart';
import 'package:go_router/go_router.dart';
import '../../../domain/models/menu.dart';
import '../../../domain/models/booking.dart';
import '../../widgets/menu_item_card.dart';
import '../../widgets/cart_bottom_sheet.dart';

class MenuScreen extends ConsumerStatefulWidget {
  final Booking? booking;
  
  const MenuScreen({super.key, this.booking});

  @override
  ConsumerState<MenuScreen> createState() => _MenuScreenState();
}

class _MenuScreenState extends ConsumerState<MenuScreen> {
  String selectedCategory = 'appetizers';
  bool isOrderMode = false;
  String searchQuery = '';
  final TextEditingController _searchController = TextEditingController();


  @override
  Widget build(BuildContext context) {
    final menuCategories = ref.watch(menuCategoriesProvider);
    final cartItems = ref.watch(cartItemsProvider);
    final cartTotal = ref.watch(cartTotalProvider);

    // If menu categories are not yet loaded (empty), show a friendly loading state
    if (menuCategories.isEmpty) {
      return Scaffold(
        appBar: AppBar(
          title: Text(widget.booking != null ? 'Gọi món - ${widget.booking!.tableName}' : 'Thực đơn'),
          actions: [
            IconButton(
              icon: const Icon(Icons.search),
              onPressed: () => _showSearchDialog(),
            ),
            if (widget.booking != null)
              IconButton(
                icon: const Icon(Icons.shopping_cart),
                onPressed: () => _showCartBottomSheet(context),
              ),
          ],
        ),
        body: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

  // Ensure selectedCategory exists in the loaded categories; fallback to first category id
  final effectiveSelectedCategory = menuCategories.any((c) => c.id == selectedCategory)
    ? selectedCategory
    : (menuCategories.isNotEmpty ? menuCategories.first.id : selectedCategory);

  return Scaffold(
      appBar: AppBar(
        title: Text(widget.booking != null ? 'Gọi món - ${widget.booking!.tableName}' : 'Thực đơn'),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => _showSearchDialog(),
          ),
          if (widget.booking != null)
            IconButton(
              icon: const Icon(Icons.shopping_cart),
              onPressed: () => _showCartBottomSheet(context),
            ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
          // Category tabs
          Container(
            height: 50,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: menuCategories.length,
              itemBuilder: (context, index) {
                final category = menuCategories[index];
                final isSelected = selectedCategory == category.id;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(category.name),
                    selected: isSelected,
                    onSelected: (selected) {
                      setState(() {
                        selectedCategory = category.id;
                      });
                    },
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 16),
          
          // Menu items
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
        itemCount: menuCategories
          .firstWhere((cat) => cat.id == effectiveSelectedCategory)
          .items.length,
              itemBuilder: (context, index) {
        final category = menuCategories
          .firstWhere((cat) => cat.id == effectiveSelectedCategory);
                final item = category.items[index];
                return MenuItemCard(
                  item: item,
                  isOrderMode: widget.booking != null,
                  onAddToCart: (item, quantity, customizations, specialNote) {
                    _addToCart(item, quantity, customizations, specialNote);
                  },
                );
              },
            ),
          ),
          ],
        ),
      ),
      bottomNavigationBar: widget.booking != null && cartItems.isNotEmpty
          ? Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 4,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              child: SafeArea(
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${cartItems.length} món',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                          Text(
                            'Tổng: ${_formatPrice(cartTotal)}',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton.icon(
                      onPressed: () => _showCartBottomSheet(context),
                      icon: const Icon(Icons.shopping_cart),
                      label: const Text('Xem giỏ hàng'),
                    ),
                  ],
                ),
              ),
            )
          : null,
    );
  }

  void _addToCart(MenuItem item, int quantity, List<String> customizations, String? specialNote) {
    final cartItem = CartItem(
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: quantity,
      image: item.image,
      customizations: customizations,
      specialNote: specialNote,
    );
    
    ref.read(cartItemsProvider.notifier).addItem(cartItem);
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Đã thêm ${item.name} vào giỏ hàng'),
        action: SnackBarAction(
          label: 'Xem giỏ',
          onPressed: () => _showCartBottomSheet(context),
        ),
      ),
    );
  }

  void _showCartBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => CartBottomSheet(
        booking: widget.booking!,
        onProceedToOrder: () {
          Navigator.pop(context);
          // Navigate to order confirmation screen with booking passed
          context.go('/order-confirmation', extra: widget.booking);
        },
      ),
    );
  }

  String _formatPrice(double price) {
    return '${price.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    )}đ';
  }

  void _showSearchDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Tìm kiếm món ăn'),
        content: TextField(
          controller: _searchController,
          decoration: const InputDecoration(
            hintText: 'Nhập tên món ăn...',
            prefixIcon: Icon(Icons.search),
          ),
          onChanged: (value) {
            setState(() {
              searchQuery = value;
            });
          },
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _searchController.clear();
              setState(() {
                searchQuery = '';
              });
            },
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
            },
            child: const Text('Tìm kiếm'),
          ),
        ],
      ),
    );
  }
}