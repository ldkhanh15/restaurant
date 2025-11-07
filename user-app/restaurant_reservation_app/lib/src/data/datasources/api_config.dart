class ApiConfig {
  /// Base URL for the backend API. If empty, the app will use local/mock datasource.
  ///
  /// IMPORTANT: set this to your backend public URL (eg. ngrok) for VNPay and other
  /// network flows to work in development. Example:
  ///   ApiConfig.baseUrl = 'https://abcd1234.ngrok-free.app';
  // Set to your dev backend public URL (ngrok). Update this value in dev as needed.
  // Current ngrok forwarding (from your session): https://9aa19d1026dc.ngrok-free.app
  static String baseUrl = 'https://9aa19d1026dc.ngrok-free.app';

  /// Optional auth token (JWT) used for authenticated requests.
  static String authToken = '';

  /// Optional server-side current user id (UUID) captured from login response.
  static String currentUserId = '';

  /// Helper to check whether a real backend URL is configured.
  static bool get hasBaseUrl => baseUrl.isNotEmpty;

  /// Normalize baseUrl to ensure it doesn't end with a trailing slash when used
  /// in URI building helpers.
  static String normalizedBaseUrl() {
    if (baseUrl.isEmpty) return '';
    return baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
  }
}
