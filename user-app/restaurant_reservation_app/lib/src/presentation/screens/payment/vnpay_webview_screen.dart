
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../data/datasources/api_config.dart';

/// A lightweight WebView screen that opens a VNPay redirect URL and listens for
/// the VNPay return URL to close and notify the caller.
class VnPayWebViewScreen extends StatefulWidget {
  final String initialUrl;
  final String returnUrlPrefix; // e.g. https://your-backend.com/api/payments/vnpay/return

  const VnPayWebViewScreen({super.key, required this.initialUrl, required this.returnUrlPrefix});

  @override
  State<VnPayWebViewScreen> createState() => _VnPayWebViewScreenState();
}

class _VnPayWebViewScreenState extends State<VnPayWebViewScreen> {
  late final WebViewController _controller;
  bool _loading = true;
  double _progress = 0.0;
  String? _lastFailedUrl;
  String? _lastErrorDescription;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onNavigationRequest: (req) {
          // The backend may redirect to a custom app scheme (e.g., restaurantapp://).
          // Intercept non-http(s) schemes and convert them into a backend HTTPS
          // return URL so the app can forward the params to the server for
          // verification instead of attempting to load/launch an unsupported scheme.
          final parsed = Uri.tryParse(req.url);
          final appScheme = parsed?.scheme ?? '';
          if (appScheme.isNotEmpty && appScheme != 'http' && appScheme != 'https') {
            try {
              final backendBase = ApiConfig.normalizedBaseUrl();
              if (backendBase.isNotEmpty) {
                final backendReturn = Uri.parse('$backendBase/api/app_user/payment/vnpay/return')
                    .replace(queryParameters: parsed?.queryParameters ?? {})
                    .toString();
                if (Navigator.canPop(context)) Navigator.of(context).pop(backendReturn);
                return NavigationDecision.prevent;
              }
            } catch (e) {
              debugPrint('Error handling custom scheme: $e');
              try {
                if (Navigator.canPop(context)) Navigator.of(context).pop(req.url);
              } catch (_) {}
              return NavigationDecision.prevent;
            }
            // If no backend base configured, fallthrough to popping raw URL below
            try {
              if (Navigator.canPop(context)) Navigator.of(context).pop(req.url);
            } catch (_) {}
            return NavigationDecision.prevent;
          }

          // Fallback for older logic: if we see the server's return URL, also pop.
          if (req.url.startsWith(widget.returnUrlPrefix)) {
            Navigator.of(context).pop(req.url);
            return NavigationDecision.prevent;
          }
          // Intercept mock dev redirect so we don't attempt to load http://localhost inside WebView
          if (req.url.contains('mock_vnpay=true')) {
            Navigator.of(context).pop(req.url);
            return NavigationDecision.prevent;
          }
          return NavigationDecision.navigate;
        },
        onPageStarted: (_) => setState(() {
          _loading = true;
          _lastFailedUrl = null;
          _lastErrorDescription = null;
        }),
        onProgress: (p) => setState(() => _progress = p / 100.0),
        onPageFinished: (_) => setState(() {
          _loading = false;
          _progress = 0.0;
        }),
        onWebResourceError: (err) => setState(() {
          _loading = false;
          // WebResourceError does not expose failing URL across platforms, so keep initialUrl as fallback
          _lastFailedUrl = null;
          _lastErrorDescription = err.description;
        }),
      ))
      ..loadRequest(Uri.parse(widget.initialUrl));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('VNPay'),
        actions: [
          IconButton(
            tooltip: 'Open in browser',
            icon: const Icon(Icons.open_in_browser),
            onPressed: () async {
              final uri = Uri.tryParse(widget.initialUrl);
              try {
                if (uri != null && await canLaunchUrl(uri)) {
                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                } else {
                  // Fallback: try launching with parsed Uri even if canLaunchUrl returned false
                  final fallbackUri = Uri.tryParse(widget.initialUrl);
                  if (fallbackUri != null) await launchUrl(fallbackUri, mode: LaunchMode.externalApplication);
                }
              } catch (_) {
                // Final fallback: try launchUrlString and show message on failure
                try {
                  final fallbackUri = Uri.tryParse(widget.initialUrl);
                  if (fallbackUri != null) await launchUrl(fallbackUri, mode: LaunchMode.externalApplication);
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Không thể mở trình duyệt')));
                }
              }
            },
          ),
          IconButton(
            tooltip: 'Copy URL',
            icon: const Icon(Icons.copy),
            onPressed: () {
              Clipboard.setData(ClipboardData(text: widget.initialUrl));
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('URL copied to clipboard')));
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_loading)
            Positioned(
              left: 0,
              right: 0,
              top: 0,
              child: LinearProgressIndicator(value: _progress == 0 ? null : _progress),
            ),
          if (_lastErrorDescription != null)
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.cloud_off, size: 64, color: Colors.black54),
                    const SizedBox(height: 16),
                    const Text('Webpage not available', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text(_lastErrorDescription ?? 'Could not load the page', textAlign: TextAlign.center),
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 12,
                      children: [
                        ElevatedButton.icon(
                          icon: const Icon(Icons.refresh),
                          label: const Text('Retry'),
                          onPressed: () {
                            setState(() {
                              _lastFailedUrl = null;
                              _lastErrorDescription = null;
                              _loading = true;
                            });
                            _controller.reload();
                          },
                        ),
                        ElevatedButton.icon(
                          icon: const Icon(Icons.open_in_browser),
                          label: const Text('Open in browser'),
                          onPressed: () async {
                            final urlToOpen = _lastFailedUrl ?? widget.initialUrl;
                            final uri = Uri.tryParse(urlToOpen);
                            try {
                              if (uri != null && await canLaunchUrl(uri)) {
                                await launchUrl(uri, mode: LaunchMode.externalApplication);
                              } else {
                                final fallbackUri = Uri.tryParse(urlToOpen);
                                if (fallbackUri != null) await launchUrl(fallbackUri, mode: LaunchMode.externalApplication);
                              }
                            } catch (e) {
                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Không thể mở trình duyệt')));
                            }
                          },
                        ),
                        ElevatedButton.icon(
                          icon: const Icon(Icons.copy),
                          label: const Text('Copy URL'),
                          onPressed: () {
                            Clipboard.setData(ClipboardData(text: _lastFailedUrl ?? widget.initialUrl));
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('URL copied to clipboard')));
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
