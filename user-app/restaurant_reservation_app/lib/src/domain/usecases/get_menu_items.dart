
import 'package:restaurant_reservation_app/src/domain/entities/menu_item.dart';
import 'package:restaurant_reservation_app/src/domain/repositories/menu_repository.dart';

class GetMenuItems {
  final MenuRepository repository;

  GetMenuItems(this.repository);

  Future<List<MenuItem>> call() {
    return repository.getMenuItems();
  }
}
