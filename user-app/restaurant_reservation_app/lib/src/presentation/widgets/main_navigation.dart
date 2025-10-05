import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../screens/home/home_screen.dart';
import '../screens/table_booking_screen.dart';
import '../screens/menu/menu_screen.dart';
import '../screens/account/account_management_screen.dart';
import '../screens/notifications/notifications_screen.dart';
import '../screens/loyalty/loyalty_program_screen.dart';
import '../widgets/ai_chat_widget.dart';

class MainNavigation extends ConsumerStatefulWidget {
  const MainNavigation({super.key});

  @override
  ConsumerState<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends ConsumerState<MainNavigation> {
  int _selectedIndex = 0;

  final List<Widget> _screens = [
    const HomeScreen(),
    const TableBookingScreen(),
    const MenuScreen(),
    const LoyaltyProgramScreen(),
    const AccountManagementScreen(),
  ];

  final List<NavigationDestination> _destinations = [
    const NavigationDestination(
      icon: Icon(Icons.home_outlined),
      selectedIcon: Icon(Icons.home),
      label: 'Trang chủ',
    ),
    const NavigationDestination(
      icon: Icon(Icons.table_restaurant_outlined),
      selectedIcon: Icon(Icons.table_restaurant),
      label: 'Đặt bàn',
    ),
    const NavigationDestination(
      icon: Icon(Icons.restaurant_menu_outlined),
      selectedIcon: Icon(Icons.restaurant_menu),
      label: 'Thực đơn',
    ),
    const NavigationDestination(
      icon: Icon(Icons.card_giftcard_outlined),
      selectedIcon: Icon(Icons.card_giftcard),
      label: 'Tích điểm',
    ),
    const NavigationDestination(
      icon: Icon(Icons.person_outline),
      selectedIcon: Icon(Icons.person),
      label: 'Tài khoản',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          IndexedStack(
            index: _selectedIndex,
            children: _screens,
          ),
          // AI Chat Widget
          const AIChatWidget(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        destinations: _destinations,
      ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: "main_events_fab",
        onPressed: () {
          context.push('/events');
        },
        icon: const Icon(Icons.event),
        label: const Text('Sự kiện'),
        backgroundColor: Theme.of(context).colorScheme.secondary,
      ),
    );
  }
}
