import 'dart:convert';
import '../../domain/models/voucher.dart';
import '../datasources/api_config.dart';
import '../datasources/http_client_app_user.dart';

class VoucherAppUserService {
  final HttpClientAppUser _client;
  VoucherAppUserService(this._client);

  /// Fetches the current user's vouchers from the backend.
  Future<List<Voucher>> fetchUserVouchers() async {
    // Use the app_user namespace for mobile client endpoints. Calling
    // '/api/vouchers/my-vouchers' hits the admin routes and may be
    // interpreted as an :id parameter, causing a 403 "Insufficient permissions"
    // for regular customers. The correct path for the app user API is below.
    final url = Uri.parse('${ApiConfig.baseUrl}/api/app_user/vouchers/my-vouchers');
    // Debug: log URL and token presence
    try {
      // ignore: avoid_print
      print('[VoucherService] Fetching vouchers from: $url');
      // ignore: avoid_print
      print('[VoucherService] Auth token length: ${ApiConfig.authToken.length}');
    } catch (_) {}

    final res = await _client.get(url);

    // Debug: log response
    // ignore: avoid_print
    print('[VoucherService] Response status: ${res.statusCode}');
    // ignore: avoid_print
    print('[VoucherService] Response body: ${res.body}');

    if (res.statusCode == 200) {
      final body = jsonDecode(res.body);
      // Backend may return different keys depending on API version:
      // - { data: { active: [...], used: [...], expired: [...] } }
      // - { data: { activeVouchers: [...], usedVouchers: [...], expiredVouchers: [...] } }
      final data = body['data'] ?? {};

      final List<dynamic> activeRaw = (data['active'] ?? data['activeVouchers'] ?? []) as List<dynamic>;
      final List<dynamic> usedRaw = (data['used'] ?? data['usedVouchers'] ?? []) as List<dynamic>;
      final List<dynamic> expiredRaw = (data['expired'] ?? data['expiredVouchers'] ?? []) as List<dynamic>;

      // Helper to convert server JSON to our Voucher model with a known status
      Voucher _fromServerJson(Map<String, dynamic> j, VoucherStatus status) {
        String id = (j['id'] ?? '').toString();
        String code = (j['code'] ?? j['voucher_code'] ?? '').toString();
        String name = (j['name'] ?? code).toString();
        String description = (j['description'] ?? j['desc'] ?? '').toString();

        // Determine type and discount fields
        VoucherType type = VoucherType.discount;
        double? discountPercentage;
        double? discountAmount;
        final discountType = (j['discount_type'] ?? j['type'] ?? '').toString();
        final valueRaw = j['value'] ?? j['discount'] ?? j['amount'];
        try {
          if (discountType == 'percentage' || discountType == '%') {
            type = VoucherType.discount;
            discountPercentage = valueRaw != null ? double.tryParse(valueRaw.toString()) : null;
          } else if (discountType == 'fixed') {
            type = VoucherType.discount;
            discountAmount = valueRaw != null ? double.tryParse(valueRaw.toString()) : null;
          }
        } catch (_) {}

        double? minOrder = null;
        if (j['min_order_value'] != null) {
          minOrder = (j['min_order_value'] is num) ? (j['min_order_value'] as num).toDouble() : double.tryParse(j['min_order_value'].toString());
        } else if (j['minimumOrderAmount'] != null) {
          minOrder = (j['minimumOrderAmount'] is num) ? (j['minimumOrderAmount'] as num).toDouble() : double.tryParse(j['minimumOrderAmount'].toString());
        }

        DateTime createdAt = DateTime.now();
        try {
          final ca = j['created_at'] ?? j['createdAt'];
          if (ca != null) createdAt = DateTime.parse(ca.toString()).toLocal();
        } catch (_) {}

        DateTime validFrom = createdAt;
        try {
          final vf = j['valid_from'] ?? j['validFrom'];
          if (vf != null) validFrom = DateTime.parse(vf.toString()).toLocal();
        } catch (_) {}

        DateTime validUntil = DateTime(9999, 12, 31);
        try {
          final vu = j['expiry_date'] ?? j['expiryDate'] ?? j['validUntil'] ?? j['valid_until'];
          if (vu != null) validUntil = DateTime.parse(vu.toString()).toLocal();
        } catch (_) {}

        DateTime? usedAt;
        try {
          final ua = j['used_at'] ?? j['usedAt'];
          if (ua != null) usedAt = DateTime.parse(ua.toString()).toLocal();
        } catch (_) {}

        final orderId = (j['order_id'] ?? j['orderId'])?.toString();

        // Visual defaults
        final iconPath = j['iconPath'] ?? '';
        final colorHex = j['colorHex'] ?? '#6B4EFF';

        return Voucher(
          id: id,
          code: code,
          name: name,
          description: description,
          type: type,
          status: status,
          discountPercentage: discountPercentage,
          discountAmount: discountAmount,
          minimumOrderAmount: minOrder,
          createdAt: createdAt,
          validFrom: validFrom,
          validUntil: validUntil,
          usedAt: usedAt,
          orderId: orderId,
          iconPath: iconPath,
          colorHex: colorHex,
        );
      }

      final List<Voucher> result = [];
      result.addAll(activeRaw.map((e) => _fromServerJson(e as Map<String, dynamic>, VoucherStatus.active)));
      result.addAll(usedRaw.map((e) => _fromServerJson(e as Map<String, dynamic>, VoucherStatus.used)));
      result.addAll(expiredRaw.map((e) => _fromServerJson(e as Map<String, dynamic>, VoucherStatus.expired)));

      return result;
    } else {
      // Throw an exception with a more descriptive error message
      throw Exception('Failed to load vouchers. Status code: ${res.statusCode}, Body: ${res.body}');
    }
  }

  /// Create a voucher usage on the backend. Payload should contain voucher_id, order_id, user_id
  Future<Map<String, dynamic>?> createVoucherUsage(Map<String, dynamic> payload) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/api/voucher-usages');
  final res = await _client.post(url, body: jsonEncode(payload));
    if (res.statusCode == 201 || res.statusCode == 200) {
      try {
        final body = jsonDecode(res.body);
        // backend returns { data: { ... } } or { data: { id: ..., order_id: ... } }
        if (body is Map && body['data'] != null) return body['data'] as Map<String, dynamic>;
        if (body is Map) return body.cast<String, dynamic>();
      } catch (_) {
        return null;
      }
    }
    throw Exception('Failed to create voucher usage: ${res.statusCode}');
  }
}
