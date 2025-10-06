import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Tài khoản')),
      body: ListView(
        children: [
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


