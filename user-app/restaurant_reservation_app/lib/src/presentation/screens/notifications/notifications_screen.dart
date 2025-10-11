import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../application/providers.dart';
import '../../../domain/models/notification.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  String selectedTab = 'all';
  
  @override
  void initState() {
    super.initState();
    // Fetch latest notifications when the screen is first displayed.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _refreshNotifications();
    });
  }




  IconData _getNotificationTypeIcon(NotificationType type) {
    switch (type) {
      case NotificationType.low_stock:
        return Icons.inventory;
      case NotificationType.reservation_confirm:
        return Icons.table_restaurant;
      case NotificationType.promotion:
        return Icons.local_offer;
      case NotificationType.other:
        return Icons.notifications;
    }
  }

  Color _getNotificationTypeColor(NotificationType type) {
    switch (type) {
      case NotificationType.low_stock:
        return Colors.brown;
      case NotificationType.reservation_confirm:
        return Colors.blue;
      case NotificationType.promotion:
        return Colors.green;
      case NotificationType.other:
        return Colors.grey;
    }
  }

  String _getTypeLabel(NotificationType type) {
    switch (type) {
      case NotificationType.low_stock:
        return 'Hàng sắp hết';
      case NotificationType.reservation_confirm:
        return 'Đặt bàn';
      case NotificationType.promotion:
        return 'Khuyến mãi';
      case NotificationType.other:
        return 'Thông báo';
    }
  }

  void _markAsRead(String notificationId) {
    // Attempt remote mark-as-read, but always update local UI state optimistically.
    () async {
      try {
        final repo = ref.read(notificationRepositoryProvider);
        await repo.markAsRead(notificationId);
      } catch (_) {
        // ignore remote failure; we still mark locally for UX
      }
      ref.read(notificationsProvider.notifier).markAsRead(notificationId);
    }();
  }

  void _markAllAsRead() {
    // Mark all locally (backend currently may not support bulk markAll)
    ref.read(notificationsProvider.notifier).markAllAsRead();
  }

  Future<void> _refreshNotifications() async {
    try {
      final repo = ref.read(notificationRepositoryProvider);
      final raw = await repo.getNotifications();
      ref.read(notificationsProvider.notifier).setNotifications(raw);
    } catch (e) {
      // ignore: avoid_print
      print('Failed to refresh notifications: $e');
    }
  }

  void _deleteNotification(String notificationId) {
    // Implement delete notification
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Đã xóa thông báo')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final notifications = ref.watch(notificationsProvider);
    final unreadCount = ref.watch(unreadNotificationsProvider);

    final filteredNotifications = notifications.where((notification) {
      switch (selectedTab) {
        case 'all':
          return true;
        case 'unread':
          return !notification.isRead;
        case 'booking':
          return notification.type == NotificationType.reservation_confirm;
        case 'reminder':
          return notification.type == NotificationType.reservation_confirm;
        case 'voucher':
          return notification.type == NotificationType.promotion;
        case 'event':
          return notification.type == NotificationType.other;
        default:
          return true;
      }
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Thông báo'),
        actions: [
          if (unreadCount > 0)
            IconButton(
              onPressed: _markAllAsRead,
              icon: const Icon(Icons.done_all),
              tooltip: 'Đánh dấu tất cả đã đọc',
            ),
        ],
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
                        backgroundColor: selectedTab == 'all'
                            ? Theme.of(context).colorScheme.background
                            : Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6.0),
                        ),
                      ),
                      onPressed: () => setState(() => selectedTab = 'all'),
                      child: Text(
                        'Tất cả',
                        style: TextStyle(
                          color: selectedTab == 'all'
                              ? Theme.of(context).colorScheme.primary
                              : Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: TextButton(
                      style: TextButton.styleFrom(
                        backgroundColor: selectedTab == 'unread'
                            ? Theme.of(context).colorScheme.background
                            : Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6.0),
                        ),
                      ),
                      onPressed: () => setState(() => selectedTab = 'unread'),
                      child: Text(
                        'Chưa đọc ($unreadCount)',
                        style: TextStyle(
                          color: selectedTab == 'unread'
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
      body: SafeArea(
        child: Column(
          children: [
          // Category filters
          Container(
            height: 50,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                FilterChip(
                  label: const Text('Đặt bàn'),
                  selected: selectedTab == 'booking',
                  onSelected: (selected) {
                    setState(() {
                      selectedTab = selected ? 'booking' : 'all';
                    });
                  },
                ),
                const SizedBox(width: 8),
                FilterChip(
                  label: const Text('Nhắc nhở'),
                  selected: selectedTab == 'reminder',
                  onSelected: (selected) {
                    setState(() {
                      selectedTab = selected ? 'reminder' : 'all';
                    });
                  },
                ),
                const SizedBox(width: 8),
                FilterChip(
                  label: const Text('Voucher'),
                  selected: selectedTab == 'voucher',
                  onSelected: (selected) {
                    setState(() {
                      selectedTab = selected ? 'voucher' : 'all';
                    });
                  },
                ),
                const SizedBox(width: 8),
                FilterChip(
                  label: const Text('Sự kiện'),
                  selected: selectedTab == 'event',
                  onSelected: (selected) {
                    setState(() {
                      selectedTab = selected ? 'event' : 'all';
                    });
                  },
                ),
              ],
            ),
          ),
          
          // Notifications list
          Expanded(
            child: filteredNotifications.isEmpty
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.notifications_none, size: 64, color: Colors.grey),
                        SizedBox(height: 16),
                        Text(
                          'Không có thông báo',
                          style: TextStyle(
                            fontSize: 18,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _refreshNotifications,
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: filteredNotifications.length,
                      itemBuilder: (context, index) {
                        final notification = filteredNotifications[index];
                        return _buildNotificationCard(notification);
                      },
                    ),
                  ),
          ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationCard(AppNotification notification) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: _getNotificationTypeColor(notification.type).withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Icon(
            _getNotificationTypeIcon(notification.type),
            color: _getNotificationTypeColor(notification.type),
            size: 20,
          ),
        ),
        title: Row(
          children: [
            Expanded(
              child: Text(
                  _getTypeLabel(notification.type),
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: notification.isRead ? FontWeight.normal : FontWeight.bold,
                  ),
                ),
            ),
            if (!notification.isRead)
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primary,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              notification.content,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Text(
                  notification.sentAt != null
                      ? '${notification.sentAt!.day}/${notification.sentAt!.month}/${notification.sentAt!.year} ${notification.sentAt!.hour}:${notification.sentAt!.minute.toString().padLeft(2, '0')}'
                      : '-',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: _getNotificationTypeColor(notification.type).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: _getNotificationTypeColor(notification.type),
                      width: 1,
                    ),
                  ),
                  child: Text(
                    _getTypeLabel(notification.type),
                    style: TextStyle(
                      color: _getNotificationTypeColor(notification.type),
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
        trailing: PopupMenuButton<String>(
          onSelected: (value) {
            switch (value) {
              case 'mark_read':
                if (!notification.isRead) {
                  _markAsRead(notification.id);
                }
                break;
              case 'delete':
                _deleteNotification(notification.id);
                break;
            }
          },
          itemBuilder: (context) => [
            if (!notification.isRead)
              const PopupMenuItem(
                value: 'mark_read',
                child: Row(
                  children: [
                    Icon(Icons.mark_email_read),
                    SizedBox(width: 8),
                    Text('Đánh dấu đã đọc'),
                  ],
                ),
              ),
            const PopupMenuItem(
              value: 'delete',
              child: Row(
                children: [
                  Icon(Icons.delete, color: Colors.red),
                  SizedBox(width: 8),
                  Text('Xóa'),
                ],
              ),
            ),
          ],
        ),
        onTap: () {
          if (!notification.isRead) {
            _markAsRead(notification.id);
          }
        },
      ),
    );
  }
}