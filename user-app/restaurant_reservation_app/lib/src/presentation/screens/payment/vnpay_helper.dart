import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'vnpay_webview_screen.dart';

/// Helper to request VNPay redirect URL from backend and open it in the WebView.
Future<void> openVnPayForOrder(BuildContext context, {required String backendBaseUrl, required String orderId, required String authToken, required String returnUrlPrefix}) async {
  final uri = Uri.parse('$backendBaseUrl/api/app_user/payment/vnpay/create');
  final resp = await http.post(uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $authToken',
      },
      body: jsonEncode({'order_id': orderId}));

  if (resp.statusCode == 200) {
    final body = jsonDecode(resp.body);
    final redirectUrl = body['data']?['redirect_url'] as String?;
    if (redirectUrl != null && redirectUrl.isNotEmpty) {
      final result = await Navigator.of(context).push(MaterialPageRoute(
          builder: (_) => VnPayWebViewScreen(initialUrl: redirectUrl, returnUrlPrefix: returnUrlPrefix)));
      // result is the return URL VNPay redirected to (useful for final verification)
      if (result != null) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('VNPay returned: $result')));
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No redirect_url returned from server')));
    }
  } else {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Server error: ${resp.statusCode}')));
  }
}
