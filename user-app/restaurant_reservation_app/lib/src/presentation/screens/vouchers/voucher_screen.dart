import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../application/providers.dart';
import '../../../domain/models/voucher.dart';
import '../../../data/datasources/api_config.dart';
import '../../../data/services/voucher_app_user_service_app_user.dart';

class VoucherScreen extends ConsumerStatefulWidget {
  const VoucherScreen({super.key});

  @override
  ConsumerState<VoucherScreen> createState() => _VoucherScreenState();
}

class _VoucherScreenState extends ConsumerState<VoucherScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final vouchersNotifier = ref.watch(vouchersProvider.notifier);
    final activeVouchers = vouchersNotifier.activeVouchers;
    final usedVouchers = vouchersNotifier.usedVouchers;
    final expiredVouchers = vouchersNotifier.expiredVouchers;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Voucher của tôi'),
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.local_offer),
                  const SizedBox(width: 8),
                  Text('Có thể dùng (${activeVouchers.length})'),
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.check_circle),
                  const SizedBox(width: 8),
                  Text('Đã dùng (${usedVouchers.length})'),
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.access_time),
                  const SizedBox(width: 8),
                  Text('Hết hạn (${expiredVouchers.length})'),
                ],
              ),
            ),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildVoucherList(activeVouchers, VoucherStatus.active),
          _buildVoucherList(usedVouchers, VoucherStatus.used),
          _buildVoucherList(expiredVouchers, VoucherStatus.expired),
        ],
      ),
    );
  }

  Widget _buildVoucherList(List<Voucher> vouchers, VoucherStatus status) {
    if (vouchers.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              status == VoucherStatus.active 
                ? Icons.local_offer_outlined
                : status == VoucherStatus.used
                  ? Icons.check_circle_outline
                  : Icons.access_time_outlined,
              size: 64,
              color: Theme.of(context).colorScheme.outline,
            ),
            const SizedBox(height: 16),
            Text(
              status == VoucherStatus.active 
                ? 'Chưa có voucher khả dụng'
                : status == VoucherStatus.used
                  ? 'Chưa sử dụng voucher nào'
                  : 'Chưa có voucher hết hạn',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: Theme.of(context).colorScheme.outline,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              status == VoucherStatus.active 
                ? 'Tích điểm để đổi voucher hấp dẫn!'
                : status == VoucherStatus.used
                  ? 'Các voucher đã sử dụng sẽ hiển thị ở đây'
                  : 'Các voucher hết hạn sẽ hiển thị ở đây',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.outline,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: vouchers.length,
      itemBuilder: (context, index) {
        final voucher = vouchers[index];
        return _buildVoucherCard(voucher);
      },
    );
  }

  Widget _buildVoucherCard(Voucher voucher) {
    final isActive = voucher.status == VoucherStatus.active && voucher.isValid;
    final isUsed = voucher.status == VoucherStatus.used;
    final isExpired = voucher.isExpired || voucher.status == VoucherStatus.expired;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Stack(
        children: [
          // Main content
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Icon
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: Color(int.parse(voucher.colorHex.replaceFirst('#', '0xFF'))).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    _getVoucherIcon(voucher.type),
                    size: 32,
                    color: Color(int.parse(voucher.colorHex.replaceFirst('#', '0xFF'))),
                  ),
                ),
                const SizedBox(width: 16),
                
                // Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        voucher.name,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: isActive ? null : Theme.of(context).colorScheme.outline,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        voucher.description,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: isActive ? null : Theme.of(context).colorScheme.outline,
                        ),
                      ),
                      const SizedBox(height: 8),
                      
                      // Voucher details
                      if (voucher.minimumOrderAmount != null) ...[
                        Row(
                          children: [
                            Icon(
                              Icons.shopping_cart_outlined,
                              size: 16,
                              color: Theme.of(context).colorScheme.outline,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'Đơn tối thiểu: ${voucher.minimumOrderAmount!.toStringAsFixed(0)}đ',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Theme.of(context).colorScheme.outline,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                      ],
                      
                      // Expiry date
                      Row(
                        children: [
                          Icon(
                            Icons.access_time,
                            size: 16,
                            color: isExpired ? Colors.red : Theme.of(context).colorScheme.outline,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            isUsed 
                              ? 'Đã sử dụng: ${voucher.usedAt!.day}/${voucher.usedAt!.month}/${voucher.usedAt!.year}'
                              : 'HSD: ${voucher.displayValidUntil}',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: isExpired ? Colors.red : Theme.of(context).colorScheme.outline,
                            ),
                          ),
                        ],
                      ),
                      
                      const SizedBox(height: 8),
                      
                      // Voucher code
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: Theme.of(context).colorScheme.outline,
                            style: BorderStyle.solid,
                          ),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          voucher.code,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                
                // Action button
                if (isActive) ...[
                  const SizedBox(width: 16),
                  ElevatedButton(
                    onPressed: () => _showUseVoucherDialog(voucher),
                    child: const Text('Sử dụng'),
                  ),
                ],
              ],
            ),
          ),
          
          // Status overlay
          if (!isActive) ...[
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.7),
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            if (isUsed) ...[
              Positioned(
                top: 16,
                right: 16,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.green,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(
                    'ĐÃ DÙNG',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ] else if (isExpired) ...[
              Positioned(
                top: 16,
                right: 16,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.red,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(
                    'HẾT HẠN',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }

  IconData _getVoucherIcon(VoucherType type) {
    switch (type) {
      case VoucherType.discount:
        return Icons.percent;
      case VoucherType.freebie:
        return Icons.card_giftcard;
      case VoucherType.upgrade:
        return Icons.upgrade;
    }
  }

  void _showUseVoucherDialog(Voucher voucher) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sử dụng voucher'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Bạn có muốn sử dụng voucher "${voucher.name}" không?'),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceVariant,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    voucher.name,
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  const SizedBox(height: 4),
                  Text(voucher.description),
                  if (voucher.minimumOrderAmount != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      'Đơn tối thiểu: ${voucher.minimumOrderAmount!.toStringAsFixed(0)}đ',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () async {
              // In a real app, this would be used during checkout
              // For now, we'll just mark it as used with a mock order ID
              // If ApiConfig.baseUrl is set, call backend to create a voucher usage and persist it
                if (ApiConfig.baseUrl.isNotEmpty) {
                final service = VoucherAppUserService();
                try {
                  final usage = await service.createVoucherUsage({
                    'voucher_id': voucher.id,
                    'order_id': 'order_${DateTime.now().millisecondsSinceEpoch}',
                    'user_id': ref.read(userProvider)?.id,
                  });

                  if (usage != null) {
                    // Update local provider to mark voucher used
                    ref.read(vouchersProvider.notifier).useVoucher(voucher.id, usage['order_id'] ?? 'order_${DateTime.now().millisecondsSinceEpoch}');
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Voucher đã được áp dụng')));
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Không thể sử dụng voucher')));
                  }
                } catch (e) {
                  // Fallback to local behavior on error
                  ref.read(vouchersProvider.notifier).useVoucher(voucher.id, 'mock_order_${DateTime.now().millisecondsSinceEpoch}');
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Không thể kết nối server, voucher đã được áp dụng cục bộ')));
                }
              } else {
                ref.read(vouchersProvider.notifier).useVoucher(voucher.id, 'mock_order_${DateTime.now().millisecondsSinceEpoch}');
              }
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Đã sử dụng voucher "${voucher.name}"'),
                ),
              );
            },
            child: const Text('Sử dụng'),
          ),
        ],
      ),
    );
  }
}

