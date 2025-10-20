import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../application/providers.dart';
import '../../../domain/models/payment.dart';
import '../../../domain/models/order.dart';
import '../../../data/services/order_app_user_service_app_user.dart';
import '../../../data/services/payment_app_user_service_app_user.dart';
import 'package:url_launcher/url_launcher.dart';

class PaymentScreen extends ConsumerStatefulWidget {
  const PaymentScreen({super.key});

  @override
  ConsumerState<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends ConsumerState<PaymentScreen> {
  PaymentMethodType? selectedMethod;
  bool isProcessing = false;
  final TextEditingController _notesController = TextEditingController();


  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
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

    try {
      // If user selected VNPay (or momo/banking mapped to vnpay on backend), call createVnpayPayment
      if (selectedMethod == PaymentMethodType.momo || _getPaymentMethodString(selectedMethod!) == 'other' || _getPaymentMethodString(selectedMethod!) == 'momo') {
        // For now, prefer VNPay flow via backend's /vnpay/create which will return a redirect_url
        final resp = await PaymentAppUserService.createVnpayPayment(currentOrder.id.toString());
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

    if (mounted) context.go('/kitchen-status');
  }

  @override
  Widget build(BuildContext context) {
  final currentOrder = ref.watch(currentOrderProvider);

    if (currentOrder == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Thanh toán')),
        body: const Center(
          child: Text('Không có đơn hàng để thanh toán'),
        ),
      );
    }

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
                          _formatPrice(currentOrder.total),
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
                    : Text('Thanh toán ${_formatPrice(currentOrder.total)}'),
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