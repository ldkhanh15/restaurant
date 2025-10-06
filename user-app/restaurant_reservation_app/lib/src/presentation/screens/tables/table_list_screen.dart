import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class TableListScreen extends StatelessWidget {
  const TableListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Danh sách bàn')),
      body: ListView(
        children: [
          ListTile(
            title: const Text('Xem sơ đồ bàn'),
            trailing: const Icon(Icons.map_outlined),
            onTap: () => context.go('/home/tables/map'),
          ),
          ListTile(
            title: const Text('Đặt bàn của tôi'),
            trailing: const Icon(Icons.event_note_outlined),
            onTap: () => context.go('/home/tables/my'),
          ),
        ],
      ),
    );
  }
}


