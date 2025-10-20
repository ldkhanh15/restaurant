import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../application/providers.dart';

class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(userProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Tài khoản')),
      body: ListView(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: user == null
                    ? Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Chưa đăng nhập', style: Theme.of(context).textTheme.titleMedium),
                          const SizedBox(height: 8),
                          TextButton(
                            onPressed: () => context.go('/auth/login'),
                            child: const Text('Đăng nhập'),
                          ),
                        ],
                      )
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 32,
                                backgroundImage: user.avatar != null ? NetworkImage(user.avatar!) : null,
                                child: user.avatar == null ? const Icon(Icons.person) : null,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(user.name, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                                    const SizedBox(height: 4),
                                    Text(user.email, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Column(
                                  children: [
                                    Text('${user.loyaltyPoints}', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.primary)),
                                    const Text('Điểm'),
                                  ],
                                ),
                              ),
                              Expanded(
                                child: Column(
                                  children: [
                                    Text(user.membershipTier, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.primary)),
                                    const Text('Hạng'),
                                  ],
                                ),
                              ),
                              TextButton(
                                onPressed: () => context.go('/home/account/loyalty'),
                                child: const Text('Xem chi tiết'),
                              ),
                            ],
                          ),
                        ],
                      ),
              ),
            ),
          ),

          ListTile(
            title: const Text('Chương trình tích điểm'),
            trailing: const Icon(Icons.workspace_premium_outlined),
            onTap: () => context.go('/home/account/loyalty'),
          ),
          ListTile(
            title: const Text('Thông báo'),
            trailing: const Icon(Icons.notifications_outlined),
            onTap: () => context.go('/home/account/notifications'),
          ),
          ListTile(
            title: const Text('Sự kiện'),
            trailing: const Icon(Icons.celebration_outlined),
            onTap: () => context.go('/home/account/events'),
          ),
        ],
      ),
    );
  }
}


