import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../application/providers.dart';
import '../../../domain/models/payment.dart';
import '../../../domain/models/order.dart';
import '../../../data/services/order_app_user_service_app_user.dart';

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

    // Simulate payment processing
    await Future.delayed(const Duration(seconds: 2));

    final currentOrder = ref.read(currentOrderProvider);
    if (currentOrder != null) {
      try {
        // Update order payment status on backend
        await OrderAppUserService.updateOrder(currentOrder.id.toString(), {
          'payment_status': 'paid',
          'payment_method': selectedMethod == PaymentMethodType.cash ? 'cash' : selectedMethod == PaymentMethodType.momo ? 'momo' : 'other',
        });

        // Update local order status
        ref.read(currentOrderProvider.notifier).setOrder(
          currentOrder.copyWith(status: OrderStatus.sentToKitchen),
        );
      } catch (e) {
        // Fallback to local update on error
        ref.read(currentOrderProvider.notifier).setOrder(
          currentOrder.copyWith(status: OrderStatus.sentToKitchen),
        );
      }

      setState(() {
        isProcessing = false;
      });

      // If MoMo selected, show QR code dialog
      if (selectedMethod == PaymentMethodType.momo) {
        await showDialog<void>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Quét QR MoMo'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Ideally we would fetch QR image from backend; placeholder for now
                Container(
                  width: 200,
                  height: 200,
                  color: Colors.grey[200],
                  child: const Center(child: Text('QR CODE\n(placeholder)')),
                ),
                const SizedBox(height: 12),
                const Text('Mở app MoMo và quét mã QR để thanh toán'),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(),
                child: const Text('Đóng'),
              ),
            ],
          ),
        );
      }

      if (mounted) {
        context.go('/kitchen-status');
      }
    }
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