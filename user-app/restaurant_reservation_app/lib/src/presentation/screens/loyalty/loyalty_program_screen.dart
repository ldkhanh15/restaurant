import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../application/providers.dart';
import '../../widgets/app_bottom_navigation.dart';
import '../../widgets/main_navigation.dart';
import '../../../domain/models/loyalty.dart';
import '../../../domain/models/voucher.dart';

class LoyaltyProgramScreen extends ConsumerStatefulWidget {
  const LoyaltyProgramScreen({super.key});

  @override
  ConsumerState<LoyaltyProgramScreen> createState() => _LoyaltyProgramScreenState();
}

class _LoyaltyProgramScreenState extends ConsumerState<LoyaltyProgramScreen> {

  @override
  Widget build(BuildContext context) {
  final user = ref.watch(userProvider);
  final loyaltyPoints = (user?.loyaltyPoints ?? ref.watch(loyaltyPointsProvider)) ?? 0;
  final membershipTier = (user?.membershipTier ?? ref.watch(membershipTierProvider)) as String;
    final rewards = ref.watch(rewardsProvider);
    final pointHistory = ref.watch(pointHistoryProvider);

    return Scaffold(
      bottomNavigationBar: (context.findAncestorWidgetOfExactType<MainNavigation>() == null)
          ? const AppBottomNavigation(selectedIndex: 3)
          : null,
      appBar: AppBar(
        title: const Text('Chương trình thành viên'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Current status
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 60,
                          height: 60,
                          decoration: BoxDecoration(
                            color: _getTierColor(membershipTier),
                            borderRadius: BorderRadius.circular(30),
                          ),
                          child: Icon(
                            _getTierIcon(membershipTier),
                            color: Colors.white,
                            size: 30,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Hạng $membershipTier',
                                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                '$loyaltyPoints điểm tích lũy',
                                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                  color: Theme.of(context).colorScheme.primary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    LinearProgressIndicator(
                      value: _getProgressToNextTier(loyaltyPoints, membershipTier),
                      backgroundColor: Colors.grey[300],
                      valueColor: AlwaysStoppedAnimation<Color>(
                        Theme.of(context).colorScheme.primary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _getProgressText(loyaltyPoints, membershipTier),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Tier policies section
            Text(
              'Chính sách thành viên',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),

            // Tier cards (dynamic, highlight current tier)
            Column(
              children: () {
                final tiers = [
                  {
                    'name': 'Regular',
                    'threshold': 0,
                    'benefits': [
                      'Nhanh chóng tạo tài khoản',
                      'Không có ưu đãi đặc biệt',
                    ]
                  },
                  {
                    'name': 'VIP',
                    'threshold': 1000,
                    'benefits': [
                      'Ưu đãi 5% cho một số mặt hàng',
                      'Quà sinh nhật',
                      'Ưu tiên đặt bàn',
                    ]
                  },
                  {
                    'name': 'Platinum',
                    'threshold': 2500,
                    'benefits': [
                      'Ưu đãi 10% cho toàn bộ hóa đơn',
                      'Quà tặng định kỳ',
                      'Hỗ trợ khách hàng ưu tiên',
                    ]
                  }
                ];

                final List<Widget> widgets = [];
                for (var i = 0; i < tiers.length; i++) {
                  final t = tiers[i];
                  final name = (t['name'] as String);
                  final threshold = (t['threshold'] as int);
                  final benefits = (t['benefits'] as List<String>);
                  final isCurrent = name.toLowerCase() == membershipTier.toLowerCase();
                  widgets.add(_buildTierCard(context, name, threshold, benefits, isCurrent: isCurrent, currentPoints: isCurrent ? loyaltyPoints : null));
                  if (i != tiers.length - 1) widgets.add(const SizedBox(height: 8));
                }
                return widgets;
              }(),
            ),

            const SizedBox(height: 16),

            // Earning rules and conditions
            Text(
              'Cách tích điểm & điều kiện lên hạng',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Cách tích điểm:', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    _buildBullet(context, '1 điểm cho mỗi 1.000₫ chi tiêu (ví dụ: chi 100.000₫ → 100 điểm).'),
                    _buildBullet(context, 'Thưởng điểm nhân dịp sinh nhật (nếu cập nhật ngày sinh).'),
                    _buildBullet(context, 'Chương trình khuyến mãi đặc biệt có thể nhân điểm x2/x3.'),
                    const SizedBox(height: 12),
                    Text('Điều kiện lên hạng:', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    _buildBullet(context, 'Từ Regular → VIP: đạt 1.000 điểm.'),
                    _buildBullet(context, 'Từ VIP → Platinum: đạt 2.500 điểm.'),
                    _buildBullet(context, 'Điểm tích lũy có thể có thời hạn; vui lòng kiểm tra điều khoản chi tiết.'),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Rewards section
            Text(
              'Phần thưởng có sẵn',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ...rewards.map((reward) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: reward.available 
                        ? Theme.of(context).colorScheme.primary.withOpacity(0.1)
                        : Colors.grey.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Icon(
                    _getRewardIcon(reward.category),
                    color: reward.available 
                        ? Theme.of(context).colorScheme.primary
                        : Colors.grey,
                  ),
                ),
                title: Text(reward.name),
                subtitle: Text(reward.description),
                trailing: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '${reward.pointsRequired} điểm',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: reward.available 
                            ? Theme.of(context).colorScheme.primary
                            : Colors.grey,
                      ),
                    ),
                    if (!reward.available)
                      const Text(
                        'Không khả dụng',
                        style: TextStyle(
                          color: Colors.grey,
                          fontSize: 12,
                        ),
                      ),
                  ],
                ),
                onTap: reward.available ? () {
                  _showRewardDialog(reward);
                } : null,
              ),
            )).toList(),

            const SizedBox(height: 24),

            // Point history
            Text(
              'Lịch sử điểm',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ...pointHistory.map((transaction) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: transaction.type == PointTransactionType.earn
                        ? Colors.green.withOpacity(0.1)
                        : Colors.red.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Icon(
                    transaction.type == PointTransactionType.earn
                        ? Icons.add
                        : Icons.remove,
                    color: transaction.type == PointTransactionType.earn
                        ? Colors.green
                        : Colors.red,
                  ),
                ),
                title: Text(transaction.description),
                subtitle: Text(
                  '${transaction.date.day}/${transaction.date.month}/${transaction.date.year}',
                ),
                trailing: Text(
                  '${transaction.type == PointTransactionType.earn ? '+' : '-'}${transaction.points}',
                  style: TextStyle(
                    color: transaction.type == PointTransactionType.earn
                        ? Colors.green
                        : Colors.red,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            )).toList(),
          ],
        ),
      ),
    );
  }

  Color _getTierColor(String tier) {
    switch (tier.toLowerCase()) {
      case 'regular':
        return Colors.grey;
      case 'vip':
        return Colors.amber;
      case 'platinum':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  IconData _getTierIcon(String tier) {
    switch (tier.toLowerCase()) {
      case 'regular':
        return Icons.person;
      case 'vip':
        return Icons.star;
      case 'platinum':
        return Icons.diamond;
      default:
        return Icons.person;
    }
  }

  IconData _getRewardIcon(RewardCategory category) {
    switch (category) {
      case RewardCategory.discount:
        return Icons.local_offer;
      case RewardCategory.freebie:
        return Icons.card_giftcard;
      case RewardCategory.upgrade:
        return Icons.upgrade;
    }
  }

  double _getProgressToNextTier(int currentPoints, String currentTier) {
    // Mock progress calculation
    switch (currentTier.toLowerCase()) {
      case 'regular':
        return (currentPoints / 1000).clamp(0.0, 1.0);
      case 'vip':
        return ((currentPoints - 1000) / 1500).clamp(0.0, 1.0);
      case 'platinum':
        return 1.0; // Already at highest tier
      default:
        return 0.0;
    }
  }

  String _getProgressText(int currentPoints, String currentTier) {
    switch (currentTier.toLowerCase()) {
      case 'regular':
        final remaining = 1000 - currentPoints;
        return remaining > 0 
            ? 'Còn $remaining điểm để lên VIP'
            : 'Đã đủ điều kiện lên VIP';
      case 'vip':
        final remaining = 2500 - currentPoints;
        return remaining > 0 
            ? 'Còn $remaining điểm để lên Platinum'
            : 'Đã đủ điều kiện lên Platinum';
      case 'platinum':
        return 'Đã đạt hạng cao nhất';
      default:
        return '';
    }
  }

  void _showRewardDialog(Reward reward) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(reward.name),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(reward.description),
            const SizedBox(height: 16),
            Text(
              'Điểm cần thiết: ${reward.pointsRequired}',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              'Hạn sử dụng: ${reward.validUntil.day}/${reward.validUntil.month}/${reward.validUntil.year}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Đóng'),
          ),
          ElevatedButton(
            onPressed: () {
              _redeemReward(reward);
              Navigator.pop(context);
            },
            child: const Text('Đổi ngay'),
          ),
        ],
      ),
    );
  }

  void _redeemReward(Reward reward) {
    final loyaltyPoints = ref.read(loyaltyPointsProvider);
    
    if (loyaltyPoints >= reward.pointsRequired) {
      // Deduct points
      ref.read(loyaltyPointsProvider.notifier).deductPoints(reward.pointsRequired);
      
      // Add point history
      ref.read(pointHistoryProvider.notifier).addTransaction(
        PointHistory(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          type: PointTransactionType.redeem,
          points: -reward.pointsRequired,
          description: 'Đổi ${reward.name}',
          date: DateTime.now(),
        ),
      );
      
      // Create voucher
      final voucher = Voucher(
        id: 'voucher_${DateTime.now().millisecondsSinceEpoch}',
        code: 'REWARD${DateTime.now().millisecondsSinceEpoch}',
        name: reward.name,
        description: reward.description,
        type: _mapRewardCategoryToVoucherType(reward.category),
        status: VoucherStatus.active,
        discountPercentage: reward.category == RewardCategory.discount ? 15.0 : null,
        createdAt: DateTime.now(),
        validFrom: DateTime.now(),
        validUntil: DateTime.now().add(const Duration(days: 30)),
        iconPath: 'assets/icons/voucher.png',
        colorHex: '#4CAF50',
      );
      
      // Add voucher to user's collection
      ref.read(vouchersProvider.notifier).addVoucher(voucher);
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Đã đổi ${reward.name} thành công! Kiểm tra trong mục Voucher.'),
          action: SnackBarAction(
            label: 'Xem voucher',
            onPressed: () => context.push('/vouchers'),
          ),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Không đủ điểm để đổi phần thưởng này'),
        ),
      );
    }
  }

  VoucherType _mapRewardCategoryToVoucherType(RewardCategory category) {
    switch (category) {
      case RewardCategory.discount:
        return VoucherType.discount;
      case RewardCategory.freebie:
        return VoucherType.freebie;
      case RewardCategory.upgrade:
        return VoucherType.upgrade;
    }
  }

  Widget _buildTierCard(BuildContext context, String name, int threshold, List<String> benefits, {bool isCurrent = false, int? currentPoints}) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: isCurrent ? Theme.of(context).colorScheme.primary : _getTierColor(name),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Icon(_getTierIcon(name), color: Colors.white),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(child: Text('Hạng $name', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold))),
                      if (isCurrent)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text('${currentPoints ?? 0} điểm', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white)),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text('Yêu cầu: $threshold điểm', style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(height: 8),
                  ...benefits.map((b) => Text('• $b', style: Theme.of(context).textTheme.bodySmall)).toList(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBullet(BuildContext context, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('• ', style: TextStyle(fontSize: 16)),
          Expanded(child: Text(text, style: Theme.of(context).textTheme.bodySmall)),
        ],
      ),
    );
  }
}