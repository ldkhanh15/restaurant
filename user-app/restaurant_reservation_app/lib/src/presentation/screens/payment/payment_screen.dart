import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../application/providers.dart';
import '../../../domain/models/voucher.dart' as domain_voucher;
import '../../../domain/models/payment.dart';
import '../../../domain/models/order.dart';
import '../../../domain/models/booking.dart';
import '../../../data/services/order_app_user_service_app_user.dart';
import '../../../domain/models/notification.dart';
import '../../../data/services/payment_app_user_service_app_user.dart';
import '../../widgets/leading_back_button.dart';
import '../../../app/app.dart';
import 'payment_success_screen.dart';
import '../../../data/datasources/api_config.dart';
import '../payment/vnpay_webview_screen.dart';
import 'package:url_launcher/url_launcher.dart';
// debug prints used instead of dart:developer

class PaymentScreen extends ConsumerStatefulWidget {
  final String? initialOrderId;
  final List<String>? initialVoucherIds;
  final double? initialDiscount;
  final double? initialFinalAmount;
  final double? initialSubtotal;
  const PaymentScreen({super.key, this.initialOrderId, this.initialVoucherIds, this.initialDiscount, this.initialFinalAmount, this.initialSubtotal});

  @override
  ConsumerState<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends ConsumerState<PaymentScreen> {
  PaymentMethodType? selectedMethod;
  bool isProcessing = false;
  final TextEditingController _notesController = TextEditingController();
  List<String>? _appliedVoucherIds;


  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    // If navigation supplied an initial voucher id, keep it locally.
    _appliedVoucherIds = widget.initialVoucherIds;
    // If an order id was supplied, we might want to fetch that order specifically.
    // For now we rely on currentOrderProvider being set, but leave the id available.
    // final initialOrderId = widget.initialOrderId;
    if (_appliedVoucherIds != null && _appliedVoucherIds!.isNotEmpty) {
      // Ensure vouchers are loaded so we can calculate discount
      Future.microtask(() async {
        try {
          await ref.read(vouchersProvider.notifier).fetchUserVouchers();
        } catch (_) {}
        if (mounted) setState(() {});
      });
    }
  }

  String _formatPrice(double price) {
    return '${price.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    )}đ';
  }

  String _getPaymentMethodName(PaymentMethodType type) {
    switch (type) {
      case PaymentMethodType.cash:
        return 'Tiền mặt';
      case PaymentMethodType.card:
        return 'Thẻ tín dụng';
      case PaymentMethodType.momo:
        return 'MoMo';
      case PaymentMethodType.banking:
        return 'Chuyển khoản';
      case PaymentMethodType.vnpay:
        return 'VNPay';
    }
  }

  IconData _getPaymentMethodIcon(PaymentMethodType type) {
    switch (type) {
      case PaymentMethodType.cash:
        return Icons.money;
      case PaymentMethodType.card:
        return Icons.credit_card;
      case PaymentMethodType.momo:
        return Icons.account_balance_wallet;
      case PaymentMethodType.banking:
        return Icons.account_balance;
      case PaymentMethodType.vnpay:
        return Icons.payment;
    }
  }

  String _getPaymentMethodString(PaymentMethodType type) {
    switch (type) {
      case PaymentMethodType.cash:
        return 'cash';
      case PaymentMethodType.momo:
        return 'momo';
      // Backend hiện chưa hỗ trợ các phương thức này trong API payment mới
      case PaymentMethodType.card:
        return 'other';
      case PaymentMethodType.banking:
        return 'other';
      case PaymentMethodType.vnpay:
        return 'vnpay';
    }
  }

  PaymentMethodType _parsePaymentMethodType(String method) {
    switch (method.toLowerCase()) {
      case 'cash':
        return PaymentMethodType.cash;
      case 'card':
        return PaymentMethodType.card;
      case 'momo':
        return PaymentMethodType.momo;
      case 'banking':
        return PaymentMethodType.banking;
      case 'vnpay':
        return PaymentMethodType.vnpay;
      default:
        return PaymentMethodType.cash;
    }
  }

  PaymentStatus _parsePaymentStatus(String status) {
    switch (status.toLowerCase()) {
      case 'paid':
        return PaymentStatus.completed;
      case 'pending':
        return PaymentStatus.pending;
      case 'processing':
        return PaymentStatus.processing;
      case 'failed':
        return PaymentStatus.failed;
      default:
        return PaymentStatus.pending;
    }
  }

  void _handlePayment() async {
    // Use print so the message appears reliably in the Flutter console.
    print('[Payment] _handlePayment called');
    if (selectedMethod == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng chọn phương thức thanh toán')),
      );
      return;
    }

    setState(() {
      isProcessing = true;
    });

    final currentOrder = ref.read(currentOrderProvider);
    if (currentOrder == null) {
      setState(() { isProcessing = false; });
      return;
    }

    // Compute applied vouchers and final total here so we can pass amount to backend calls
    final voucherState = ref.read(vouchersProvider);
    List<domain_voucher.Voucher> appliedVouchers = [];
    if (_appliedVoucherIds != null && _appliedVoucherIds!.isNotEmpty) {
      final all = [...voucherState.activeVouchers, ...voucherState.usedVouchers, ...voucherState.expiredVouchers];
      final idSet = _appliedVoucherIds!.toSet();
      appliedVouchers = all.where((v) => idSet.contains(v.id)).cast<domain_voucher.Voucher>().toList();
    }

    double _calculateDiscountForSubtotal(double subtotal) {
      if (appliedVouchers.isEmpty) return 0.0;
      double fixed = 0.0;
      double percentSum = 0.0;
      for (final v in appliedVouchers) {
        if (v.discountAmount != null) fixed += v.discountAmount!;
        if (v.discountPercentage != null) percentSum += v.discountPercentage!;
      }
      final percentDiscount = subtotal * (percentSum / 100.0);
      final total = fixed + percentDiscount;
      return total.clamp(0, subtotal);
    }

    final discount = _calculateDiscountForSubtotal(currentOrder.subtotal);
    final finalTotal = (currentOrder.total - discount).clamp(0.0, double.infinity);

    try {
      // If user selected VNPay (or momo/banking mapped to vnpay on backend), call createVnpayPayment
  // Only MoMo should use the VNPay redirect flow. Treat banking (transfer) as a simple method
  // that uses the immediate processOrderPayment API to mark the order paid.
  // VNPay redirect flow for VNPay and MoMo (backend maps MoMo -> vnpay redirect when appropriate)
  if (selectedMethod == PaymentMethodType.momo || selectedMethod == PaymentMethodType.vnpay) {
        // Use backend to generate VNPay redirect URL, then open inside an in-app WebView so
        // the user can select bank -> fill bank form -> OTP, and we intercept the return URL.
        final resp = await PaymentAppUserService.createVnpayPayment(
          currentOrder.id.toString(),
          voucherIds: _appliedVoucherIds,
          amount: finalTotal,
        );
        final redirect = resp['redirect_url'] as String?;
        if (redirect != null && redirect.isNotEmpty) {
      // Build return URL prefix from backend config. Use app_user return endpoint
      // so the mobile client verifies against the app_user controller.
      final returnPrefix = ApiConfig.baseUrl.endsWith('/')
        ? '${ApiConfig.baseUrl}api/app_user/payment/vnpay/return'
        : '${ApiConfig.baseUrl}/api/app_user/payment/vnpay/return';

          // Let user choose whether to open in external browser or in-app WebView
          final choice = await showDialog<String?>(
            context: context,
            builder: (ctx) => AlertDialog(
              title: const Text('Mở trang thanh toán'),
              content: SelectableText(redirect),
              actions: [
                TextButton(onPressed: () => Navigator.of(ctx).pop(null), child: const Text('Hủy')),
                TextButton(
                  onPressed: () => Navigator.of(ctx).pop('external'),
                  child: const Text('Mở trong trình duyệt'),
                ),
                TextButton(
                  onPressed: () => Navigator.of(ctx).pop('webview'),
                  child: const Text('Mở trong ứng dụng'),
                ),
              ],
            ),
          );

          if (choice == 'external') {
            // Open external browser. Note: the app won't automatically receive VNPay return URL.
            try {
              final uri = Uri.parse(redirect);
              if (await canLaunchUrl(uri)) {
                await launchUrl(uri, mode: LaunchMode.externalApplication);
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đã mở trình duyệt. Sau khi hoàn tất, quay lại ứng dụng để kiểm tra trạng thái.')));
              } else {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Không thể mở trình duyệt.')));
              }
            } catch (e) {
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi khi mở URL: $e')));
            }
            setState(() { isProcessing = false; });
            return;
          } else if (choice == 'webview') {
            // Open the in-app WebView and await the VNPay redirect return URL
            final resultUrl = await Navigator.of(context).push<String?>(
              MaterialPageRoute(builder: (_) => VnPayWebViewScreen(initialUrl: redirect, returnUrlPrefix: returnPrefix)),
            );

            // If we received a resultUrl, handle it.
            if (resultUrl != null && resultUrl.isNotEmpty) {
              final resultUri = Uri.tryParse(resultUrl);

              // If the result is a custom app scheme, it means the app was re-opened via deep link.
              // We can treat this as a success signal and navigate to the success screen.
              if (resultUri != null && resultUri.scheme == 'restaurantapp') {
                if (resultUri.host == 'payment' && resultUri.path.contains('success')) {
                  // Update order state to paid as a fallback
                  final updatedOrder = currentOrder.copyWith(status: OrderStatus.paid, paymentStatus: PaymentStatus.completed);
                  ref.read(currentOrderProvider.notifier).setOrder(updatedOrder);

                  // Navigate to success screen
                  if (mounted) {
                    appRouter.go('/payment-success', extra: updatedOrder);
                  }
                } else {
                  // Handle other deep link paths if necessary, e.g., failure
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Giao dịch không thành công hoặc đã bị hủy.')),
                    );
                  }
                }
              } else {
                // If it's a standard web URL, proceed with server-side verification.
                try {
                  var normalizedResultUrl = resultUrl;
                  try {
                    final parsed = Uri.parse(resultUrl);
                    if ((parsed.host == 'localhost' || parsed.host == '127.0.0.1') && ApiConfig.baseUrl.isNotEmpty) {
                      final base = Uri.parse(ApiConfig.baseUrl);
                      final replaced = base.replace(path: parsed.path, queryParameters: parsed.queryParameters);
                      normalizedResultUrl = replaced.toString();
                    }
                  } catch (_) {
                    // ignore parse errors and use original
                  }

                  final verifyResp = await PaymentAppUserService.verifyVnpayReturnFromUrl(normalizedResultUrl);
                  final paymentStatus = (verifyResp['payment_status'] ?? verifyResp['status'] ?? 'paid') as String;
                  final paymentMethod = (verifyResp['payment_method'] ?? 'vnpay') as String;

                  Order updatedOrder;
                  try {
                    final fresh = await OrderAppUserService.getOrderById(currentOrder.id.toString());
                    updatedOrder = currentOrder.copyWith(
                      status: fresh['status'] == 'paid' ? OrderStatus.paid : currentOrder.status,
                      paymentMethod: _parsePaymentMethodType(fresh['payment_method'] ?? paymentMethod),
                      paymentStatus: _parsePaymentStatus(fresh['payment_status'] ?? paymentStatus),
                    );
                  } catch (_) {
                    updatedOrder = currentOrder.copyWith(
                      paymentMethod: _parsePaymentMethodType(paymentMethod),
                      paymentStatus: _parsePaymentStatus(paymentStatus),
                      status: paymentStatus.toLowerCase() == 'paid' ? OrderStatus.paid : currentOrder.status,
                    );
                  }
                  ref.read(currentOrderProvider.notifier).setOrder(updatedOrder);

                  if (paymentStatus.toLowerCase() == 'paid') {
                    if (mounted) {
                      final user = ref.read(userProvider);
                      final userId = user != null ? user.id.toString() : null;
                      final notif = AppNotification(
                        id: DateTime.now().millisecondsSinceEpoch.toString(),
                        userId: userId,
                        type: NotificationType.other,
                        content: 'Đơn hàng #${updatedOrder.id} đã được thanh toán',
                        sentAt: DateTime.now(),
                        status: NotificationStatus.sent,
                      );
                      try {
                        ref.read(notificationsProvider.notifier).addNotification(notif);
                      } catch (_) {}

                      try {
                        appRouter.go('/payment-success', extra: updatedOrder);
                      } catch (_) {
                        try {
                          Navigator.of(context).push(MaterialPageRoute(builder: (_) => PaymentSuccessScreen(order: updatedOrder)));
                        } catch (__) {
                          context.go('/account?tab=orders');
                        }
                      }
                    }
                  } else {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Trạng thái thanh toán: $paymentStatus')),
                      );
                    }
                  }
                } catch (e) {
                  // Defensive fallback: if the error is due to an unsupported
                  // URI scheme (e.g., 'restaurantapp://...') when verifying, treat
                  // it as a success signal returned via deep link and navigate to
                  // the success screen. This handles cases where the WebView
                  // returns a custom scheme and verification couldn't run.
                  final err = e.toString();
                  if (err.contains('Unsupported scheme') || err.contains('restaurantapp')) {
                    try {
                      final parsedFallback = Uri.tryParse(resultUrl);
                      final orderId = parsedFallback?.queryParameters['order_id'];
                      final updatedOrder = currentOrder.copyWith(status: OrderStatus.paid, paymentStatus: PaymentStatus.completed);
                      ref.read(currentOrderProvider.notifier).setOrder(updatedOrder);
                      if (mounted) {
                        if (orderId != null) {
                          appRouter.go('/payment-success', extra: updatedOrder);
                        } else {
                          appRouter.go('/payment-success', extra: updatedOrder);
                        }
                      }
                      // swallow error after handling
                      setState(() { isProcessing = false; });
                      return;
                    } catch (_) {
                      // fallthrough to show snackbar when fallback fails
                    }
                  }
                  if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Không thể xác thực giao dịch: $e')));
                }
              }
            }
            // Finished webview flow, stop processing and don't fall through.
            setState(() { isProcessing = false; });
            return;
          } else {
            // User cancelled dialog
            setState(() { isProcessing = false; });
            return;
          }
        }
      } else {
        // For cash or other simple methods, call processOrderPayment API to mark paid
        final updatedOrderData = await OrderAppUserService.processOrderPayment(currentOrder.id.toString(), {
          'payment_status': 'paid',
          'payment_method': _getPaymentMethodString(selectedMethod!),
          if (_appliedVoucherIds != null && _appliedVoucherIds!.isNotEmpty) 'voucher_ids': _appliedVoucherIds,
          'amount': finalTotal,
        });

        final updatedOrder = currentOrder.copyWith(
          status: OrderStatus.paid,
          paymentMethod: _parsePaymentMethodType(updatedOrderData['payment_method'] ?? 'cash'),
          paymentStatus: _parsePaymentStatus(updatedOrderData['payment_status'] ?? 'paid'),
        );
        ref.read(currentOrderProvider.notifier).setOrder(updatedOrder);

        // Navigate to success screen for cash payment
        if (mounted) {
            try {
              appRouter.go('/payment-success', extra: updatedOrder);
            } catch (_) {
              try {
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => PaymentSuccessScreen(order: updatedOrder)));
              } catch (__) {
                context.go('/account?tab=orders');
              }
            }
        }
      }
    } catch (e) {
      // If API errors, fallback to local update and notify user
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi thanh toán: $e. Cập nhật tạm thời.')));
      ref.read(currentOrderProvider.notifier).setOrder(currentOrder.copyWith(status: OrderStatus.paid));
    }

    setState(() {
      isProcessing = false;
    });

    // No general navigation logic here anymore
  }

  @override
  Widget build(BuildContext context) {
  final currentOrder = ref.watch(currentOrderProvider);
  final voucherState = ref.watch(vouchersProvider);

  // Resolve applied vouchers from ids (search across categories)
  List<domain_voucher.Voucher> appliedVouchers = [];
  if (_appliedVoucherIds != null && _appliedVoucherIds!.isNotEmpty) {
    final all = [...voucherState.activeVouchers, ...voucherState.usedVouchers, ...voucherState.expiredVouchers];
    final idSet = _appliedVoucherIds!.toSet();
    appliedVouchers = all.where((v) => idSet.contains(v.id)).cast<domain_voucher.Voucher>().toList();
  }

  double _calculateDiscountLocal(double subtotal) {
    if (appliedVouchers.isEmpty) return 0.0;
    double fixed = 0.0;
    double percentSum = 0.0;
    for (final v in appliedVouchers) {
      if (v.discountAmount != null) fixed += v.discountAmount!;
      if (v.discountPercentage != null) percentSum += v.discountPercentage!;
    }
    final percentDiscount = subtotal * (percentSum / 100.0);
    final total = fixed + percentDiscount;
    return total.clamp(0, subtotal);
  }

    if (currentOrder == null) {
      return Scaffold(
        appBar: AppBar(
          leading: const LeadingBackButton(),
          title: const Text('Thanh toán'),
        ),
        body: const Center(
          child: Text('Không có đơn hàng để thanh toán'),
        ),
      );
    }

  // Prefer initial values provided via navigation extras (from Confirm & Pay) to avoid mismatch
  final subtotal = widget.initialSubtotal ?? currentOrder.subtotal;
  final discount = widget.initialDiscount ?? _calculateDiscountLocal(subtotal);
  final finalTotal = widget.initialFinalAmount ?? (currentOrder.total - discount).clamp(0.0, double.infinity);

  return Scaffold(
      appBar: AppBar(
        title: const Text('Thanh toán'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Order summary
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Tóm tắt đơn hàng',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Tạm tính:'),
                        Text(_formatPrice(currentOrder.subtotal)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Phí dịch vụ (10%):'),
                        Text(_formatPrice(currentOrder.serviceCharge)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('VAT (10%):'),
                        Text(_formatPrice(currentOrder.tax)),
                      ],
                    ),
                    const Divider(),
                    if (appliedVouchers.isNotEmpty) ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Voucher áp dụng:'),
                          Text('${appliedVouchers.length}'),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        children: appliedVouchers.map((v) => Chip(label: Text(v.code))).toList(),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Giảm:'),
                          Text('-${_formatPrice(discount)}'),
                        ],
                      ),
                      const Divider(),
                    ],
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Tổng cộng:',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          _formatPrice(finalTotal),
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Payment methods
            Text(
              'Phương thức thanh toán',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ...PaymentMethodType.values.map((method) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: RadioListTile<PaymentMethodType>(
                value: method,
                groupValue: selectedMethod,
                onChanged: (value) {
                  print('[UI] Payment method selected: $value');
                  setState(() {
                    selectedMethod = value;
                  });
                },
                title: Row(
                  children: [
                    Icon(_getPaymentMethodIcon(method)),
                    const SizedBox(width: 12),
                    Text(_getPaymentMethodName(method)),
                  ],
                ),
                subtitle: Text(_getPaymentMethodDescription(method)),
              ),
            )).toList(),

            const SizedBox(height: 24),

            // Notes
            Text(
              'Ghi chú (tùy chọn)',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _notesController,
              decoration: const InputDecoration(
                hintText: 'Nhập ghi chú cho giao dịch...',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),

            const SizedBox(height: 32),

            // Payment button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: isProcessing ? null : () {
                  // Visible immediate feedback when the button is tapped.
                  print('[UI] Payment button pressed');
                  _handlePayment();
                },
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: isProcessing
                    ? const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          ),
                          SizedBox(width: 12),
                          Text('Đang xử lý...'),
                        ],
                      )
                    : Text('Thanh toán ${_formatPrice(finalTotal)}'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getPaymentMethodDescription(PaymentMethodType type) {
    switch (type) {
      case PaymentMethodType.cash:
        return 'Thanh toán khi phục vụ mang món';
      case PaymentMethodType.card:
        return 'Visa, Mastercard, JCB';
      case PaymentMethodType.momo:
        return 'Ví điện tử MoMo';
      case PaymentMethodType.banking:
        return 'Internet Banking';
      case PaymentMethodType.vnpay:
        return 'Thanh toán qua VNPay (Internet Banking / QR / Ví)';
      // All PaymentMethodType cases handled above.
    }
  }
}