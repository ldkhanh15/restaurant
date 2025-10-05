import 'api_config.dart';
import 'dart:io' show Platform;

/// Call this in main during development to point the app to the local backend.
///
/// Notes:
/// - Android emulators require `10.0.2.2` to reach host machine localhost.
/// - iOS simulator and macOS use `localhost`.
/// - For physical devices use your machine IP (e.g. 192.168.x.x) and ensure the device
///   and machine are on the same network.
void setupLocalApi() {
  if (Platform.isAndroid) {
    // Android emulator -> host machine is 10.0.2.2
    ApiConfig.baseUrl = 'http://10.0.2.2:3000';
  } else {
    // iOS simulator, macOS, web on localhost etc.
    ApiConfig.baseUrl = 'http://localhost:3000';
  }
}
