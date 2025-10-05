import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'src/app/app.dart';
import 'src/data/datasources/setup_api.dart';
import 'src/data/datasources/api_config.dart';

void main() {
  // During development, point the app to local backend. Remove or guard this for production.
  setupLocalApi();
  // ignore: avoid_print
  print('ApiConfig.baseUrl = ${ApiConfig.baseUrl}');
  runApp(
    const ProviderScope(
      child: RestaurantReservationApp(),
    ),
  );
}