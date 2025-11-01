import 'dart:convert';
import '../datasources/api_config.dart';
import '../datasources/http_client_app_user.dart';

class PaymentAppUserService {
  static Uri _uri(String path) => Uri.parse('${ApiConfig.baseUrl}/api/app_user/payment$path');

  /// Create VNPay payment for an order. Returns { redirect_url }
  static Future<Map<String, dynamic>> createVnpayPayment(String orderId, {List<String>? voucherIds, double? amount, String? bankCode}) async {
    final client = HttpClientAppUser();
    final payload = {
      'order_id': orderId,
      if (voucherIds != null) 'voucher_ids': voucherIds,
      if (amount != null) 'amount': amount,
      if (bankCode != null) 'bankCode': bankCode
    };
    final res = await client.post(_uri('/vnpay/create'), body: json.encode(payload));
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
}
