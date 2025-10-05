import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Giỏ hàng')),
      body: Center(
        child: ElevatedButton(
          onPressed: () => context.go('/home/menu/confirm'),
          child: const Text('Xác nhận đơn'),
        ),
      ),
    );
  }
}


