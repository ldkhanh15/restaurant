import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:convert';
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
import '../data/repositories/user_repository.dart';
import '../data/repositories/notification_repository.dart';
import '../data/repositories/review_repository.dart';
import '../data/services/voucher_app_user_service_app_user.dart';
import '../data/services/blog_app_user_service.dart';
import '../domain/models/blog.dart';
import '../data/datasources/api_config.dart';
import '../data/datasources/http_client_app_user.dart';
import '../data/services/order_app_user_service_app_user.dart';
import '../data/services/reservation_app_user_service_app_user.dart';

// --- Core Service Providers ---

/// Provides a singleton instance of [HttpClientAppUser] for the entire app.
/// This ensures all API calls use the same client, which is configured with the auth token.
final httpClientProvider = Provider<HttpClientAppUser>((ref) {
  return HttpClientAppUser();
});

/// Provides the [VoucherAppUserService], injecting the authenticated http client.
final voucherServiceProvider = Provider<VoucherAppUserService>((ref) => VoucherAppUserService(ref.watch(httpClientProvider)));

// User Provider
final userProvider = StateNotifierProvider<UserNotifier, AppUser?>((ref) =>
    ApiConfig.baseUrl.isEmpty
        ? (UserNotifier()..setUser(MockData.mockUserProfile))
        : UserNotifier());

// Table Providers
final tablesProvider = StateNotifierProvider<TablesNotifier, List<DiningTable>>(
    (ref) => ApiConfig.baseUrl.isEmpty
        ? (TablesNotifier()..setTables(MockData.tables))
        : TablesNotifier());
final selectedTableProvider =
    StateNotifierProvider<SelectedTableNotifier, DiningTable?>(
        (ref) => SelectedTableNotifier());

// Booking Providers
final bookingsProvider = StateNotifierProvider<BookingsNotifier, List<Booking>>(
    (ref) => ApiConfig.baseUrl.isEmpty
        ? (BookingsNotifier()..setBookings(MockData.mockBookings))
        : BookingsNotifier());
final selectedBookingProvider =
    StateNotifierProvider<SelectedBookingNotifier, Booking?>(
        (ref) => SelectedBookingNotifier());

// Menu Providers
final menuCategoriesProvider =
    StateNotifierProvider<MenuCategoriesNotifier, List<MenuCategory>>((ref) =>
        ApiConfig.baseUrl.isEmpty
            ? (MenuCategoriesNotifier()..setCategories(MockData.menuCategories))
            : MenuCategoriesNotifier());
final selectedCategoryProvider =
    StateNotifierProvider<SelectedCategoryNotifier, String>(
        (ref) => SelectedCategoryNotifier());

// Cart Providers
final cartItemsProvider =
    StateNotifierProvider<CartItemsNotifier, List<CartItem>>(
        (ref) => CartItemsNotifier());
final cartTotalProvider = Provider<double>((ref) {
  final cartItems = ref.watch(cartItemsProvider);
  return cartItems.fold(0.0, (sum, item) => sum + item.totalPrice);
});

// Order Providers
final currentOrderProvider =
    StateNotifierProvider<CurrentOrderNotifier, Order?>(
        (ref) => CurrentOrderNotifier());
final orderItemsProvider =
    StateNotifierProvider<OrderItemsNotifier, List<OrderItem>>(
        (ref) => OrderItemsNotifier());
final orderHistoryProvider =
    StateNotifierProvider<OrderHistoryNotifier, List<Order>>((ref) =>
        ApiConfig.baseUrl.isEmpty
            ? (OrderHistoryNotifier()..setOrders(MockData.mockOrderHistory))
            : OrderHistoryNotifier());

// Event Providers
final eventsProvider = StateNotifierProvider<EventsNotifier, List<Event>>(
    (ref) => ApiConfig.baseUrl.isEmpty
        ? (EventsNotifier()..setEvents(MockData.mockEvents))
        : EventsNotifier());

/// Blogs (FutureProvider) - fetch latest blog posts from backend
final blogsProvider = FutureProvider<List<Blog>>((ref) async {
  if (ApiConfig.baseUrl.isEmpty) return <Blog>[];
  final svc = BlogAppUserService(ApiConfig.baseUrl);
  return svc.fetchBlogs();
});
final eventBookingsProvider =
    StateNotifierProvider<EventBookingsNotifier, List<EventBooking>>((ref) =>
        ApiConfig.baseUrl.isEmpty
            ? (EventBookingsNotifier()..setBookings(MockData.mockEventBookings))
            : EventBookingsNotifier());
final selectedEventProvider =
    StateNotifierProvider<SelectedEventNotifier, Event?>(
        (ref) => SelectedEventNotifier());

// Notification Providers
final notificationsProvider =
    StateNotifierProvider<NotificationsNotifier, List<AppNotification>>((ref) =>
        ApiConfig.baseUrl.isEmpty
            ? (NotificationsNotifier()
              ..setNotifications(MockData.mockNotifications))
            : NotificationsNotifier());
final unreadNotificationsProvider = Provider<int>((ref) {
  final notifications = ref.watch(notificationsProvider);
  return notifications.where((n) => !n.isRead).length;
});

// Loyalty Providers
final loyaltyPointsProvider = StateNotifierProvider<LoyaltyPointsNotifier, int>(
    (ref) => ApiConfig.baseUrl.isEmpty
        ? (LoyaltyPointsNotifier()
          ..setPoints(MockData.mockUserProfile.loyaltyPoints))
        : LoyaltyPointsNotifier());
final membershipTierProvider =
    StateNotifierProvider<MembershipTierNotifier, String>((ref) =>
        ApiConfig.baseUrl.isEmpty
            ? (MembershipTierNotifier()
              ..setTier(MockData.mockUserProfile.membershipTier))
            : MembershipTierNotifier());
final rewardsProvider = StateNotifierProvider<RewardsNotifier, List<Reward>>(
    (ref) => ApiConfig.baseUrl.isEmpty
        ? (RewardsNotifier()..setRewards(MockData.mockRewards))
        : RewardsNotifier());
final pointHistoryProvider =
    StateNotifierProvider<PointHistoryNotifier, List<PointHistory>>((ref) =>
        ApiConfig.baseUrl.isEmpty
            ? (PointHistoryNotifier()..setHistory(MockData.mockPointHistory))
            : PointHistoryNotifier());

// Payment Providers
final paymentMethodsProvider =
    StateNotifierProvider<PaymentMethodsNotifier, List<PaymentMethod>>((ref) =>
        ApiConfig.baseUrl.isEmpty
            ? (PaymentMethodsNotifier()
              ..setMethods(MockData.mockPaymentMethods))
            : PaymentMethodsNotifier());
final selectedPaymentMethodProvider =
    StateNotifierProvider<SelectedPaymentMethodNotifier, PaymentMethod?>(
        (ref) => SelectedPaymentMethodNotifier());
final paymentStatusProvider =
    StateNotifierProvider<PaymentStatusNotifier, PaymentStatus>(
        (ref) => PaymentStatusNotifier());

// Kitchen Status Provider
final kitchenStatusProvider =
    StateNotifierProvider<KitchenStatusNotifier, Map<int, KitchenStatus>>(
        (ref) => KitchenStatusNotifier());

// Chat Providers
final chatMessagesProvider =
    StateNotifierProvider<ChatMessagesNotifier, List<Map<String, dynamic>>>(
        (ref) => ChatMessagesNotifier());
final isTypingProvider =
    StateNotifierProvider<IsTypingNotifier, bool>((ref) => IsTypingNotifier());

// AI Chat Providers
final aiChatMessagesProvider =
    StateNotifierProvider<AIChatMessagesNotifier, List<Map<String, dynamic>>>(
        (ref) => AIChatMessagesNotifier());
final isAITypingProvider = StateNotifierProvider<IsAITypingNotifier, bool>(
    (ref) => IsAITypingNotifier());
final isAIChatOpenProvider = StateNotifierProvider<IsAIChatOpenNotifier, bool>(
    (ref) => IsAIChatOpenNotifier());

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
  void removeItem(int itemId) =>
      state = state.where((item) => item.id != itemId).toList();
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

  // Keep the last raw JSON response for debug purposes (not part of the exported state)
  List<dynamic> _lastRawOrders = [];
  List<dynamic> get lastRawOrders => _lastRawOrders;

  void setOrders(List<Order> orders) => state = orders;
  void addOrder(Order order) => state = [...state, order];

  /// Fetch orders for current user from backend and populate state.
  Future<void> fetchFromServer() async {
    try {
      // If no backend configured, do nothing (mock data already provided)
      if (ApiConfig.baseUrl.isEmpty) return;
      final raw = await OrderAppUserService.fetchOrdersForUser(page: 1, limit: 100);
      // Debug: log the raw response length to help troubleshooting
      try {
        // ignore: avoid_print
        print('[OrderHistoryNotifier] fetched raw orders length=${raw.length}');
        // store raw for UI debug
        _lastRawOrders = raw;
        if (raw.isNotEmpty) {
          try {
            // Print the first raw order JSON for debugging
            // ignore: avoid_print
            print('[OrderHistoryNotifier] sample order JSON: ${jsonEncode(raw.first)}');
          } catch (_) {}
        }
      } catch (_) {}
      var orders = raw.map<Order>((e) => Order.fromJson(e as Map<String, dynamic>)).toList();

      // Post-process: for orders that have empty items but reference a reservation id,
      // try to fetch the reservation and synthesize items from reservation.pre_order_items
      // so the UI (both past and current tabs) sees correct item counts/totals.
      try {
        final futures = <Future<void>>[];
        for (var i = 0; i < orders.length; i++) {
          final o = orders[i];
          if (o.items.isEmpty) {
            // try to find reservation id in the raw payload for this order
            try {
              final candidateRaw = raw.firstWhere((r) {
                if (r is Map && (r['id']?.toString() == o.id || r['order_id']?.toString() == o.id)) return true;
                // reservation wrapper
                if (r is Map && r['reservation'] is Map) {
                  final res = r['reservation'];
                  final rid = res['id'] ?? res['reservation_id'] ?? res['bookingId'];
                  return rid != null && rid.toString() == o.id;
                }
                return false;
              }, orElse: () => null);

              String? rid;
              if (candidateRaw is Map) {
                rid = candidateRaw['reservation_id']?.toString() ?? candidateRaw['reservationId']?.toString();
                if (rid == null && candidateRaw['reservation'] is Map) {
                  final rmap = candidateRaw['reservation'] as Map;
                  rid = (rmap['id'] ?? rmap['reservation_id'] ?? rmap['bookingId'])?.toString();
                }
              }

              if (rid != null && rid.isNotEmpty) {
                // schedule a fetch and synthesis
                futures.add(ReservationAppUserServiceAppUser.fetchReservationById(rid).then((resMap) {
                  try {
                    final po = resMap['pre_order_items'] ?? resMap['preOrderItems'] ?? (resMap['data'] is Map ? resMap['data']['pre_order_items'] : null);
                    if (po != null) {
                      final built = Order.buildFromPreOrder(po);
                      if (built.isNotEmpty) {
                        final subtotalComputed = built.fold<double>(0.0, (s, it) => s + it.price * it.quantity);
                        final updated = orders[i].copyWith(items: built, subtotal: subtotalComputed, total: subtotalComputed + orders[i].serviceCharge + orders[i].tax);
                        orders[i] = updated;
                      }
                    }
                  } catch (_) {}
                }).catchError((_) {}));
              }
            } catch (_) {}
          }
        }
        if (futures.isNotEmpty) await Future.wait(futures);
      } catch (_) {}

      state = orders;
    } catch (e) {
      // Log and rethrow so UI callers (like the Account screen) can surface the error.
      // ignore: avoid_print
      print('[OrderHistoryNotifier] fetch error: $e');
      rethrow;
    }
  }
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

  void setNotifications(List<AppNotification> notifications) =>
      state = notifications;
  void markAsRead(String notificationId) {
    state = state
        .map((n) => n.id == notificationId ? n.copyWith(isRead: true) : n)
        .toList();
  }

  void markAllAsRead() {
    state = state.map((n) => n.copyWith(isRead: true)).toList();
  }

  /// Add a new notification to the list (local-only). New notifications are prepended.
  void addNotification(AppNotification notification) {
    state = [notification, ...state];
  }
}

class LoyaltyPointsNotifier extends StateNotifier<int> {
  LoyaltyPointsNotifier() : super(0);

  void setPoints(int points) => state = points;
  void addPoints(int points) => state += points;
  void deductPoints(int points) =>
      state = (state - points).clamp(0, double.infinity).toInt();
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
  void addTransaction(PointHistory transaction) =>
      state = [...state, transaction];
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
  
  /// Add message only if an item with same id does not already exist.
  void addMessageDedup(Map<String, dynamic> message) {
    try {
      final id = message['id'];
      if (id != null && state.any((m) => m['id'] == id)) return;
      state = [...state, message];
    } catch (_) {
      state = [...state, message];
    }
  }
  void clearMessages() => state = [];

  /// Replace a temporary message (by `tempId`) with the server-backed message.
  void replaceMessage(String tempId, Map<String, dynamic> message) {
    state = state.map((m) => (m['id'] == tempId) ? message : m).toList();
  }

  /// Mark a message as failed to send (keeps other fields intact).
  void markMessageFailed(String id) {
    state = state
        .map((m) => (m['id'] == id) ? {...m, 'status': 'failed'} : m)
        .toList();
  }
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
final reviewsProvider = StateNotifierProvider<ReviewsNotifier, List<Review>>(
    (ref) => ReviewsNotifier()..setReviews(MockData.mockReviews));

class ReviewsNotifier extends StateNotifier<List<Review>> {
  ReviewsNotifier() : super([]);

  void setReviews(List<Review> reviews) {
    state = reviews;
  }

  void addReview(Review review) {
    state = [...state, review];
  }

  void updateReview(Review updatedReview) {
    state = state
        .map((review) => review.id == updatedReview.id ? updatedReview : review)
        .toList();
  }

  void markHelpful(String reviewId) {
    state = state
        .map((review) => review.id == reviewId
            ? review.copyWith(helpfulCount: review.helpfulCount + 1)
            : review)
        .toList();
  }
}

// Voucher Providers
final vouchersProvider = StateNotifierProvider<VouchersNotifier, VoucherState>((ref) {
  // If no backend is configured, use mock data.
  if (ApiConfig.baseUrl.isEmpty) {
    final mockVouchers = MockData.mockVouchers;
    return VouchersNotifier(initialState: VoucherState(
      activeVouchers: mockVouchers.where((v) => v.isValid).toList(),
      usedVouchers: mockVouchers.where((v) => v.status == VoucherStatus.used).toList(),
      expiredVouchers: mockVouchers.where((v) => v.isExpired && v.status != VoucherStatus.used).toList(),
    ), ref: ref);
  }
  return VouchersNotifier(initialState: const VoucherState(), ref: ref);
});

/// A FutureProvider that fetches user vouchers and handles loading/error states.
/// The UI will watch this provider to show the correct state.
final userVouchersFutureProvider = FutureProvider<void>((ref) async {
  // This provider will trigger the fetch and its result (or error) will be available in the UI.
  await ref.watch(vouchersProvider.notifier).fetchUserVouchers();
});

class VouchersNotifier extends StateNotifier<VoucherState> {
  VouchersNotifier({VoucherState? initialState, required this.ref}) : super(initialState ?? const VoucherState());

  final Ref ref;

  Future<void> fetchUserVouchers() async {
    try {
      // If using mock data, do nothing and let the initial state be used.
      if (ApiConfig.baseUrl.isEmpty) {
        // The provider is already initialized with mock data, so we are done.
        return;
      }

      final allVouchers = await ref.read(voucherServiceProvider).fetchUserVouchers();
      
      // Phân loại voucher vào các danh sách tương ứng
      final active = allVouchers.where((v) => v.isValid).toList();
      final used = allVouchers.where((v) => v.status == VoucherStatus.used).toList();
      // Voucher hết hạn là những voucher có ngày validUntil đã qua VÀ chưa được sử dụng
      final expired = allVouchers.where((v) => v.isExpired && v.status != VoucherStatus.used).toList();

      state = state.copyWith(
        activeVouchers: active,
        usedVouchers: used,
        expiredVouchers: expired,
      );
    } catch (e) {
      // If the token is invalid/expired, throw a specific error for the UI
      // to handle, e.g., by showing a re-login prompt.
      final msg = e.toString();
      if (msg.contains('401') || msg.contains('Invalid or expired token')) {
        // Throw a clearer exception for the UI to handle re-login prompt
        throw Exception('Authentication required. Please login again.');
      }

      // Rethrow other errors to be handled by the UI
      rethrow;
    }
  }

  void addVoucher(Voucher voucher) {
    // Add the new voucher to the list of active vouchers
    state = state.copyWith(
      activeVouchers: [...state.activeVouchers, voucher],
    );
  }

  // This method is for local/mock data usage when no backend is connected.
  void useVoucher(String voucherId, String orderId) {
    final voucherToUse = state.activeVouchers.firstWhere((v) => v.id == voucherId);
    final updatedVoucher = voucherToUse.copyWith(status: VoucherStatus.used, usedAt: DateTime.now(), orderId: orderId);
 
    state = state.copyWith(
      activeVouchers: state.activeVouchers.where((v) => v.id != voucherId).toList(),
      usedVouchers: [...state.usedVouchers, updatedVoucher],
    );
  }
}

// --- Repository Providers ---

final userRepositoryProvider = Provider<IUserRepository>((ref) {
  return UserRepository();
});

final notificationRepositoryProvider = Provider<INotificationRepository>((ref) {
  return NotificationRepository();
});

final reviewRepositoryProvider = Provider<IReviewRepository>((ref) {
  return ReviewRepository();
});