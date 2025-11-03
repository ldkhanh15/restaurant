import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../domain/models/order.dart';
import '../../widgets/leading_back_button.dart';

class PaymentSuccessScreen extends ConsumerWidget {
  final Order order;

  const PaymentSuccessScreen({super.key, required this.order});

  String _formatPrice(double price) {
    return '${price.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\\d{1,3})(?=(\\d{3})+(?!\\d))'),
      (Match m) => '${m[1]}.',
    )}đ';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        leading: const LeadingBackButton(),
        title: const Text('Thanh toán thành công'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Mã đơn: ${order.id}', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text('Ngày: ${order.createdAt.toLocal().toString()}', style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 16),
            Text('Món đã đặt', style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 8),
            Expanded(
              child: ListView.builder(
                itemCount: order.items.length,
                itemBuilder: (context, i) {
                  final it = order.items[i];
                  return ListTile(
                    title: Text(it.name),
                    subtitle: Text('${it.quantity} x ${_formatPrice(it.price)}'),
                    trailing: Text(_formatPrice(it.price * it.quantity)),
                  );
                },
              ),
            ),
            const Divider(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Tổng cộng', style: TextStyle(fontWeight: FontWeight.bold)),
                Text(_formatPrice(order.total), style: const TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.of(context).popUntil((route) => route.isFirst);
                },
                child: const Text('Về trang chủ'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
