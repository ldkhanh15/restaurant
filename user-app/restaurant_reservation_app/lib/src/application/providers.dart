import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/models/booking.dart';
import '../domain/models/table.dart';
import '../domain/models/menu.dart';
import '../domain/models/order.dart';
import '../domain/models/user.dart';
import '../domain/models/event.dart';
import '../domain/models/notification.dart';
import '../domain/models/loyalty.dart';
import '../domain/models/payment.dart';
import '../domain/models/review.dart';
import '../domain/models/voucher.dart';
import '../data/mock_data.dart';
import '../data/datasources/api_config.dart';

// User Provider
final userProvider = StateNotifierProvider<UserNotifier, AppUser?>((ref) => ApiConfig.baseUrl.isEmpty ? (UserNotifier()..setUser(MockData.mockUserProfile)) : UserNotifier());

// Table Providers
final tablesProvider = StateNotifierProvider<TablesNotifier, List<DiningTable>>((ref) => ApiConfig.baseUrl.isEmpty ? (TablesNotifier()..setTables(MockData.tables)) : TablesNotifier());
final selectedTableProvider = StateNotifierProvider<SelectedTableNotifier, DiningTable?>((ref) => SelectedTableNotifier());

// Booking Providers
final bookingsProvider = StateNotifierProvider<BookingsNotifier, List<Booking>>((ref) => ApiConfig.baseUrl.isEmpty ? (BookingsNotifier()..setBookings(MockData.mockBookings)) : BookingsNotifier());
final selectedBookingProvider = StateNotifierProvider<SelectedBookingNotifier, Booking?>((ref) => SelectedBookingNotifier());

// Menu Providers
final menuCategoriesProvider = StateNotifierProvider<MenuCategoriesNotifier, List<MenuCategory>>((ref) => ApiConfig.baseUrl.isEmpty ? (MenuCategoriesNotifier()..setCategories(MockData.menuCategories)) : MenuCategoriesNotifier());
final selectedCategoryProvider = StateNotifierProvider<SelectedCategoryNotifier, String>((ref) => SelectedCategoryNotifier());

// Cart Providers
final cartItemsProvider = StateNotifierProvider<CartItemsNotifier, List<CartItem>>((ref) => CartItemsNotifier());
final cartTotalProvider = Provider<double>((ref) {
  final cartItems = ref.watch(cartItemsProvider);
  return cartItems.fold(0.0, (sum, item) => sum + item.totalPrice);
});

// Order Providers
final currentOrderProvider = StateNotifierProvider<CurrentOrderNotifier, Order?>((ref) => CurrentOrderNotifier());
final orderItemsProvider = StateNotifierProvider<OrderItemsNotifier, List<OrderItem>>((ref) => OrderItemsNotifier());
final orderHistoryProvider = StateNotifierProvider<OrderHistoryNotifier, List<Order>>((ref) => ApiConfig.baseUrl.isEmpty ? (OrderHistoryNotifier()..setOrders(MockData.mockOrderHistory)) : OrderHistoryNotifier());

// Event Providers
final eventsProvider = StateNotifierProvider<EventsNotifier, List<Event>>((ref) => ApiConfig.baseUrl.isEmpty ? (EventsNotifier()..setEvents(MockData.mockEvents)) : EventsNotifier());
final eventBookingsProvider = StateNotifierProvider<EventBookingsNotifier, List<EventBooking>>((ref) => ApiConfig.baseUrl.isEmpty ? (EventBookingsNotifier()..setBookings(MockData.mockEventBookings)) : EventBookingsNotifier());
final selectedEventProvider = StateNotifierProvider<SelectedEventNotifier, Event?>((ref) => SelectedEventNotifier());

// Notification Providers
final notificationsProvider = StateNotifierProvider<NotificationsNotifier, List<AppNotification>>((ref) => ApiConfig.baseUrl.isEmpty ? (NotificationsNotifier()..setNotifications(MockData.mockNotifications)) : NotificationsNotifier());
final unreadNotificationsProvider = Provider<int>((ref) {
  final notifications = ref.watch(notificationsProvider);
  return notifications.where((n) => !n.isRead).length;
});

// Loyalty Providers
final loyaltyPointsProvider = StateNotifierProvider<LoyaltyPointsNotifier, int>((ref) => ApiConfig.baseUrl.isEmpty ? (LoyaltyPointsNotifier()..setPoints(MockData.mockUserProfile.loyaltyPoints)) : LoyaltyPointsNotifier());
final membershipTierProvider = StateNotifierProvider<MembershipTierNotifier, String>((ref) => ApiConfig.baseUrl.isEmpty ? (MembershipTierNotifier()..setTier(MockData.mockUserProfile.membershipTier)) : MembershipTierNotifier());
final rewardsProvider = StateNotifierProvider<RewardsNotifier, List<Reward>>((ref) => ApiConfig.baseUrl.isEmpty ? (RewardsNotifier()..setRewards(MockData.mockRewards)) : RewardsNotifier());
final pointHistoryProvider = StateNotifierProvider<PointHistoryNotifier, List<PointHistory>>((ref) => ApiConfig.baseUrl.isEmpty ? (PointHistoryNotifier()..setHistory(MockData.mockPointHistory)) : PointHistoryNotifier());

// Payment Providers
final paymentMethodsProvider = StateNotifierProvider<PaymentMethodsNotifier, List<PaymentMethod>>((ref) => ApiConfig.baseUrl.isEmpty ? (PaymentMethodsNotifier()..setMethods(MockData.mockPaymentMethods)) : PaymentMethodsNotifier());
final selectedPaymentMethodProvider = StateNotifierProvider<SelectedPaymentMethodNotifier, PaymentMethod?>((ref) => SelectedPaymentMethodNotifier());
final paymentStatusProvider = StateNotifierProvider<PaymentStatusNotifier, PaymentStatus>((ref) => PaymentStatusNotifier());

// Kitchen Status Provider
final kitchenStatusProvider = StateNotifierProvider<KitchenStatusNotifier, Map<int, KitchenStatus>>((ref) => KitchenStatusNotifier());

// Chat Providers
final chatMessagesProvider = StateNotifierProvider<ChatMessagesNotifier, List<Map<String, dynamic>>>((ref) => ChatMessagesNotifier());
final isTypingProvider = StateNotifierProvider<IsTypingNotifier, bool>((ref) => IsTypingNotifier());

// AI Chat Providers
final aiChatMessagesProvider = StateNotifierProvider<AIChatMessagesNotifier, List<Map<String, dynamic>>>((ref) => AIChatMessagesNotifier());
final isAITypingProvider = StateNotifierProvider<IsAITypingNotifier, bool>((ref) => IsAITypingNotifier());
final isAIChatOpenProvider = StateNotifierProvider<IsAIChatOpenNotifier, bool>((ref) => IsAIChatOpenNotifier());

// Notifier Classes
class UserNotifier extends StateNotifier<AppUser?> {
  UserNotifier() : super(null);
  
  void setUser(AppUser user) => state = user;
  void clearUser() => state = null;
}

class TablesNotifier extends StateNotifier<List<DiningTable>> {
  TablesNotifier() : super([]);
  
  void setTables(List<DiningTable> tables) => state = tables;
  void addTable(DiningTable table) => state = [...state, table];
  void updateTable(DiningTable table) {
    state = state.map((t) => t.id == table.id ? table : t).toList();
  }
}

class SelectedTableNotifier extends StateNotifier<DiningTable?> {
  SelectedTableNotifier() : super(null);
  
  void selectTable(DiningTable table) => state = table;
  void clearSelection() => state = null;
}

class BookingsNotifier extends StateNotifier<List<Booking>> {
  BookingsNotifier() : super([]);
  
  void setBookings(List<Booking> bookings) => state = bookings;
  void addBooking(Booking booking) => state = [...state, booking];
  void updateBooking(Booking booking) {
    state = state.map((b) => b.id == booking.id ? booking : b).toList();
  }
}

class SelectedBookingNotifier extends StateNotifier<Booking?> {
  SelectedBookingNotifier() : super(null);
  
  void selectBooking(Booking booking) => state = booking;
  void clearSelection() => state = null;
}

class MenuCategoriesNotifier extends StateNotifier<List<MenuCategory>> {
  MenuCategoriesNotifier() : super([]);
  
  void setCategories(List<MenuCategory> categories) => state = categories;
}

class SelectedCategoryNotifier extends StateNotifier<String> {
  SelectedCategoryNotifier() : super('appetizers');
  
  void selectCategory(String category) => state = category;
}

class CartItemsNotifier extends StateNotifier<List<CartItem>> {
  CartItemsNotifier() : super([]);
  
  void addItem(CartItem item) => state = [...state, item];
  void removeItem(int itemId) => state = state.where((item) => item.id != itemId).toList();
  void updateItem(CartItem item) {
    state = state.map((i) => i.id == item.id ? item : i).toList();
  }
  void clearCart() => state = [];
}

class CurrentOrderNotifier extends StateNotifier<Order?> {
  CurrentOrderNotifier() : super(null);
  
  void setOrder(Order order) => state = order;
  void clearOrder() => state = null;
}

class OrderItemsNotifier extends StateNotifier<List<OrderItem>> {
  OrderItemsNotifier() : super([]);
  
  void setItems(List<OrderItem> items) => state = items;
  void updateItem(OrderItem item) {
    state = state.map((i) => i.id == item.id ? item : i).toList();
  }
}

class OrderHistoryNotifier extends StateNotifier<List<Order>> {
  OrderHistoryNotifier() : super([]);
  
  void setOrders(List<Order> orders) => state = orders;
  void addOrder(Order order) => state = [...state, order];
}

class EventsNotifier extends StateNotifier<List<Event>> {
  EventsNotifier() : super([]);
  
  void setEvents(List<Event> events) => state = events;
}

class EventBookingsNotifier extends StateNotifier<List<EventBooking>> {
  EventBookingsNotifier() : super([]);
  
  void setBookings(List<EventBooking> bookings) => state = bookings;
  void addBooking(EventBooking booking) => state = [...state, booking];
}

class SelectedEventNotifier extends StateNotifier<Event?> {
  SelectedEventNotifier() : super(null);
  
  void selectEvent(Event event) => state = event;
  void clearSelection() => state = null;
}

class NotificationsNotifier extends StateNotifier<List<AppNotification>> {
  NotificationsNotifier() : super([]);
  
  void setNotifications(List<AppNotification> notifications) => state = notifications;
  void markAsRead(String notificationId) {
    state = state.map((n) => n.id == notificationId ? n.copyWith(isRead: true) : n).toList();
  }
  void markAllAsRead() {
    state = state.map((n) => n.copyWith(isRead: true)).toList();
  }
}

class LoyaltyPointsNotifier extends StateNotifier<int> {
  LoyaltyPointsNotifier() : super(0);
  
  void setPoints(int points) => state = points;
  void addPoints(int points) => state += points;
  void deductPoints(int points) => state = (state - points).clamp(0, double.infinity).toInt();
}

class MembershipTierNotifier extends StateNotifier<String> {
  MembershipTierNotifier() : super('Regular');
  
  void setTier(String tier) => state = tier;
}

class RewardsNotifier extends StateNotifier<List<Reward>> {
  RewardsNotifier() : super([]);
  
  void setRewards(List<Reward> rewards) => state = rewards;
}

class PointHistoryNotifier extends StateNotifier<List<PointHistory>> {
  PointHistoryNotifier() : super([]);
  
  void setHistory(List<PointHistory> history) => state = history;
  void addTransaction(PointHistory transaction) => state = [...state, transaction];
}

class PaymentMethodsNotifier extends StateNotifier<List<PaymentMethod>> {
  PaymentMethodsNotifier() : super([]);
  
  void setMethods(List<PaymentMethod> methods) => state = methods;
}

class SelectedPaymentMethodNotifier extends StateNotifier<PaymentMethod?> {
  SelectedPaymentMethodNotifier() : super(null);
  
  void selectMethod(PaymentMethod method) => state = method;
  void clearSelection() => state = null;
}

class PaymentStatusNotifier extends StateNotifier<PaymentStatus> {
  PaymentStatusNotifier() : super(PaymentStatus.pending);
  
  void setStatus(PaymentStatus status) => state = status;
}

class KitchenStatusNotifier extends StateNotifier<Map<int, KitchenStatus>> {
  KitchenStatusNotifier() : super({});
  
  void updateStatus(int itemId, KitchenStatus status) {
    state = {...state, itemId: status};
  }
}

class ChatMessagesNotifier extends StateNotifier<List<Map<String, dynamic>>> {
  ChatMessagesNotifier() : super([]);
  
  void addMessage(Map<String, dynamic> message) => state = [...state, message];
  void clearMessages() => state = [];
}

class IsTypingNotifier extends StateNotifier<bool> {
  IsTypingNotifier() : super(false);
  
  void setTyping(bool typing) => state = typing;
}

class AIChatMessagesNotifier extends StateNotifier<List<Map<String, dynamic>>> {
  AIChatMessagesNotifier() : super([]);
  
  void addMessage(Map<String, dynamic> message) => state = [...state, message];
  void clearMessages() => state = [];
}

class IsAITypingNotifier extends StateNotifier<bool> {
  IsAITypingNotifier() : super(false);
  
  void setTyping(bool typing) => state = typing;
}

class IsAIChatOpenNotifier extends StateNotifier<bool> {
  IsAIChatOpenNotifier() : super(false);
  
  void toggle() => state = !state;
  void open() => state = true;
  void close() => state = false;
}

// Review Providers
final reviewsProvider = StateNotifierProvider<ReviewsNotifier, List<Review>>((ref) => ReviewsNotifier()..setReviews(MockData.mockReviews));

class ReviewsNotifier extends StateNotifier<List<Review>> {
  ReviewsNotifier() : super([]);

  void setReviews(List<Review> reviews) {
    state = reviews;
  }

  void addReview(Review review) {
    state = [...state, review];
  }

  void updateReview(Review updatedReview) {
    state = state.map((review) => 
      review.id == updatedReview.id ? updatedReview : review
    ).toList();
  }

  void markHelpful(String reviewId) {
    state = state.map((review) => 
      review.id == reviewId 
        ? review.copyWith(helpfulCount: review.helpfulCount + 1)
        : review
    ).toList();
  }
}

// Voucher Providers
final vouchersProvider = StateNotifierProvider<VouchersNotifier, List<Voucher>>((ref) => VouchersNotifier()..setVouchers(MockData.mockVouchers));

class VouchersNotifier extends StateNotifier<List<Voucher>> {
  VouchersNotifier() : super([]);

  void setVouchers(List<Voucher> vouchers) {
    state = vouchers;
  }

  void addVoucher(Voucher voucher) {
    state = [...state, voucher];
  }

  void useVoucher(String voucherId, String orderId) {
    state = state.map((voucher) => 
      voucher.id == voucherId 
        ? voucher.copyWith(
            status: VoucherStatus.used,
            usedAt: DateTime.now(),
            orderId: orderId,
          )
        : voucher
    ).toList();
  }

  List<Voucher> get activeVouchers => state.where((v) => v.isValid).toList();
  List<Voucher> get usedVouchers => state.where((v) => v.status == VoucherStatus.used).toList();
  List<Voucher> get expiredVouchers => state.where((v) => v.isExpired).toList();
}
