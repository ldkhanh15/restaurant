import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../application/providers.dart';
import '../../../domain/models/user.dart';
import '../../../domain/models/order.dart';

class AccountManagementScreen extends ConsumerStatefulWidget {
  const AccountManagementScreen({super.key});

  @override
  ConsumerState<AccountManagementScreen> createState() => _AccountManagementScreenState();
}

class _AccountManagementScreenState extends ConsumerState<AccountManagementScreen> {
  String activeTab = 'profile';
  bool isEditing = false;
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();


  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  String _formatPrice(double price) {
    return '${price.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    )}đ';
  }

  String _getStatusText(OrderStatus status) {
    switch (status) {
      case OrderStatus.created:
        return 'Đã tạo';
      case OrderStatus.sentToKitchen:
        return 'Đã gửi bếp';
      case OrderStatus.completed:
        return 'Hoàn thành';
      case OrderStatus.cancelled:
        return 'Đã hủy';
    }
  }

  Color _getStatusColor(OrderStatus status) {
    switch (status) {
      case OrderStatus.created:
        return Colors.blue;
      case OrderStatus.sentToKitchen:
        return Colors.orange;
      case OrderStatus.completed:
        return Colors.green;
      case OrderStatus.cancelled:
        return Colors.red;
    }
  }

  void _handleSaveProfile() {
    final user = ref.read(userProvider);
    if (user != null) {
      final updatedUser = user.copyWith(
        name: _nameController.text,
        email: _emailController.text,
        phone: _phoneController.text,
        address: _addressController.text,
      );
      ref.read(userProvider.notifier).setUser(updatedUser);
      setState(() {
        isEditing = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đã cập nhật thông tin')),
      );
    }
  }

  void _startEditing() {
    final user = ref.read(userProvider);
    if (user != null) {
      _nameController.text = user.name;
      _emailController.text = user.email;
      _phoneController.text = user.phone ?? '';
      _addressController.text = user.address ?? '';
      setState(() {
        isEditing = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(userProvider);
    final orderHistory = ref.watch(orderHistoryProvider);

    if (user == null) {
      return const Scaffold(
        body: Center(child: Text('Chưa đăng nhập')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tài khoản'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48.0),
          child: Padding(
            padding: const EdgeInsets.all(8.0),
            child: Container(
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceVariant,
                borderRadius: BorderRadius.circular(8.0),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextButton(
                      style: TextButton.styleFrom(
                        backgroundColor: activeTab == 'profile'
                            ? Theme.of(context).colorScheme.background
                            : Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6.0),
                        ),
                      ),
                      onPressed: () => setState(() => activeTab = 'profile'),
                      child: Text(
                        'Hồ sơ',
                        style: TextStyle(
                          color: activeTab == 'profile'
                              ? Theme.of(context).colorScheme.primary
                              : Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: TextButton(
                      style: TextButton.styleFrom(
                        backgroundColor: activeTab == 'orders'
                            ? Theme.of(context).colorScheme.background
                            : Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6.0),
                        ),
                      ),
                      onPressed: () => setState(() => activeTab = 'orders'),
                      child: Text(
                        'Đơn hàng',
                        style: TextStyle(
                          color: activeTab == 'orders'
                              ? Theme.of(context).colorScheme.primary
                              : Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: TextButton(
                      style: TextButton.styleFrom(
                        backgroundColor: activeTab == 'settings'
                            ? Theme.of(context).colorScheme.background
                            : Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6.0),
                        ),
                      ),
                      onPressed: () => setState(() => activeTab = 'settings'),
                      child: Text(
                        'Cài đặt',
                        style: TextStyle(
                          color: activeTab == 'settings'
                              ? Theme.of(context).colorScheme.primary
                              : Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      body: Builder(
        builder: (context) {
          if (activeTab == 'profile') {
            return _buildProfileTab(user);
          } else if (activeTab == 'orders') {
            return _buildOrdersTab(orderHistory);
          } else if (activeTab == 'settings') {
            return _buildSettingsTab();
          }
          return const Center(child: Text('Chọn một tab'));
        },
      ),
    );
  }

  Widget _buildProfileTab(AppUser user) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Profile header
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 50,
                    backgroundImage: user.avatar != null 
                        ? NetworkImage(user.avatar!) 
                        : null,
                    child: user.avatar == null 
                        ? const Icon(Icons.person, size: 50)
                        : null,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    user.name,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    user.email,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      Column(
                        children: [
                          Text(
                            '${user.loyaltyPoints}',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                          ),
                          const Text('Điểm tích lũy'),
                        ],
                      ),
                      Column(
                        children: [
                          Text(
                            '${user.totalOrders}',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                          ),
                          const Text('Đơn hàng'),
                        ],
                      ),
                      Column(
                        children: [
                          Text(
                            user.membershipTier,
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                          ),
                          const Text('Hạng thành viên'),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Profile form
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        'Thông tin cá nhân',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const Spacer(),
                      if (!isEditing)
                        TextButton.icon(
                          onPressed: _startEditing,
                          icon: const Icon(Icons.edit),
                          label: const Text('Chỉnh sửa'),
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (isEditing) ...[
                    TextField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        labelText: 'Họ tên',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _emailController,
                      decoration: const InputDecoration(
                        labelText: 'Email',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _phoneController,
                      decoration: const InputDecoration(
                        labelText: 'Số điện thoại',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _addressController,
                      decoration: const InputDecoration(
                        labelText: 'Địa chỉ',
                        border: OutlineInputBorder(),
                      ),
                      maxLines: 2,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => setState(() => isEditing = false),
                            child: const Text('Hủy'),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _handleSaveProfile,
                            child: const Text('Lưu'),
                          ),
                        ),
                      ],
                    ),
                  ] else ...[
                    _buildInfoRow('Họ tên', user.name),
                    _buildInfoRow('Email', user.email),
                    _buildInfoRow('Số điện thoại', user.phone ?? 'Chưa cập nhật'),
                    _buildInfoRow('Địa chỉ', user.address ?? 'Chưa cập nhật'),
                    if (user.birthDate != null)
                      _buildInfoRow('Ngày sinh', '${user.birthDate!.day}/${user.birthDate!.month}/${user.birthDate!.year}'),
                    if (user.joinDate != null)
                      _buildInfoRow('Tham gia', '${user.joinDate!.day}/${user.joinDate!.month}/${user.joinDate!.year}'),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              value,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrdersTab(List<Order> orders) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: orders.length,
      itemBuilder: (context, index) {
        final order = orders[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Đơn hàng #${order.id}',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _getStatusColor(order.status).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: _getStatusColor(order.status)),
                      ),
                      child: Text(
                        _getStatusText(order.status),
                        style: TextStyle(
                          color: _getStatusColor(order.status),
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Ngày: ${order.createdAt.day}/${order.createdAt.month}/${order.createdAt.year} ${order.createdAt.hour}:${order.createdAt.minute.toString().padLeft(2, '0')}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: 8),
                Text(
                  'Số món: ${order.items.length}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: 8),
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
                      _formatPrice(order.total),
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSettingsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.notifications),
                title: const Text('Thông báo'),
                subtitle: const Text('Quản lý thông báo'),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: () {
                  // Navigate to notifications settings
                },
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.security),
                title: const Text('Bảo mật'),
                subtitle: const Text('Mật khẩu và xác thực'),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: () {
                  // Navigate to security settings
                },
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.privacy_tip),
                title: const Text('Quyền riêng tư'),
                subtitle: const Text('Cài đặt quyền riêng tư'),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: () {
                  // Navigate to privacy settings
                },
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Card(
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.rate_review),
                title: const Text('Đánh giá & Khiếu nại'),
                subtitle: const Text('Viết đánh giá và phản hồi'),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: () {
                  context.push('/reviews');
                },
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.local_offer),
                title: const Text('Voucher của tôi'),
                subtitle: const Text('Quản lý voucher đã đổi'),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: () {
                  context.push('/vouchers');
                },
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.chat),
                title: const Text('Chat với nhà hàng'),
                subtitle: const Text('Hỗ trợ trực tuyến'),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: () {
                  context.push('/chat');
                },
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.help),
                title: const Text('Trợ giúp'),
                subtitle: const Text('Câu hỏi thường gặp'),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: () {
                  // Navigate to help
                },
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.info),
                title: const Text('Về ứng dụng'),
                subtitle: const Text('Phiên bản và thông tin'),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: () {
                  // Navigate to about
                },
              ),
            ],
          ),
        ),
      ],
    );
  }
}
