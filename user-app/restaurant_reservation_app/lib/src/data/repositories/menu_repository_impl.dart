
import 'package:restaurant_reservation_app/src/data/datasources/data_source_adapter_app_user.dart';
import 'package:restaurant_reservation_app/src/domain/entities/menu_item.dart';
import 'package:restaurant_reservation_app/src/domain/repositories/menu_repository.dart';

class MenuRepositoryImpl implements MenuRepository {
  MenuRepositoryImpl();

  @override
  Future<List<MenuItem>> getMenuItems() async {
    final raw = await DataSourceAdapterAppUser.getMenuItems_app_user();
    return raw.map<MenuItem>((item) {
      if (item is MenuItem) return item;
      final map = item as Map<String, dynamic>;
      return MenuItem(
        id: map['id'].toString(),
        name: map['name'] ?? '',
        description: map['description'] ?? '',
        price: (map['price'] as num?)?.toDouble() ?? 0.0,
        imageUrl: map['image'] ?? map['imageUrl'] ?? '',
      );
    }).toList();
  }
}
