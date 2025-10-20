import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';
import 'menu_app_user_service_app_user.dart';
import '../../application/providers.dart';
import 'reservation_app_user_service_app_user.dart'; // New import
import '../../domain/models/menu.dart';
// imports kept minimal; specific models used are imported where needed above
import '../../domain/models/table.dart';
import 'table_app_user_service_app_user.dart';
import '../../domain/models/booking.dart'; // New import

/// Initialize app data for the mobile app by fetching from backend app_user endpoints.
/// Call this early in the app (for example in a top-level widget's initState or from main
/// after setting ApiConfig.baseUrl). This file is new and has the `_app_user` suffix.
Future<void> initializeAppUserData_app_user(WidgetRef ref) async {
  try {
    // Fetch menu categories
    final menuItems = await MenuAppUserServiceAppUser.fetchMenuItems();
    final Map<String, List<dynamic>> groups = {};
    for (final item in menuItems) {
      final map = item as Map<String, dynamic>;
      final cat = (map['categoryId'] ?? map['category'] ?? 'default').toString();
      groups.putIfAbsent(cat, () => []).add(map);
    }

    final categories = groups.entries.map((e) {
      // Determine a friendly category name from the first item if available.
      final firstItem = e.value.isNotEmpty ? (e.value.first as Map<String, dynamic>) : null;
      final categoryName = firstItem != null
          ? (firstItem['categoryName'] ?? firstItem['category'] ?? e.key).toString()
          : e.key;

      return MenuCategory(
        id: e.key,
        name: categoryName,
        items: e.value.map((m) {
          final map = m as Map<String, dynamic>;
          return MenuItem(
            id: map['id']?.toString() ?? '',
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
    ref.read(menuCategoriesProvider.notifier).setCategories(categories);

  // Fetch tables
  final tablesRaw = await TableAppUserServiceAppUser.fetchTables();
  // Debug: log raw response shape so we can see why mapping may fail
  // ignore: avoid_print
  print("[initializeAppUserData_app_user] tablesRaw: length=${tablesRaw.length} first=${tablesRaw.isNotEmpty ? tablesRaw.first : 'empty'}");
    List<String>? _parseStringList(dynamic v) {
      if (v == null) return null;
      if (v is List) return v.map((e) => e?.toString() ?? '').where((s) => s.isNotEmpty).toList();
      if (v is String) {
        // Try decode JSON list
        try {
          final decoded = json.decode(v);
          if (decoded is List) return decoded.map((e) => e?.toString() ?? '').where((s) => s.isNotEmpty).toList();
        } catch (_) {
          // Fallback: comma separated
          final parts = v.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
          return parts.isNotEmpty ? parts : null;
        }
      }
      return null;
    }

    final tables = tablesRaw.map((t) {
      final map = t as Map<String, dynamic>;
      final statusString = (map['status'] ?? 'available').toString();
      final status = TableStatus.values.firstWhere((e) => e.name == statusString, orElse: () => TableStatus.available);

      return DiningTable(
        id: map['id']?.toString() ?? '',
        // prefer `table_number` from backend, fallback to `name` for compatibility
        name: (map['table_number'] ?? map['name'] ?? 'Table').toString(),
        capacity: (map['capacity'] is int) ? map['capacity'] as int : int.tryParse((map['capacity'] ?? '0').toString()) ?? 0,
        // location may be string or object; convert to string for display
        location: (map['location'] is String) ? map['location'] as String : (map['location'] != null ? map['location'].toString() : ''),
        price: (map['price'] is num) ? (map['price'] as num).toDouble() : double.tryParse((map['price'] ?? '0').toString()) ?? 0.0,
        status: status,
        type: TableType.values.firstWhere((e) => e.name == (map['type'] ?? 'regular'), orElse: () => TableType.regular),
        // pass through optional fields so UI can show them
        description: (map['description'] as String?) ?? null,
        deposit: (map['deposit'] is num) ? (map['deposit'] as num).toDouble() : null,
        cancel_minutes: (map['cancel_minutes'] is int) ? map['cancel_minutes'] as int : null,
  panorama_urls: _parseStringList(map['panorama_urls']),
  amenities: _parseStringList(map['amenities']),
        image: (map['image'] ?? map['imageUrl'] ?? '') as String?,
        x: (map['x'] is num) ? (map['x'] as num).toDouble() : null,
        y: (map['y'] is num) ? (map['y'] as num).toDouble() : null,
        width: (map['width'] is num) ? (map['width'] as num).toDouble() : null,
        height: (map['height'] is num) ? (map['height'] as num).toDouble() : null,
      );
    }).toList();
  // Debug: show how many tables we mapped
  // ignore: avoid_print
  print('[initializeAppUserData_app_user] mapped tables count=${tables.length}');
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

/// Initialize user-specific data after login, such as reservations.
Future<void> initializeUserDependentData_app_user(WidgetRef ref) async {
  try {
    // Fetch user's reservations
    final reservationsRaw = await ReservationAppUserServiceAppUser.fetchReservations();
    final bookings = reservationsRaw.map((r) {
      final map = r as Map<String, dynamic>;
      final tableMap = map['table'] as Map<String, dynamic>?;

      final reservationTime = (DateTime.tryParse(map['reservation_time'] ?? '') ?? DateTime.now()).toLocal();
      final statusString = (map['status'] ?? 'pending').toString();
      final status = BookingStatus.values.firstWhere(
        (e) => e.name == statusString,
        orElse: () => BookingStatus.pending,
      );

      return Booking(
        id: map['id']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString(),
        tableId: tableMap?['id']?.toString() ?? '',
        tableName: tableMap?['table_number']?.toString() ?? 'Unknown Table',
        date: reservationTime,
        time: TimeOfDay.fromDateTime(reservationTime).format(ref.context),
        guests: (map['num_people'] is int) ? map['num_people'] as int : 1,
        status: status,
        location: tableMap?['location'] ?? 'N/A',
        price: (tableMap?['price'] as num?)?.toDouble() ?? 0.0,
        createdAt: (DateTime.tryParse(map['createdAt'] ?? '') ?? DateTime.now()).toLocal(),
      );
    }).toList();

    ref.read(bookingsProvider.notifier).setBookings(bookings);

    // Fetch user profile
    final userProfile = await ref.read(userRepositoryProvider).getUserProfile();
    ref.read(userProvider.notifier).setUser(userProfile);

    // Fetch user's notifications
    final notifications = await ref.read(notificationRepositoryProvider).getNotifications();
    ref.read(notificationsProvider.notifier).setNotifications(notifications);

    // Fetch reviews (e.g., for the restaurant)
    final reviews = await ref.read(reviewRepositoryProvider).getReviews();
    ref.read(reviewsProvider.notifier).setReviews(reviews);

    // Note: Events are usually fetched on the specific screen,
    // but you could fetch them here if needed globally.
    // final eventsRaw = await EventAppUserService.fetchEvents();
    // ... process and set events to a provider ...

  } catch (e, st) {
    // Log error
    // ignore: avoid_print
    print('initializeUserDependentData_app_user failed: $e');
    // ignore: avoid_print
    print(st);
  }
}