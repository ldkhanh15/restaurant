
import 'package:restaurant_reservation_app/src/domain/entities/menu_item.dart';
import 'package:restaurant_reservation_app/src/domain/entities/reservation.dart';
import 'package:restaurant_reservation_app/src/domain/entities/table.dart';
import 'package:restaurant_reservation_app/src/domain/entities/user.dart';

class MockDataSource {
  // Sample Users
  final _user1 = User(id: 'user-001', name: 'John Doe', email: 'john.doe@example.com');
  final _user2 = User(id: 'user-002', name: 'Jane Smith', email: 'jane.smith@example.com');

  // Sample Tables
  final _table1 = Table(id: 't-001', tableNumber: 1, capacity: 4, isOccupied: false);
  final _table2 = Table(id: 't-002', tableNumber: 2, capacity: 2, isOccupied: true);
  final _table3 = Table(id: 't-003', tableNumber: 3, capacity: 6, isOccupied: false);

  // Sample Menu Items
  final _menuItem1 = MenuItem(
    id: 'm-001',
    name: 'Classic Burger',
    description: 'A juicy beef patty with lettuce, tomato, and our special sauce.',
    price: 12.99,
    imageUrl: 'https://via.placeholder.com/150',
  );
  final _menuItem2 = MenuItem(
    id: 'm-002',
    name: 'Caesar Salad',
    description: 'Crisp romaine lettuce with parmesan cheese, croutons, and Caesar dressing.',
    price: 9.99,
    imageUrl: 'https://via.placeholder.com/150',
  );
  final _menuItem3 = MenuItem(
    id: 'm-003',
    name: 'Spaghetti Carbonara',
    description: 'Pasta with a creamy sauce, pancetta, and a sprinkle of black pepper.',
    price: 15.50,
    imageUrl: 'https://via.placeholder.com/150',
  );

  late final List<Reservation> _reservations;

  MockDataSource() {
    _reservations = [
      Reservation(
        id: 'res-001',
        user: _user2,
        table: _table2,
        dateTime: DateTime.now().add(const Duration(hours: 1)),
        numberOfGuests: 2,
      ),
    ];
  }

  Future<List<User>> getUsers() async {
    await Future.delayed(const Duration(milliseconds: 300));
    return [_user1, _user2];
  }

  Future<List<Table>> getTables() async {
    await Future.delayed(const Duration(milliseconds: 300));
    return [_table1, _table2, _table3];
  }

  Future<List<MenuItem>> getMenuItems() async {
    await Future.delayed(const Duration(milliseconds: 300));
    return [_menuItem1, _menuItem2, _menuItem3];
  }

  Future<List<Reservation>> getReservations() async {
    await Future.delayed(const Duration(milliseconds: 300));
    return _reservations;
  }

  Future<Reservation> createReservation(Reservation reservation) async {
    await Future.delayed(const Duration(milliseconds: 300));
    final newReservation = Reservation(
      id: 'res-00${_reservations.length + 1}',
      user: reservation.user,
      table: reservation.table,
      dateTime: reservation.dateTime,
      numberOfGuests: reservation.numberOfGuests,
    );
    _reservations.add(newReservation);
    // In a real scenario, you would also update the table's isOccupied status
    return newReservation;
  }
}
