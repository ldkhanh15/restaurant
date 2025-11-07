import 'dart:convert';
import 'dart:developer';
import 'package:flutter/foundation.dart';

import '../datasources/api_config.dart';
import '../datasources/http_client_app_user.dart';

class PaymentAppUserService {
  static Uri _uri(String path) {
    if (!ApiConfig.hasBaseUrl) {
      throw Exception('ApiConfig.baseUrl is empty. Set ApiConfig.baseUrl to your backend URL (eg. ngrok) before calling payment APIs.');
    }
    final base = ApiConfig.normalizedBaseUrl();
    return Uri.parse('$base/api/app_user/payment$path');
  }

  /// Create VNPay payment for an order. Returns { redirect_url }
  static Future<Map<String, dynamic>> createVnpayPayment(String orderId, {List<String>? voucherIds, double? amount, String? bankCode}) async {
    log('loggg: createVnpayPayment');
    final client = HttpClientAppUser();
    final payload = {
      'order_id': orderId,
      if (voucherIds != null) 'voucher_ids': voucherIds,
      if (amount != null) 'amount': amount,
      if (bankCode != null) 'bankCode': bankCode
    };
    final res = await client.post(_uri('/vnpay/create'), body: json.encode(payload));
    log('LOG: payload: $payload');
    log('LOG: res: ${res.body}');
    if (res.statusCode == 200) {
      final decoded = json.decode(res.body);
      if (decoded is Map<String, dynamic>) {
        if (decoded.containsKey('data') && decoded['data'] is Map<String, dynamic>) return decoded['data'] as Map<String, dynamic>;
        return decoded;
      }
      throw Exception('Unexpected response shape when creating vnpay payment');
    }
    throw Exception('Failed to create vnpay payment: ${res.statusCode} ${res.body}');
  }

  /// Create deposit for order via VNPay. returns { redirect_url }
  static Future<Map<String, dynamic>> createDepositForOrder(String orderId, double amount, {String? bankCode}) async {
    final client = HttpClientAppUser();
    final payload = {'order_id': orderId, 'amount': amount, if (bankCode != null) 'bankCode': bankCode};
    final res = await client.post(_uri('/vnpay/deposit/order'), body: json.encode(payload));
    if (res.statusCode == 200) {
      final decoded = json.decode(res.body);
      if (decoded is Map<String, dynamic>) {
        if (decoded.containsKey('data') && decoded['data'] is Map<String, dynamic>) return decoded['data'] as Map<String, dynamic>;
        return decoded;
      }
      throw Exception('Unexpected response shape when creating deposit for order');
    }
    throw Exception('Failed to create deposit for order: ${res.statusCode} ${res.body}');
  }

  /// Verify VNPay return by forwarding the query parameters to the backend return endpoint.
  /// The backend will validate the signature and return payment result data.
  static Future<Map<String, dynamic>> verifyVnpayReturnFromUrl(String returnUrl) async {
    final client = HttpClientAppUser();
    // The returnUrl may be a custom app scheme (restaurantapp://...) or a
    // localhost URL. Normalize it to an HTTP(S) backend verification URL so
    // the HTTP client can perform the GET request. If caller already passed
    // a normal HTTP(S) URL, use it directly.
    Uri uri;
    try {
      final parsed = Uri.parse(returnUrl);
      final scheme = parsed.scheme.toLowerCase();
      if ((scheme != 'http' && scheme != 'https')) {
        // Convert custom scheme into backend return URL using ApiConfig.baseUrl
        final backendBase = ApiConfig.normalizedBaseUrl();
        if (backendBase.isNotEmpty) {
          uri = Uri.parse('$backendBase/api/app_user/payment/vnpay/return')
              .replace(queryParameters: parsed.queryParameters);
        } else {
          // If no backend base configured, fall back to original parsed URI
          uri = parsed;
        }
      } else if ((parsed.host == 'localhost' || parsed.host == '127.0.0.1') && ApiConfig.baseUrl.isNotEmpty) {
        final base = Uri.parse(ApiConfig.baseUrl);
        uri = base.replace(path: parsed.path, queryParameters: parsed.queryParameters);
      } else {
        uri = parsed;
      }
    } catch (e) {
      // If parsing fails, fallback to using the raw string as URI (this will
      // likely fail the request but keeps behavior explicit)
      uri = Uri.parse(returnUrl);
    }

    final res = await client.get(uri);
    if (res.statusCode == 200) {
      final decoded = json.decode(res.body);
      if (decoded is Map<String, dynamic>) {
        if (decoded.containsKey('data') && decoded['data'] is Map<String, dynamic>) return decoded['data'] as Map<String, dynamic>;
        return decoded;
      }
      throw Exception('Unexpected response shape when verifying vnpay return');
    }
    throw Exception('Failed to verify vnpay return: ${res.statusCode} ${res.body}');
  }
}
