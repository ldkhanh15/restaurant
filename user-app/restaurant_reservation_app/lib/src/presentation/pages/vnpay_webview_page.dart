import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

/// VnpayWebviewPage
/// Usage:
/// final url = await paymentService.createVnpayUrl(orderId);
/// Navigator.of(context).push(MaterialPageRoute(builder: (_) => VnpayWebviewPage(url)));

class VnpayWebviewPage extends StatefulWidget {
  final String redirectUrl;

  const VnpayWebviewPage(this.redirectUrl, {Key? key}) : super(key: key);

  @override
  State<VnpayWebviewPage> createState() => _VnpayWebviewPageState();
}

class _VnpayWebviewPageState extends State<VnpayWebviewPage> {
  bool _loading = true;
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onNavigationRequest: (req) {
          final url = req.url;
          if (_isReturnUrl(url)) {
            _onVnpayReturn(url);
            return NavigationDecision.prevent;
          }
          return NavigationDecision.navigate;
        },
        onPageFinished: (_) => setState(() => _loading = false),
      ))
      ..loadRequest(Uri.parse(widget.redirectUrl));
  }

  bool _isReturnUrl(String url) {
    // Detect your return url pattern
    return url.contains('/api/payments/vnpay/return') || url.startsWith('restaurantapp://');
  }

  void _onVnpayReturn(String url) async {
    try {
      final uri = Uri.parse(url);
      final params = uri.queryParameters;

      // Close webview
      if (Navigator.canPop(context)) Navigator.of(context).pop();

      // Decide success by vnp_ResponseCode == '00' or call verify endpoint
      final success = params['vnp_ResponseCode'] == '00';

      if (success) {
        Navigator.of(context).pushReplacementNamed('/payment/success', arguments: params);
      } else {
        Navigator.of(context).pushReplacementNamed('/payment/failed', arguments: params);
      }
    } catch (e) {
      // If parsing fails, show failed
      Navigator.of(context).pushReplacementNamed('/payment/failed', arguments: {'error': e.toString()});
    }
  }

  Future<void> _openInExternalBrowser() async {
    final uri = Uri.parse(widget.redirectUrl);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Không thể mở trình duyệt bên ngoài')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Thanh toán VNPay'),
        actions: [
          IconButton(
            tooltip: 'Mở trình duyệt',
            icon: const Icon(Icons.open_in_browser),
            onPressed: _openInExternalBrowser,
          )
        ],
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_loading)
            const Center(
              child: CircularProgressIndicator(),
            ),
        ],
      ),
    );
  }
}
