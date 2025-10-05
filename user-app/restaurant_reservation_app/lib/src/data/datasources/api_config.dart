class ApiConfig {
  /// Base URL for the backend API. If empty, the app will use local/mock datasource.
  static String baseUrl = '';
  /// Optional auth token (JWT) used for authenticated requests.
  static String authToken = '';
  /// Optional server-side current user id (UUID) captured from login response.
  static String currentUserId = '';
}
