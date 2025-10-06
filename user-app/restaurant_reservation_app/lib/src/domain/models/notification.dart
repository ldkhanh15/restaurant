enum NotificationType { booking, reminder, voucher, event, general }
enum NotificationPriority { high, medium, low }

class AppNotification {
  final String id;
  final NotificationType type;
  final String title;
  final String message;
  final DateTime timestamp;
  final bool isRead;
  final NotificationPriority priority;

  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.timestamp,
    required this.isRead,
    required this.priority,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) => AppNotification(
        id: json['id'] as String,
        type: NotificationType.values.firstWhere((e) => e.name == json['type']),
        title: json['title'] as String,
        message: json['message'] as String,
        timestamp: DateTime.parse(json['timestamp'] as String),
        isRead: json['isRead'] as bool,
        priority: NotificationPriority.values.firstWhere((e) => e.name == json['priority']),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.name,
        'title': title,
        'message': message,
        'timestamp': timestamp.toIso8601String(),
        'isRead': isRead,
        'priority': priority.name,
      };

  AppNotification copyWith({
    String? id,
    NotificationType? type,
    String? title,
    String? message,
    DateTime? timestamp,
    bool? isRead,
    NotificationPriority? priority,
  }) {
    return AppNotification(
      id: id ?? this.id,
      type: type ?? this.type,
      title: title ?? this.title,
      message: message ?? this.message,
      timestamp: timestamp ?? this.timestamp,
      isRead: isRead ?? this.isRead,
      priority: priority ?? this.priority,
    );
  }
}
