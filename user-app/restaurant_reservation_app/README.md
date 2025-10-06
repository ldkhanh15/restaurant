# Restaurant Reservation App

A Flutter application for restaurant table booking and management, built based on the React components analysis.

## Features

- **Table Booking**: View available tables, book tables with date/time selection
- **Table Map**: Visual representation of restaurant layout with table status
- **My Bookings**: View and manage existing reservations
- **Menu System**: Browse restaurant menu with categories
- **Order Management**: Place orders for booked tables
- **Payment Processing**: Multiple payment methods support
- **Loyalty Program**: Points system and membership tiers
- **Event Booking**: Register for restaurant events
- **Notifications**: Real-time updates and reminders
- **AI Chat**: Customer support chatbot
- **Customer Chat**: Direct communication with staff

## Architecture

The app follows a clean architecture pattern with:

- **Domain Layer**: Business models and entities
- **Data Layer**: Mock data and repositories
- **Application Layer**: State management with Riverpod
- **Presentation Layer**: UI screens and widgets

## State Management

Uses Riverpod for state management with:
- StateNotifier for complex state
- StateProvider for simple state
- Provider for computed values

## Getting Started

1. Install Flutter dependencies:
   ```bash
   flutter pub get
   ```

2. Run the app:
   ```bash
   flutter run
   ```

## Project Structure

```
lib/
├── src/
│   ├── domain/
│   │   └── models/          # Business entities
│   ├── data/
│   │   └── mock_data.dart   # Mock data for development
│   ├── application/
│   │   └── providers.dart    # Riverpod providers
│   └── presentation/
│       ├── screens/         # UI screens
│       └── widgets/         # Reusable widgets
└── main.dart               # App entry point
```

## Dependencies

- `flutter_riverpod`: State management
- `go_router`: Navigation
- `flutter`: UI framework

## Development Status

This is a work-in-progress implementation based on React component analysis. The core table booking functionality is implemented with mock data.