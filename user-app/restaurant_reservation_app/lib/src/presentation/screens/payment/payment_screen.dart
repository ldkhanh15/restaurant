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
import 'package:url_launcher/url_launcher.dart';
import '../../widgets/leading_back_button.dart';
import '../../../app/app.dart';

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
  if (selectedMethod == PaymentMethodType.momo) {
        // For now, prefer VNPay flow via backend's /vnpay/create which will return a redirect_url
        final resp = await PaymentAppUserService.createVnpayPayment(
          currentOrder.id.toString(),
          voucherIds: _appliedVoucherIds,
          amount: finalTotal,
        );
        final redirect = resp['redirect_url'] as String?;
        if (redirect != null && redirect.isNotEmpty) {
          // Open in external browser
          final uri = Uri.parse(redirect);
          if (await canLaunchUrl(uri)) {
            await launchUrl(uri, mode: LaunchMode.externalApplication);
          }

          // Poll order status for up to 60 seconds
          final start = DateTime.now();
          while (DateTime.now().difference(start).inSeconds < 60) {
            await Future.delayed(const Duration(seconds: 2));
            try {
              final fresh = await OrderAppUserService.getOrderById(currentOrder.id.toString());
              if (fresh['payment_status'] == 'paid' || fresh['status'] == 'paid') {
                // Update provider
                final updatedOrder = currentOrder.copyWith(
                  status: OrderStatus.paid,
                  paymentMethod: _parsePaymentMethodType(fresh['payment_method'] ?? 'momo'),
                  paymentStatus: _parsePaymentStatus(fresh['payment_status'] ?? 'paid'),
                );
                ref.read(currentOrderProvider.notifier).setOrder(updatedOrder);
                break;
              }
            } catch (_) {
              // ignore polling errors
            }
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
      }
    } catch (e) {
      // If API errors, fallback to local update and notify user
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi thanh toán: $e. Cập nhật tạm thời.')));
      ref.read(currentOrderProvider.notifier).setOrder(currentOrder.copyWith(status: OrderStatus.paid));
    }

    setState(() {
      isProcessing = false;
    });

    // After successful payment, create a local notification and navigate to payment success screen
    try {
      final updatedOrder = ref.read(currentOrderProvider);
          if (updatedOrder != null) {
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

        // Try to find the booking object to navigate to order-confirmation
        final bookings = ref.read(bookingsProvider);
        Booking? found;
        try {
          final matches = bookings.where((b) => b.id == updatedOrder.bookingId || b.serverId == updatedOrder.bookingId).toList();
          if (matches.isNotEmpty) found = matches.first;
        } catch (_) {}

        if (!mounted) return;
        if (found != null) {
          final updatedOrder = ref.read(currentOrderProvider);
          if (updatedOrder != null) {
            // Show payment success screen
            if (mounted) {
              try {
                appRouter.go('/payment-success', extra: updatedOrder);
                return;
              } catch (_) {
                context.go('/account?tab=orders');
                return;
              }
            }
          }
        }
      }
    } catch (_) {}

    // If payment completed, show Payment Success screen. Otherwise fall back to orders list.
    final updatedOrderFallback = ref.read(currentOrderProvider);
    if (updatedOrderFallback != null) {
      // If order is paid, show payment success
      if (updatedOrderFallback.paymentStatus == PaymentStatus.completed || updatedOrderFallback.status == OrderStatus.paid) {
        if (mounted) {
          try {
            appRouter.go('/payment-success', extra: updatedOrderFallback);
            return;
          } catch (_) {}
        }
      }
    }

    if (mounted) context.go('/account?tab=orders');
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
                onPressed: isProcessing ? null : _handlePayment,
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
    }
  }
}