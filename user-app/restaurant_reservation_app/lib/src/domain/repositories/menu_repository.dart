
import 'package:restaurant_reservation_app/src/domain/entities/menu_item.dart';

abstract class MenuRepository {
  Future<List<MenuItem>> getMenuItems();
}
