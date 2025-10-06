import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app_user_service_app_user.dart';
import '../../application/providers.dart';
import '../../domain/models/menu.dart';
import '../../domain/models/table.dart';

/// Initialize app data for the mobile app by fetching from backend app_user endpoints.
/// Call this early in the app (for example in a top-level widget's initState or from main
/// after setting ApiConfig.baseUrl). This file is new and has the `_app_user` suffix.
Future<void> initializeAppUserData_app_user(WidgetRef ref) async {
  try {
    // Fetch menu categories (we'll convert menu items into categories simply)
    final menuItems = await AppUserServiceAppUser.fetchMenuItems();
    // menuItems expected as List<Map<String,dynamic>>; group into categories by categoryId
    final Map<String, List<dynamic>> groups = {};
    for (final item in menuItems) {
      final map = item as Map<String, dynamic>;
      final cat = (map['categoryId'] ?? map['category'] ?? 'default').toString();
      groups.putIfAbsent(cat, () => []).add(map);
    }

    final categories = groups.entries.map((e) {
      return MenuCategory(
        id: e.key,
        name: e.key,
        items: e.value.map((m) {
          final map = m as Map<String, dynamic>;
          return MenuItem(
            id: int.tryParse(map['id']?.toString() ?? '') ?? 0,
            name: (map['name'] ?? '') as String,
            description: (map['description'] ?? '') as String,
            price: (map['price'] is num) ? (map['price'] as num).toDouble() : double.tryParse((map['price'] ?? '0').toString()) ?? 0.0,
            image: (map['image'] ?? map['imageUrl'] ?? '') as String,
            rating: (map['rating'] is num) ? (map['rating'] as num).toDouble() : 0.0,
            popular: (map['popular'] ?? false) as bool,
            categoryId: e.key,
          );
        }).toList(),
      );
    }).toList();

    // Set menu categories into provider
    ref.read(menuCategoriesProvider.notifier).setCategories(categories);

    // Fetch tables
    final tablesRaw = await AppUserServiceAppUser.fetchTables();
    final tables = tablesRaw.map((t) {
      final map = t as Map<String, dynamic>;
      return DiningTable(
        id: (map['id'] is int) ? map['id'] as int : int.tryParse((map['id'] ?? '0').toString()) ?? 0,
        name: (map['name'] ?? 'Table') as String,
        capacity: (map['capacity'] is int) ? map['capacity'] as int : int.tryParse((map['capacity'] ?? '0').toString()) ?? 0,
        location: (map['location'] ?? '') as String,
        price: (map['price'] is num) ? (map['price'] as num).toDouble() : double.tryParse((map['price'] ?? '0').toString()) ?? 0.0,
        status: (map['status']?.toString() == 'available') ? TableStatus.available : (map['status']?.toString() == 'reserved' ? TableStatus.reserved : TableStatus.occupied),
        type: TableType.values.firstWhere((e) => e.name == (map['type'] ?? 'regular'), orElse: () => TableType.regular),
      );
    }).toList();

    ref.read(tablesProvider.notifier).setTables(tables);
  } catch (e, st) {
    // Log error so developer can see why initialization failed. App will continue using mock data.
    // In production you may want to surface this differently.
    // ignore: avoid_print
    print('initializeAppUserData_app_user failed: $e');
    // ignore: avoid_print
    print(st);
  }
}
