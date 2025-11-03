import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// go_router not needed here; navigation uses Navigator
import '../payment/payment_screen.dart';
import '../../../application/providers.dart';
import '../../../domain/models/voucher.dart';

class ConfirmAndPayScreen extends ConsumerStatefulWidget {
  const ConfirmAndPayScreen({super.key});

  @override
  ConsumerState<ConfirmAndPayScreen> createState() => _ConfirmAndPayScreenState();
}

class _ConfirmAndPayScreenState extends ConsumerState<ConfirmAndPayScreen> {
  // Allow selecting multiple vouchers
  final List<Voucher> _selectedVouchers = [];

  // Combine multiple vouchers: sum fixed discounts + sum(percentages) applied on subtotal.
  // Assumption: vouchers can stack. Total discount is clamped to subtotal.
  double _calculateDiscount(double subtotal) {
    if (_selectedVouchers.isEmpty) return 0.0;
    double fixed = 0.0;
    double percentSum = 0.0;
    for (final v in _selectedVouchers) {
      if (v.discountAmount != null) fixed += v.discountAmount!;
      if (v.discountPercentage != null) percentSum += v.discountPercentage!;
    }
    final percentDiscount = subtotal * (percentSum / 100.0);
    final total = fixed + percentDiscount;
    return total.clamp(0, subtotal);
  }

  Future<void> _showVoucherPicker(BuildContext context, double subtotal) async {
    // Ensure user's vouchers are loaded from backend (or mock)
    try {
      await ref.read(vouchersProvider.notifier).fetchUserVouchers();
    } catch (_) {}

    final voucherState = ref.read(vouchersProvider);
    final active = voucherState.activeVouchers;

    // Keep a local set of selected ids inside the bottom sheet so user can toggle multiple
  final selectedIds = _selectedVouchers.map((e) => e.id.toString()).whereType<String>().toSet();

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        return StatefulBuilder(builder: (bCtx, setStateSheet) {
          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const ListTile(title: Text('Chọn voucher')),
                  if (active.isEmpty) const Padding(padding: EdgeInsets.all(16), child: Text('Không có voucher')),
                  Flexible(
                    child: ListView.separated(
                      shrinkWrap: true,
                      itemCount: active.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (context, index) {
                        final v = active[index];
                        final id = v.id.toString();
                        final meetsMin = v.minimumOrderAmount == null || subtotal >= v.minimumOrderAmount!;
                        final isSelected = selectedIds.contains(id);
                        return CheckboxListTile(
                          value: isSelected,
                          onChanged: meetsMin
                              ? (val) {
                                  setStateSheet(() {
                                    if (val == true) selectedIds.add(id); else selectedIds.remove(id);
                                  });
                                }
                              : null,
                          title: Row(
                            children: [
                              CircleAvatar(backgroundColor: Colors.grey, child: Text(v.code.isNotEmpty ? v.code.substring(0,1).toUpperCase() : '?')),
                              const SizedBox(width: 12),
                              Expanded(child: Text(v.name)),
                            ],
                          ),
                          subtitle: Text(v.description + (meetsMin ? '' : ' — Yêu cầu tối thiểu ${v.minimumOrderAmount?.toStringAsFixed(0) ?? ''} đ')),
                          secondary: Text(v.discountAmount != null ? '-${v.discountAmount!.toStringAsFixed(0)} đ' : (v.discountPercentage != null ? '${v.discountPercentage!.toStringAsFixed(0)}%' : '')),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(onPressed: () => Navigator.pop(bCtx), child: const Text('Huỷ')),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: () {
                          // Update selected vouchers in the parent state
                          final chosen = active.where((v) => selectedIds.contains(v.id.toString())).toList();
                          setState(() {
                            _selectedVouchers
                              ..clear()
                              ..addAll(chosen);
                          });
                          Navigator.pop(bCtx);
                        },
                        child: const Text('Áp dụng'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),
          );
        });
      }
    );
  }

  @override
  Widget build(BuildContext context) {
    final order = ref.watch(currentOrderProvider);
    final items = ref.watch(orderItemsProvider);

    if (order == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Xác nhận & Thanh toán')),
        body: const Center(child: Text('Không có đơn hàng')),
      );
    }

    double itemsTotal = 0;
    for (final item in items) {
      itemsTotal += (item.price * item.quantity);
    }

    final subtotal = order.subtotal;
  final discount = _calculateDiscount(subtotal);
  final finalAmount = (order.total - discount).clamp(0.0, double.infinity);

    return Scaffold(
      appBar: AppBar(title: const Text('Xác nhận & Thanh toán')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Món đã order', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            Expanded(
              child: ListView.separated(
                itemCount: items.length,
                separatorBuilder: (_, __) => const Divider(),
                itemBuilder: (context, index) {
                  final it = items[index];
                  return ListTile(
                    title: Text(it.name),
                    subtitle: Text('Số lượng: ${it.quantity}'),
                    trailing: Text('${(it.price * it.quantity).toStringAsFixed(0)} đ'),
                  );
                },
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Tạm tính'),
                        Text('${itemsTotal.toStringAsFixed(0)} đ'),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Tạm tính hệ thống'),
                        Text('${subtotal.toStringAsFixed(0)} đ'),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Voucher'),
                        TextButton(
                          onPressed: () => _showVoucherPicker(context, subtotal),
                          child: Text(_selectedVouchers.isEmpty ? 'Chọn voucher' : 'Đã chọn ${_selectedVouchers.length}'),
                        ),
                      ],
                    ),
                    if (_selectedVouchers.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      // Show chosen vouchers
                      Wrap(
                        spacing: 8,
                        runSpacing: 6,
                        children: _selectedVouchers.map((v) => Chip(label: Text(v.code))).toList(),
                      ),
                      const SizedBox(height: 8),
                      Text('Giảm: -${discount.toStringAsFixed(0)} đ'),
                    ],
                    const SizedBox(height: 8),
                    const Divider(),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Tổng cộng', style: Theme.of(context).textTheme.titleMedium),
                        Text('${finalAmount.toStringAsFixed(0)} đ', style: Theme.of(context).textTheme.titleMedium),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                  onPressed: () {
                  // Navigate directly to PaymentScreen and pass computed totals so they match exactly
                  final orderId = order.id.toString();
                  final voucherIds = _selectedVouchers.map((v) => v.id.toString()).whereType<String>().toList();
                  final discount = _calculateDiscount(subtotal);
                  final finalAmount = (order.total - discount).clamp(0.0, double.infinity);
                  Navigator.push(context, MaterialPageRoute(builder: (_) => PaymentScreen(
                    initialOrderId: orderId,
                    initialVoucherIds: voucherIds,
                    initialDiscount: discount,
                    initialFinalAmount: finalAmount,
                    initialSubtotal: subtotal,
                  )));
                },
                child: const Text('Thanh toán'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
