enum NotificationType { low_stock, reservation_confirm, promotion, other }

enum NotificationStatus { sent, failed }

class AppNotification {
  final String id;
  final String? userId;
  final NotificationType type;
  final String content;
  final DateTime? sentAt;
  final NotificationStatus status;
  // local-only UI state: whether the current user has read the notification
  final bool isRead;

  const AppNotification({
    required this.id,
    this.userId,
    required this.type,
    required this.content,
    this.sentAt,
    required this.status,
    this.isRead = false,
  });

  static NotificationType _parseType(String? raw) {
    if (raw == null) return NotificationType.other;
    switch (raw) {
      case 'low_stock':
      case 'lowStock':
        return NotificationType.low_stock;
      case 'reservation_confirm':
      case 'reservationConfirm':
      case 'reservation':
        return NotificationType.reservation_confirm;
      case 'promotion':
      case 'voucher':
        return NotificationType.promotion;
      default:
        return NotificationType.other;
    }
  }

  static NotificationStatus _parseStatus(String? raw) {
    if (raw == null) return NotificationStatus.sent;
    switch (raw) {
      case 'failed':
        return NotificationStatus.failed;
      default:
        return NotificationStatus.sent;
    }
  }

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    final id = (json['id'] ?? json['notification_id']) as String?;
    final userId = (json['user_id'] ?? json['userId']) as String?;
    final rawType = (json['type'] ?? json['notification_type']) as String?;
    final content = (json['content'] ?? json['message'] ?? json['body'] ?? '') as String;
    final rawSent = json['sent_at'] ?? json['sentAt'] ?? json['timestamp'];
    DateTime? sentAt;
    if (rawSent is String) {
      sentAt = DateTime.tryParse(rawSent);
    } else if (rawSent is DateTime) {
      sentAt = rawSent;
    }
    final rawStatus = (json['status'] ?? json['state']) as String?;

    return AppNotification(
      id: id ?? '',
        userId: userId,
        type: _parseType(rawType),
        content: content,
        sentAt: sentAt,
        status: _parseStatus(rawStatus),
        isRead: (json['isRead'] ?? json['read'] ?? false) as bool,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        if (userId != null) 'user_id': userId,
        'type': type.name,
        'content': content,
        if (sentAt != null) 'sent_at': sentAt!.toIso8601String(),
    'status': status.name,
    'isRead': isRead,
      };

  AppNotification copyWith({
    String? id,
    String? userId,
    NotificationType? type,
    String? content,
    DateTime? sentAt,
    NotificationStatus? status,
    bool? isRead,
  }) {
    return AppNotification(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      type: type ?? this.type,
      content: content ?? this.content,
      sentAt: sentAt ?? this.sentAt,
      status: status ?? this.status,
      isRead: isRead ?? this.isRead,
    );
  }
}
