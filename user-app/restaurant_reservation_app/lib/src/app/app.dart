import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/scheduler.dart';
import '../data/datasources/api_config.dart';
import '../data/services/app_user_initializer_app_user.dart';
import '../application/socket_manager.dart';
import 'package:go_router/go_router.dart';
import '../presentation/widgets/main_navigation.dart';
import '../presentation/screens/menu/menu_screen.dart';
import '../presentation/screens/order/order_confirmation_screen.dart';
import '../presentation/screens/order/order_detail_screen.dart';
import '../presentation/screens/payment/payment_screen.dart';
import '../presentation/screens/payment/payment_success_screen.dart';
import '../presentation/screens/kitchen/kitchen_status_screen.dart';
import '../presentation/screens/events/event_booking_screen.dart';
import '../presentation/screens/chat/customer_chat_screen.dart';
import '../presentation/screens/reviews/reviews_complaints_screen.dart';
import '../presentation/screens/vouchers/voucher_screen.dart';
import '../presentation/screens/auth/login_screen.dart';
import '../presentation/screens/auth/register_screen.dart';
import '../presentation/screens/home/home_screen.dart';
import '../presentation/screens/notifications/notifications_screen.dart';
import '../presentation/screens/account/account_management_screen.dart';
import '../presentation/screens/blog/blog_list_screen.dart';
import '../presentation/screens/blog/blog_detail_screen.dart';
import '../presentation/screens/table_booking_screen.dart';
import '../presentation/screens/menu/dish_detail_screen.dart';
import '../domain/models/menu.dart';
import '../domain/models/blog.dart';


class RestaurantReservationApp extends ConsumerStatefulWidget {
  const RestaurantReservationApp({super.key});

  @override
  ConsumerState<RestaurantReservationApp> createState() => _RestaurantReservationAppState();
}

class _RestaurantReservationAppState extends ConsumerState<RestaurantReservationApp> {
  @override
  void initState() {
    super.initState();
    // Debug: print registered routes so we can confirm the running build
    // contains the '/order-confirmation' path.
    // ignore: avoid_print
    print('[Router] registered paths: $appRegisteredPaths');

    // Initialize app user data from backend if baseUrl is configured
    SchedulerBinding.instance.addPostFrameCallback((_) {
      if (ApiConfig.baseUrl.isNotEmpty) {
        initializeAppUserData_app_user(ref); // This is the consolidated initializer
        // Initialize global order socket manager so app listens to realtime order updates
        try {
          // reading the provider triggers the manager to connect
          ref.read(orderSocketManagerProvider);
        } catch (_) {}
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Restaurant Reservation App',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF6B4EFF),
          brightness: Brightness.light,
        ),
        useMaterial3: true,
        appBarTheme: const AppBarTheme(
          centerTitle: true,
          elevation: 0,
        ),
        cardTheme: CardThemeData(
          elevation: 4,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF6B4EFF),
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
        appBarTheme: const AppBarTheme(
          centerTitle: true,
          elevation: 0,
        ),
        cardTheme: CardThemeData(
          elevation: 4,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
      ),
      themeMode: ThemeMode.system,
      routerConfig: _router,
      debugShowCheckedModeBanner: false,
    );
  }
}

final _router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const MainNavigation(),
    ),
    GoRoute(
      path: '/menu',
      builder: (context, state) {
        final booking = state.extra as dynamic;
        return MenuScreen(booking: booking);
      },
    ),
    GoRoute(
      path: '/menu/:id',
      builder: (context, state) {
        final item = state.extra as MenuItem;
        return _DishDetailPopupPage(item: item);
      },
    ),
    // Route for order confirmation page (bookings navigate here with extra Booking object)
    GoRoute(
      path: '/order-confirmation',
      builder: (context, state) {
        final booking = state.extra as dynamic;
        return OrderConfirmationScreen(booking: booking);
      },
    ),
    // New compatibility route that does not expose the id in the path
    GoRoute(
      name: 'orderDetail',
      path: '/order-detail/:id',
      builder: (context, state) {
        final order = state.extra as dynamic;
        final id = state.pathParameters['id'] ?? state.uri.queryParameters['orderId'];
        return OrderDetailScreen(order: order, orderId: id);
      },
    ),
    // Backwards-compatible route that accepts the full Order in extra or a query param
    GoRoute(
      path: '/order-detail',
      builder: (context, state) {
        final order = state.extra as dynamic;
        final id = state.uri.queryParameters['orderId'];
        return OrderDetailScreen(order: order, orderId: id);
      },
    ),
    GoRoute(
      path: '/payment',
      builder: (context, state) {
        final extra = state.extra as Map<String, dynamic>?;
        final orderId = extra != null ? extra['orderId'] as String? : null;
        final voucherIds = extra != null ? (extra['voucherIds'] as List<dynamic>?)?.map((e) => e as String).toList() : null;
  final discount = extra != null ? (extra['discount'] as num?)?.toDouble() : null;
  final finalAmount = extra != null ? (extra['finalAmount'] as num?)?.toDouble() : null;
  final subtotal = extra != null ? (extra['subtotal'] as num?)?.toDouble() : null;
        return PaymentScreen(initialOrderId: orderId, initialVoucherIds: voucherIds, initialDiscount: discount, initialFinalAmount: finalAmount, initialSubtotal: subtotal);
      },
    ),
    GoRoute(
      path: '/payment-success',
      builder: (context, state) {
        final order = state.extra as dynamic;
        return PaymentSuccessScreen(order: order as dynamic);
      },
    ),
    GoRoute(
      path: '/kitchen-status',
      builder: (context, state) => const KitchenStatusScreen(),
    ),
    GoRoute(
      path: '/events',
      builder: (context, state) => const EventBookingScreen(),
    ),
    GoRoute(
      path: '/chat',
      builder: (context, state) => const CustomerChatScreen(),
    ),
    GoRoute(
      path: '/reviews',
      builder: (context, state) => const ReviewsComplaintsScreen(),
    ),
    GoRoute(
      path: '/vouchers',
      builder: (context, state) => const VoucherScreen(),
    ),
    GoRoute(
      path: '/home',
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: '/notifications',
      builder: (context, state) => const NotificationsScreen(),
    ),
    GoRoute(
      path: '/account',
      builder: (context, state) {
        final tab = state.uri.queryParameters['tab'];
        final orderId = state.uri.queryParameters['orderId'];
        return AccountManagementScreen(initialTab: tab, initialOrderId: orderId);
      },
    ),
    GoRoute(
      path: '/blog',
      builder: (context, state) => const BlogListScreen(),
    ),
    GoRoute(
      path: '/blog/:id',
      builder: (context, state) {
        // Try to take the Blog model from extra if provided, otherwise show detail with id
  final extra = state.extra;
  final blogModel = extra is Blog ? extra : null;
  return BlogDetailScreen(blog: blogModel, id: state.pathParameters['id']);
      },
    ),
    // Compatibility route: some places may navigate to '/notification' (singular)
    GoRoute(
      path: '/notification',
      builder: (context, state) => const NotificationsScreen(),
    ),
    GoRoute(
      path: '/my-bookings',
      builder: (context, state) => TableBookingScreen(initialTab: 'myBookings'),
    ),
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/signup',
          builder: (context, state) => const RegisterScreen(),
        ),
  ],
);
// Expose the app's root router so other modules can navigate using the root
// route table when the local BuildContext may be nested inside other
// Navigators/Shells. Prefer using named navigation where possible.
GoRouter get appRouter => _router;

// A small, manually maintained list of registered routes for quick
// debugging. Keep this list in sync with the routes above if you add/remove
// routes. It's only used for runtime troubleshooting (debug prints).
const List<String> appRegisteredPaths = [
  '/',
  '/menu',
  '/order-confirmation',
  '/menu/:id',
  '/order-detail/:id',
  '/order-detail',
  '/payment',
  '/kitchen-status',
  '/events',
  '/chat',
  '/reviews',
  '/vouchers',
  '/home',
  '/notifications',
  '/account',
  '/blog',
  '/blog/:id',
  '/notification',
  '/my-bookings',
  '/login',
  '/signup',
];

// Debug: print registered paths at import time so the running app's logs show
// which routes are available. Useful to confirm the build on device includes
// the /order-confirmation route.
// (Moved to initState to avoid top-level execution during import.)

// A small page wrapper that immediately opens the modal popup and pops the
// route when the modal is dismissed. This preserves existing navigation
// semantics while showing the dish detail as a popup.
class _DishDetailPopupPage extends StatefulWidget {
  final MenuItem item;
  const _DishDetailPopupPage({required this.item});

  @override
  State<_DishDetailPopupPage> createState() => _DishDetailPopupPageState();
}

class _DishDetailPopupPageState extends State<_DishDetailPopupPage> {
  bool _opened = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_opened) {
      _opened = true;
      // Use post frame to ensure context is stable
      WidgetsBinding.instance.addPostFrameCallback((_) async {
        await showDishDetailPopup(context, widget.item);
        if (mounted) {
          // Use GoRouter to navigate back to the menu route explicitly. This avoids
          // popping the underlying Navigator when the route was created via
          // context.go(...), which can leave an empty/black screen.
          GoRouter.of(context).go('/menu');
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // Render an empty transparent scaffold while the modal is being presented
    return const Scaffold(body: SizedBox.shrink());
  }
}
