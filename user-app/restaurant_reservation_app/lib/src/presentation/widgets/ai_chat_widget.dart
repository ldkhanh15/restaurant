import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../application/providers.dart';

class AIChatWidget extends ConsumerStatefulWidget {
  const AIChatWidget({super.key});

  @override
  ConsumerState<AIChatWidget> createState() => _AIChatWidgetState();
}

class _AIChatWidgetState extends ConsumerState<AIChatWidget> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isMinimized = false;

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
    ref.read(aiChatMessagesProvider.notifier).addMessage({
      'id': DateTime.now().millisecondsSinceEpoch.toString(),
      'text': message,
      'isUser': true,
      'timestamp': DateTime.now(),
    });

    _messageController.clear();

    // Simulate AI typing
    ref.read(isAITypingProvider.notifier).setTyping(true);

    // Generate AI response
    Future.delayed(const Duration(seconds: 2), () {
      final aiResponse = _generateAIResponse(message);
      ref.read(isAITypingProvider.notifier).setTyping(false);
      ref.read(aiChatMessagesProvider.notifier).addMessage({
        'id': DateTime.now().millisecondsSinceEpoch.toString(),
        'text': aiResponse,
        'isUser': false,
        'timestamp': DateTime.now(),
      });
    });
  }

  String _generateAIResponse(String userMessage) {
    final message = userMessage.toLowerCase();
    
    if (message.contains('menu') || message.contains('thực đơn')) {
      return 'Chúng tôi có nhiều món ăn ngon! Bạn có thể xem thực đơn tại màn hình Menu. Tôi có thể giới thiệu một số món phổ biến như Phở bò, Bún chả, Cơm tấm...';
    } else if (message.contains('đặt bàn') || message.contains('reservation')) {
      return 'Để đặt bàn, bạn có thể chọn bàn từ danh sách hoặc sơ đồ bàn. Tôi có thể giúp bạn tìm bàn phù hợp với số lượng khách. Bạn muốn đặt bàn cho bao nhiêu người?';
    } else if (message.contains('giá') || message.contains('price')) {
      return 'Giá cả của chúng tôi rất hợp lý! Phí đặt bàn từ 150,000đ - 600,000đ tùy loại bàn. Món ăn từ 20,000đ - 80,000đ. Bạn có thể xem chi tiết trong thực đơn.';
    } else if (message.contains('sự kiện') || message.contains('event')) {
      return 'Chúng tôi thường tổ chức các sự kiện đặc biệt như đêm nhạc acoustic, lễ hội ẩm thực, workshop nấu ăn... Bạn có thể xem danh sách sự kiện sắp tới trong mục Sự kiện.';
    } else if (message.contains('loyalty') || message.contains('thành viên')) {
      return 'Chúng tôi có chương trình thành viên với nhiều ưu đãi! Bạn có thể tích điểm với mỗi lần sử dụng dịch vụ và đổi lấy phần thưởng. Xem chi tiết trong mục Chương trình thành viên.';
    } else if (message.contains('cảm ơn') || message.contains('thank')) {
      return 'Không có gì! Tôi rất vui được giúp đỡ bạn. Nếu có thắc mắc gì khác, đừng ngại hỏi nhé! 😊';
    } else if (message.contains('giờ') || message.contains('time')) {
      return 'Nhà hàng chúng tôi mở cửa từ 11:00 - 22:00 hàng ngày. Bạn có thể đặt bàn trong khung giờ này.';
    } else if (message.contains('địa chỉ') || message.contains('address')) {
      return 'Nhà hàng chúng tôi tọa lạc tại 123 Nguyễn Du, Hai Bà Trưng, Hà Nội. Rất dễ tìm và có chỗ đỗ xe.';
    } else {
      return 'Xin chào! Tôi là trợ lý AI của nhà hàng. Tôi có thể giúp bạn:\n• Tìm hiểu về thực đơn\n• Đặt bàn\n• Thông tin sự kiện\n• Chương trình thành viên\n• Và nhiều hơn nữa!\n\nBạn cần hỗ trợ gì?';
    }
  }

  void _handleQuickReply(String reply) {
    _messageController.text = reply;
    _sendMessage();
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(aiChatMessagesProvider);
    final isTyping = ref.watch(isAITypingProvider);
    final isOpen = ref.watch(isAIChatOpenProvider);

    if (!isOpen) {
      return Positioned(
        bottom: 16,
        right: 16,
        child: FloatingActionButton(
          heroTag: "ai_chat_fab",
          onPressed: () {
            ref.read(isAIChatOpenProvider.notifier).open();
          },
          child: const Icon(Icons.chat),
        ),
      );
    }

    return Positioned(
      bottom: 16,
      right: 16,
      child: Container(
        width: 320,
        height: _isMinimized ? 60 : 500,
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              ),
              child: Row(
                children: [
                  const CircleAvatar(
                    radius: 16,
                    backgroundColor: Colors.white,
                    child: Icon(Icons.smart_toy, color: Colors.blue, size: 20),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'Trợ lý AI',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () {
                      setState(() {
                        _isMinimized = !_isMinimized;
                      });
                    },
                    icon: Icon(
                      _isMinimized ? Icons.expand_less : Icons.expand_more,
                      color: Colors.white,
                    ),
                  ),
                  IconButton(
                    onPressed: () {
                      ref.read(isAIChatOpenProvider.notifier).close();
                    },
                    icon: const Icon(Icons.close, color: Colors.white),
                  ),
                ],
              ),
            ),
            
            if (!_isMinimized) ...[
              // Messages
              Expanded(
                child: messages.isEmpty
                    ? _buildWelcomeMessage()
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
                  color: Theme.of(context).colorScheme.surfaceVariant,
                  borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)),
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
          ],
        ),
      ),
    );
  }

  Widget _buildWelcomeMessage() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.smart_toy, size: 48, color: Colors.blue),
          const SizedBox(height: 16),
          const Text(
            'Xin chào! Tôi là trợ lý AI',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Tôi có thể giúp bạn tìm hiểu về nhà hàng, đặt bàn, xem thực đơn và nhiều hơn nữa!',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey),
          ),
          const SizedBox(height: 24),
          _buildQuickReplies(),
        ],
      ),
    );
  }

  Widget _buildQuickReplies() {
    final quickReplies = [
      'Xem thực đơn',
      'Đặt bàn',
      'Sự kiện',
      'Giá cả',
    ];

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: quickReplies.map((reply) {
        return ActionChip(
          label: Text(reply),
          onPressed: () => _handleQuickReply(reply),
        );
      }).toList(),
    );
  }

  Widget _buildMessageBubble(Map<String, dynamic> message) {
    final isUser = message['isUser'] as bool;
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        children: [
          if (!isUser) ...[
            const CircleAvatar(
              radius: 12,
              backgroundColor: Colors.blue,
              child: Icon(Icons.smart_toy, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isUser 
                    ? Theme.of(context).colorScheme.primary
                    : Theme.of(context).colorScheme.surfaceVariant,
                borderRadius: BorderRadius.circular(16),
              ),
              // Sanitize message content: sometimes code/path/debug may push raw
              // Map/List objects or their toString() (e.g. "{id: 1111..., name: ...}").
              // Hide those to avoid exposing internal IDs in the UI.
              child: (() {
                final raw = message['text'];

                // If the message payload is a Map or List, don't render it.
                if (raw is Map || raw is List) {
                  return const SizedBox.shrink();
                }

                final text = raw?.toString() ?? '';

                // If it looks like an object dump containing an 'id' field, hide it.
                final objectLike = RegExp(r"^\s*\{[^}]*\bid\b\s*[:=]").hasMatch(text);
                if (objectLike) {
                  return const SizedBox.shrink();
                }

                return Text(
                  text,
                  style: TextStyle(
                    color: isUser 
                        ? Colors.white
                        : Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                );
              })(),
            ),
          ),
          if (isUser) ...[
            const SizedBox(width: 8),
            const CircleAvatar(
              radius: 12,
              backgroundColor: Colors.grey,
              child: Icon(Icons.person, color: Colors.white, size: 16),
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
            radius: 12,
            backgroundColor: Colors.blue,
            child: Icon(Icons.smart_toy, color: Colors.white, size: 16),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceVariant,
              borderRadius: BorderRadius.circular(16),
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
        ],
      ),
    );
  }
}
