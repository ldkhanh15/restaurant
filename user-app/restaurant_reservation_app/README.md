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

## Hướng dẫn chạy ứng dụng (Tiếng Việt)

Dưới đây là hướng dẫn nhanh bằng tiếng Việt để chạy phần `user-app` (ứng dụng Flutter) trên macOS (shell mặc định: zsh).

1. Yêu cầu trước khi bắt đầu
   - Cài đặt Flutter: theo hướng dẫn chính thức tại https://docs.flutter.dev/get-started/install
   - Cài đặt Android Studio (để có Android SDK và AVD): tải tại https://developer.android.com/studio
   - (Tùy chọn) Nếu bạn muốn chạy trên iOS, cài đặt Xcode từ App Store.

2. Cài đặt Android Studio & tạo AVD
   - Mở Android Studio → SDK Manager → đảm bảo cài Android SDK (phiên bản phù hợp, ví dụ Android 33) và "Android SDK Command-line Tools".
   - Mở AVD Manager → tạo một virtual device (ví dụ Pixel 5) với hệ điều hành (system image) đã cài.

3. Thiết lập biến môi trường (ví dụ nếu cài Flutter theo đường dẫn ~/development/flutter)
   - Mở ~/.zshrc và thêm (thay <PATH_TO_FLUTTER> bằng đường dẫn thực tế của bạn):

```bash
export PATH="$PATH:<PATH_TO_FLUTTER>/bin"
```

   - Áp dụng thay đổi:

```bash
source ~/.zshrc
```

4. Kiểm tra môi trường Flutter

```bash
flutter doctor
```

Sửa theo hướng dẫn của `flutter doctor` nếu có thiếu thành phần (ví dụ SDK, công cụ dòng lệnh, license).

5. Cài phụ thuộc cho project (từ thư mục project)

Mở terminal tại thư mục `user-app/restaurant_reservation_app` và chạy:

```bash
flutter pub get
```

6. Chạy ứng dụng trên emulator hoặc thiết bị thật

- Khởi động Android emulator bằng Android Studio (AVD Manager) hoặc bằng terminal:

```bash
flutter emulators             # liệt kê emulators
flutter emulators --launch <emulatorId>
```

- Hoặc chạy trực tiếp (Flutter sẽ cho bạn chọn device nếu có nhiều thiết bị):

```bash
flutter run
```

Hoặc chỉ định device:

```bash
flutter run -d <deviceId>
```

7. Build file APK hoặc App Bundle

```bash
# Build release APK
flutter build apk --release

# Build Android App Bundle (AAB)
flutter build appbundle --release
```

8. Một số lệnh hữu ích khi gặp lỗi SDK/AVD

```bash
# Thiết lập android sdk nếu flutter không tìm thấy
flutter config --android-sdk <PATH_TO_ANDROID_SDK>

# Kiểm tra thiết bị/emulator
flutter devices
```

9. Gợi ý debug vị trí bàn
 - Nếu sơ đồ bàn không hiển thị đúng vị trí x/y, bật `flutter run` và xem log trong terminal để kiểm tra dữ liệu đầu vào (mock hoặc API).
 - Tôi có thể bổ sung một chế độ debug hiển thị toạ độ (raw x,y → mapped left/top) nếu bạn cần kiểm tra nhanh.

Nếu bạn muốn, tôi có thể thêm bước chạy nhanh (script) hoặc hướng dẫn từng bước kèm ảnh chụp màn hình cho Android Studio/AVD.