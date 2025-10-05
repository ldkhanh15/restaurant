import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../application/providers.dart';

class CustomerChatScreen extends ConsumerStatefulWidget {
  const CustomerChatScreen({super.key});

  @override
  ConsumerState<CustomerChatScreen> createState() => _CustomerChatScreenState();
}

class _CustomerChatScreenState extends ConsumerState<CustomerChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage() {
    final message = _messageController.text.trim();
    if (message.isEmpty) return;

    // Add user message
    ref.read(chatMessagesProvider.notifier).addMessage({
      'id': DateTime.now().millisecondsSinceEpoch.toString(),
      'text': message,
      'isUser': true,
      'timestamp': DateTime.now(),
      'status': 'sent',
    });

    _messageController.clear();

    // Simulate staff typing
    ref.read(isTypingProvider.notifier).setTyping(true);

    // Simulate staff response
    Future.delayed(const Duration(seconds: 2), () {
      ref.read(isTypingProvider.notifier).setTyping(false);
      ref.read(chatMessagesProvider.notifier).addMessage({
        'id': DateTime.now().millisecondsSinceEpoch.toString(),
        'text': _generateStaffResponse(message),
        'isUser': false,
        'timestamp': DateTime.now(),
        'status': 'delivered',
      });
    });
  }

  String _generateStaffResponse(String userMessage) {
    final message = userMessage.toLowerCase();
    
    if (message.contains('menu') || message.contains('thực đơn')) {
      return 'Chào bạn! Chúng tôi có nhiều món ăn ngon. Bạn có thể xem thực đơn chi tiết trên ứng dụng. Có gì cần tư vấn thêm không ạ?';
    } else if (message.contains('đặt bàn') || message.contains('reservation')) {
      return 'Bạn muốn đặt bàn cho bao nhiêu người và thời gian nào ạ? Tôi sẽ kiểm tra bàn trống cho bạn.';
    } else if (message.contains('giá') || message.contains('price')) {
      return 'Giá cả của chúng tôi rất hợp lý! Phí đặt bàn từ 150,000đ - 600,000đ. Món ăn từ 20,000đ - 80,000đ. Bạn có muốn tôi gửi thực đơn chi tiết không?';
    } else if (message.contains('thời gian') || message.contains('giờ')) {
      return 'Nhà hàng mở cửa từ 11:00 - 22:00 hàng ngày. Bạn có thể đặt bàn trong khung giờ này. Có gì cần hỗ trợ thêm không ạ?';
    } else if (message.contains('cảm ơn') || message.contains('thank')) {
      return 'Không có gì ạ! Rất vui được phục vụ bạn. Nếu có gì cần hỗ trợ thêm, đừng ngại liên hệ nhé! 😊';
    } else if (message.contains('hủy') || message.contains('cancel')) {
      return 'Tôi hiểu bạn muốn hủy. Bạn có thể hủy đặt bàn trong mục "Đặt bàn của tôi" trên ứng dụng. Có cần hỗ trợ gì thêm không ạ?';
    } else {
      return 'Cảm ơn bạn đã liên hệ! Tôi đã nhận được tin nhắn và sẽ phản hồi sớm nhất có thể. Có gì cần hỗ trợ thêm không ạ?';
    }
  }

  void _handleQuickAction(String action) {
    String message;
    switch (action) {
      case 'menu':
        message = 'Tôi muốn xem thực đơn';
        break;
      case 'booking':
        message = 'Tôi muốn đặt bàn';
        break;
      case 'price':
        message = 'Giá cả như thế nào?';
        break;
      case 'time':
        message = 'Nhà hàng mở cửa giờ nào?';
        break;
      default:
        message = action;
    }
    _messageController.text = message;
    _sendMessage();
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(chatMessagesProvider);
    final isTyping = ref.watch(isTypingProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Chat với nhân viên'),
        actions: [
          IconButton(
            onPressed: () {
              ref.read(chatMessagesProvider.notifier).clearMessages();
            },
            icon: const Icon(Icons.clear_all),
            tooltip: 'Xóa tất cả tin nhắn',
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
          // Quick actions
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceVariant,
              border: Border(
                bottom: BorderSide(
                  color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
                ),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Hành động nhanh',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _buildQuickActionChip('menu', 'Xem thực đơn', Icons.restaurant_menu),
                    _buildQuickActionChip('booking', 'Đặt bàn', Icons.table_restaurant),
                    _buildQuickActionChip('price', 'Giá cả', Icons.attach_money),
                    _buildQuickActionChip('time', 'Giờ mở cửa', Icons.schedule),
                  ],
                ),
              ],
            ),
          ),
          
          // Messages
          Expanded(
            child: messages.isEmpty
                ? _buildEmptyState()
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: messages.length + (isTyping ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index == messages.length && isTyping) {
                        return _buildTypingIndicator();
                      }
                      final message = messages[index];
                      return _buildMessageBubble(message);
                    },
                  ),
          ),
          
          // Input area
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              border: Border(
                top: BorderSide(
                  color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
                ),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: const InputDecoration(
                      hintText: 'Nhập tin nhắn...',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: _sendMessage,
                  icon: const Icon(Icons.send),
                ),
              ],
            ),
          ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActionChip(String action, String label, IconData icon) {
    return ActionChip(
      avatar: Icon(icon, size: 16),
      label: Text(label),
      onPressed: () => _handleQuickAction(action),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.chat_bubble_outline,
            size: 64,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
          const SizedBox(height: 16),
          Text(
            'Chưa có tin nhắn nào',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Gửi tin nhắn để bắt đầu trò chuyện với nhân viên',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(Map<String, dynamic> message) {
    final isUser = message['isUser'] as bool;
    final status = message['status'] as String?;
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        children: [
          if (!isUser) ...[
            const CircleAvatar(
              radius: 16,
              backgroundColor: Colors.blue,
              child: Icon(Icons.person, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isUser 
                    ? Theme.of(context).colorScheme.primary
                    : Theme.of(context).colorScheme.surfaceVariant,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    message['text'] as String,
                    style: TextStyle(
                      color: isUser 
                          ? Colors.white
                          : Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '${(message['timestamp'] as DateTime).hour}:${(message['timestamp'] as DateTime).minute.toString().padLeft(2, '0')}',
                        style: TextStyle(
                          color: isUser 
                              ? Colors.white70
                              : Theme.of(context).colorScheme.onSurfaceVariant.withOpacity(0.7),
                          fontSize: 12,
                        ),
                      ),
                      if (isUser && status != null) ...[
                        const SizedBox(width: 4),
                        Icon(
                          _getStatusIcon(status),
                          size: 12,
                          color: Colors.white70,
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ),
          if (isUser) ...[
            const SizedBox(width: 8),
            const CircleAvatar(
              radius: 16,
              backgroundColor: Colors.grey,
              child: Icon(Icons.person, color: Colors.white, size: 18),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          const CircleAvatar(
            radius: 16,
            backgroundColor: Colors.blue,
            child: Icon(Icons.person, color: Colors.white, size: 18),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceVariant,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(width: 8),
                const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
                const SizedBox(width: 8),
              ],
            ),
          ),
          // Quick Actions FAQ
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceVariant,
              border: Border(
                top: BorderSide(
                  color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
                ),
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Câu hỏi thường gặp',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    'Menu và giá cả',
                    'Đặt bàn cho nhóm lớn',
                    'Chính sách hủy bàn',
                    'Parking và địa chỉ',
                    'Phục vụ tiệc sinh nhật',
                    'Thanh toán và khuyến mãi',
                  ].map((question) => ActionChip(
                    label: Text(question),
                    onPressed: () {
                      _messageController.text = question;
                      _sendMessage();
                    },
                  )).toList(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'sent':
        return Icons.check;
      case 'delivered':
        return Icons.done_all;
      case 'read':
        return Icons.done_all;
      default:
        return Icons.schedule;
    }
  }
}