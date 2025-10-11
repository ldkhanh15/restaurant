
import 'package:restaurant_reservation_app/src/domain/entities/menu_item.dart';
import 'package:restaurant_reservation_app/src/domain/entities/reservation.dart';
import 'package:restaurant_reservation_app/src/domain/entities/table.dart';
import 'package:restaurant_reservation_app/src/domain/entities/user.dart';
import 'package:restaurant_reservation_app/src/domain/models/event.dart';
import 'package:restaurant_reservation_app/src/domain/models/notification.dart';
import 'package:restaurant_reservation_app/src/domain/models/review.dart';
import 'package:restaurant_reservation_app/src/domain/models/user.dart' as model_user;
import 'package:restaurant_reservation_app/src/data/mock_data.dart' show MockData;

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

   

  Future<Reservation> updateReservation(String id, Reservation reservation) async {
    await Future.delayed(const Duration(milliseconds: 300));
    final index = _reservations.indexWhere((r) => r.id == id);
    if (index == -1) throw Exception("Reservation not found");

    // Create a new reservation object with the updated fields, keeping the original ID.
    final updatedReservation = Reservation(
      id: id,
      user: reservation.user,
      table: reservation.table,
      dateTime: reservation.dateTime,
      numberOfGuests: reservation.numberOfGuests,
      status: reservation.status,
      createdAt: _reservations[index].createdAt, // Keep original creation date
    );
    _reservations[index] = updatedReservation;
    return updatedReservation;
  }

  Future<Reservation> cancelReservation(String id) async {
    await Future.delayed(const Duration(milliseconds: 300));
    final index = _reservations.indexWhere((r) => r.id == id);
    if (index == -1) throw Exception("Reservation not found");

    final original = _reservations[index];
    final updatedReservation = Reservation(
        id: original.id,
        user: original.user,
        table: original.table,
        dateTime: original.dateTime,
        numberOfGuests: original.numberOfGuests,
        status: 'cancelled', // Update status
        createdAt: original.createdAt);
    _reservations[index] = updatedReservation;
    return updatedReservation;
  }

  Future<Reservation> confirmReservation(String id) async {
    await Future.delayed(const Duration(milliseconds: 300));
    final index = _reservations.indexWhere((r) => r.id == id);
    if (index == -1) throw Exception("Reservation not found");

    final original = _reservations[index];
    final updatedReservation = Reservation(
        id: original.id,
        user: original.user,
        table: original.table,
        dateTime: original.dateTime,
        numberOfGuests: original.numberOfGuests,
        status: 'confirmed', // Update status
        createdAt: original.createdAt);
    _reservations[index] = updatedReservation;
    return updatedReservation;
  }

  Future<Map<String, dynamic>> updateTableStatus(String id, String status) async {
    await Future.delayed(const Duration(milliseconds: 300));
    final isOccupied = status == 'occupied' || status == 'reserved';
    // Since 'isOccupied' is final, we can't directly modify it.
    // This mock function will just return the expected response structure.
    // In a real mutable state, you would replace the table object in the list.
    return {
      'id': id,
      'status': status,
      'isOccupied': isOccupied,
    };
  }

  // --- Additional mock helpers used by the adapter ---
  Future<List<AppNotification>> getNotifications() async {
    await Future.delayed(const Duration(milliseconds: 200));
    return MockData.mockNotifications;
  }

  Future<AppNotification> markNotificationAsRead(String id) async {
    await Future.delayed(const Duration(milliseconds: 150));
    final idx = MockData.mockNotifications.indexWhere((n) => n.id == id);
    if (idx != -1) {
      final n = MockData.mockNotifications[idx];
      final updated = n.copyWith(isRead: true);
      MockData.mockNotifications[idx] = updated;
      return updated;
    }
    throw Exception('Notification not found');
  }

  Future<List<Event>> getEvents() async {
    await Future.delayed(const Duration(milliseconds: 200));
    return MockData.mockEvents;
  }

  Future<Event?> getEventById(String id) async {
    await Future.delayed(const Duration(milliseconds: 150));
    try {
      return MockData.mockEvents.firstWhere((e) => e.id == id);
    } catch (_) {
      return null;
    }
  }

  Future<EventBooking> createEventBooking(EventBooking booking) async {
    await Future.delayed(const Duration(milliseconds: 200));
    final newBooking = EventBooking(
      id: '${MockData.mockEventBookings.length + 1}',
      eventId: booking.eventId,
      eventTitle: booking.eventTitle,
      date: booking.date,
      time: booking.time,
      guests: booking.guests,
      status: booking.status,
      bookingDate: booking.bookingDate,
      notes: booking.notes,
    );
    MockData.mockEventBookings.add(newBooking);
    return newBooking;
  }

  Future<model_user.AppUser> getUserProfile() async {
    await Future.delayed(const Duration(milliseconds: 200));
    return MockData.mockUserProfile;
  }

  Future<model_user.AppUser> updateUserProfile(Map<String, dynamic> payload) async {
    await Future.delayed(const Duration(milliseconds: 200));
    // For mock we just return existing profile merged with payload where possible
    final u = MockData.mockUserProfile;
    final updated = model_user.AppUser(
      id: u.id,
      name: payload['name'] ?? u.name,
      email: payload['email'] ?? u.email,
      phone: payload['phone'] ?? u.phone,
      address: payload['address'] ?? u.address,
      birthDate: u.birthDate,
      joinDate: u.joinDate,
      avatar: payload['avatar'] ?? u.avatar,
      loyaltyPoints: u.loyaltyPoints,
      totalOrders: u.totalOrders,
      favoriteTable: u.favoriteTable,
      membershipTier: u.membershipTier,
    );
    return updated;
  }

  Future<List<Review>> getReviews() async {
    await Future.delayed(const Duration(milliseconds: 200));
    return MockData.mockReviews;
  }

  Future<Review> createReview(Review review) async {
    await Future.delayed(const Duration(milliseconds: 200));
    final newReview = Review(
      id: '${MockData.mockReviews.length + 1}',
      customerId: review.customerId,
      customerName: review.customerName,
      customerAvatar: review.customerAvatar,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt ?? DateTime.now(),
      type: review.type,
      status: ReviewStatus.pending,
      helpfulCount: review.helpfulCount,
      restaurantResponse: review.restaurantResponse,
      responseDate: review.responseDate,
      orderId: review.orderId,
    );
    MockData.mockReviews.add(newReview);
    return newReview;
  }



}
