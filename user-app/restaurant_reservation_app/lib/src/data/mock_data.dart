import '../domain/models/table.dart';
import '../domain/models/menu.dart';
import '../domain/models/booking.dart';
import '../domain/models/user.dart';
import '../domain/models/event.dart';
import '../domain/models/notification.dart';
import '../domain/models/loyalty.dart';
import '../domain/models/payment.dart';
import '../domain/models/order.dart';
import '../domain/models/review.dart';
import '../domain/models/voucher.dart';

class MockData {
  // Mock Tables
  static final List<DiningTable> tables = [
    DiningTable(
      id: '1',
      name: "Bàn VIP 1",
      capacity: 8,
      location: "Tầng 2 - Khu VIP",
      description: "Bàn VIP rộng rãi, phù hợp cho nhóm và sự kiện nhỏ. Có view nhìn ra sảnh chính.",
      price: 200000,
      status: TableStatus.available,
      type: TableType.vip,
      image: "https://images.unsplash.com/photo-1651209315802-12190ccfee26?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXVyYW50JTIwdGFibGUlMjBkaW5pbmd8ZW58MXx8fHwxNzU3NzIzMDg2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      x: 100,
      y: 50,
      width: 80,
      height: 60,
    ),
    DiningTable(
      id: '2',
      name: "Bàn tròn T1",
      capacity: 6,
      location: "Tầng 1 - Khu chính",
      description: "Bàn tròn 6 người, gần cửa sổ, ánh sáng tự nhiên. Thích hợp cho gia đình nhỏ.",
      price: 150000,
      status: TableStatus.available,
      type: TableType.regular,
      image: "https://images.unsplash.com/photo-1651209315802-12190ccfee26?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXVyYW50JTIwdGFibGUlMjBkaW5pbmd8ZW58MXx8fHwxNzU3NzIzMDg2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      x: 50,
      y: 150,
      width: 60,
      height: 60,
    ),
    DiningTable(
      id: '3',
      name: "Bàn đôi D2",
      capacity: 2,
      location: "Tầng 1 - Khu lãng mạn",
      description: "Bàn đôi ấm cúng, không gian riêng tư cho cặp đôi.",
      price: 100000,
      status: TableStatus.reserved,
      type: TableType.couple,
      image: "https://images.unsplash.com/photo-1651209315802-12190ccfee26?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXVyYW50JTIwdGFibGUlMjBkaW5pbmd8ZW58MXx8fHwxNzU3NzIzMDg2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      x: 80,
      y: 350,
      width: 50,
      height: 50,
    ),
    DiningTable(
      id: '4',
      name: "Bàn gia đình F1",
      capacity: 10,
      location: "Tầng 2 - Khu gia đình",
      description: "Bàn dành cho gia đình, diện tích rộng, có thể kê thêm ghế nếu cần.",
      price: 300000,
      status: TableStatus.available,
      type: TableType.group,
      image: "https://images.unsplash.com/photo-1651209315802-12190ccfee26?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXVyYW50JTIwdGFibGUlMjBkaW5pbmd8ZW58MXx8fHwxNzU3NzIzMDg2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      x: 340,
      y: 330,
      width: 80,
      height: 80,
    ),
  ];

  // Mock Menu Categories
  static final List<MenuCategory> menuCategories = [
    MenuCategory(
      id: "appetizers",
      name: "Khai vị",
      items: [
        MenuItem(
          id: '1',
          name: "Gỏi cuốn tôm",
          description: "Bánh tráng cuốn tôm tươi, rau thơm, ăn kèm nước chấm đặc biệt",
          price: 45000,
          image: "https://images.unsplash.com/photo-1693494869603-09f1981f28e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWV0bmFtZXNlJTIwc3ByaW5nJTIwcm9sbHN8ZW58MXx8fHwxNzU3NzI0ODYxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
          rating: 4.8,
          popular: true,
          categoryId: "appetizers",
        ),
        MenuItem(
          id: '2',
          name: "Nem nướng",
          description: "Nem nướng thơm ngon, ăn kèm bánh tráng và rau sống",
          price: 55000,
          image: "https://images.unsplash.com/photo-1559847844-d724b4b24e5e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZW0lMjBudW9uZ3xlbnwxfHx8fDE3NTc3MjQ0NjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
          rating: 4.7,
          popular: false,
          categoryId: "appetizers",
        ),
      ],
    ),
    MenuCategory(
      id: "main",
      name: "Món chính",
      items: [
        MenuItem(
          id: '3',
          name: "Phở bò",
          description: "Phở bò truyền thống với nước dầm trong, thịt bò tươi",
          price: 80000,
          image: "https://images.unsplash.com/photo-1590420882553-4f9150b71f92?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWV0bmFtZXNlJTIwcGhvJTIwZm9vZHxlbnwxfHx8fDE3NTc2ODA2OTd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
          rating: 4.9,
          popular: true,
          categoryId: "main",
        ),
        MenuItem(
          id: '4',
          name: "Bún chả",
          description: "Bún chả Hà Nội với thịt nướng thơm lừng",
          price: 65000,
          image: "https://images.unsplash.com/photo-1559847844-d724b4b24e5e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidW4lMjBjaGF8ZW58MXx8fHwxNzU3NzI0NTI1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
          rating: 4.8,
          popular: true,
          categoryId: "main",
        ),
        MenuItem(
          id: '5',
          name: "Cơm tấm",
          description: "Cơm tấm sườn nướng, chả trứng, bì",
          price: 70000,
          image: "https://images.unsplash.com/photo-1559847844-d724b4b24e5e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb20lMjB0YW18ZW58MXx8fHwxNzU3NzI0NTU2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
          rating: 4.6,
          popular: false,
          categoryId: "main",
        ),
      ],
    ),
    MenuCategory(
      id: "drinks",
      name: "Đồ uống",
      items: [
        MenuItem(
          id: '6',
          name: "Cà phê sữa đá",
          description: "Cà phê Việt Nam truyền thống với sữa đặc",
          price: 25000,
          image: "https://images.unsplash.com/photo-1559847844-d724b4b24e5e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWV0bmFtZXNlJTIwY29mZmVlfGVufDF8fHx8MTc1NzcyNDU5Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
          rating: 4.7,
          popular: true,
          categoryId: "drinks",
        ),
        MenuItem(
          id: '7',
          name: "Nước chanh",
          description: "Nước chanh tươi mát, giải khát tuyệt vời",
          price: 20000,
          image: "https://images.unsplash.com/photo-1559847844-d724b4b24e5e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZW1vbiUyMGp1aWNlfGVufDF8fHx8MTc1NzcyNDYyM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
          rating: 4.5,
          popular: false,
          categoryId: "drinks",
        ),
      ],
    ),
  ];

  // Mock User
  static final AppUser mockUser = AppUser(
    id: '1',
    name: "Nguyễn Văn A",
    email: "nguyenvana@email.com",
    phone: "0123456789",
    address: "123 Nguyễn Du, Hai Bà Trưng, Hà Nội",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    birthDate: DateTime(1990, 5, 15),
    joinDate: DateTime(2023, 1, 15),
    loyaltyPoints: 1250,
    totalOrders: 47,
    favoriteTable: "Bàn VIP 01",
    membershipTier: "VIP",
  );

  // Mock Bookings
  static final List<Booking> mockBookings = [
    Booking(
      id: '1',
      tableId: '1',
      tableName: "Bàn VIP 1",
      date: DateTime(2024, 1, 20),
      time: "19:00",
      guests: 6,
      status: BookingStatus.confirmed,
      notes: "Kỷ niệm sinh nhật",
      location: "Tầng 2 - Khu VIP",
      price: 200000,
      createdAt: DateTime.now().subtract(const Duration(days: 5)),
    ),
    Booking(
      id: '2',
      tableId: '3',
      tableName: "Bàn đôi D2",
      date: DateTime(2024, 1, 25),
      time: "20:30",
      guests: 2,
      status: BookingStatus.pending,
      notes: "Hẹn hò",
      location: "Tầng 1 - Khu lãng mạn",
      price: 100000,
      createdAt: DateTime.now().subtract(const Duration(days: 2)),
    ),
  ];

  // Mock Events
  static final List<Event> mockEvents = [
    Event(
      id: '1',
      title: "Đêm nhạc acoustic",
      description: "Thưởng thức âm nhạc nhẹ nhàng cùng các món ăn đặc sản",
      date: DateTime(2024, 1, 25),
      time: "19:00 - 22:00",
      location: "Tầng 2 - Khu VIP",
      price: 500000,
      capacity: 50,
      registered: 32,
      category: EventCategory.music,
      status: AvailabilityStatus.available,
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaXZlJTIwbXVzaWMlMjByZXN0YXVyYW50fGVufDF8fHx8MTc1NzcyNDA4OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    ),
    Event(
      id: '2',
      title: "Lễ hội ẩm thực Việt",
      description: "Khám phá hương vị truyền thống từ Bắc đến Nam",
      date: DateTime(2024, 2, 1),
      time: "18:00 - 21:00",
      location: "Toàn bộ nhà hàng",
      price: 800000,
      capacity: 100,
      registered: 78,
      category: EventCategory.food,
      status: AvailabilityStatus.available,
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kJTIwZmVzdGl2YWwlMjB2aWV0bmFtfGVufDF8fHx8MTc1NzcyNDEyOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    ),
  ];

  // Mock Notifications
  static final List<AppNotification> mockNotifications = [
    AppNotification(
      id: "1",
      type: NotificationType.reservation_confirm,
      content: "Đặt bàn cho 4 người lúc 19:00 ngày 25/09/2025 đã được xác nhận. Bàn số 12 tầng 2.",
      sentAt: DateTime.now().subtract(const Duration(minutes: 2)),
      status: NotificationStatus.sent,
      isRead: false,
    ),
    AppNotification(
      id: "2",
      type: NotificationType.reservation_confirm,
      content: "Còn 30 phút nữa đến giờ đặt bàn của bạn. Vui lòng có mặt đúng giờ.",
      sentAt: DateTime.now().subtract(const Duration(minutes: 30)),
      status: NotificationStatus.sent,
      isRead: false,
    ),
    AppNotification(
      id: "3",
      type: NotificationType.promotion,
      content: "Chúc mừng! Bạn nhận được voucher giảm giá 15% cho lần đặt bàn tiếp theo.",
      sentAt: DateTime.now().subtract(const Duration(hours: 1)),
      status: NotificationStatus.sent,
      isRead: true,
    ),
  ];

  // Mock Rewards
  static final List<PointHistory> mockPointHistory = [
    PointHistory(
      id: "1",
      type: PointTransactionType.earn,
      points: 150,
      description: "Đặt bàn và thanh toán hóa đơn 1,500,000đ",
      date: DateTime.parse("2024-01-24"),
    ),
    PointHistory(
      id: "2",
      type: PointTransactionType.redeem,
      points: -200,
      description: "Đổi voucher giảm giá 20%",
      date: DateTime.parse("2024-01-20"),
    ),
  ];

  static final List<Reward> mockRewards = [
    Reward(
      id: "1",
      name: "Giảm giá 15%",
      description: "Áp dụng cho hóa đơn từ 500,000đ",
      pointsRequired: 300,
      category: RewardCategory.discount,
      available: true,
      validUntil: DateTime(2025, 12, 30),
    ),
    Reward(
      id: "2",
      name: "Món khai vị miễn phí",
      description: "Chọn 1 món khai vị bất kỳ trong menu",
      pointsRequired: 200,
      category: RewardCategory.freebie,
      available: true,
      validUntil: DateTime(2025, 10, 31),
    ),
  ];

  // Mock Data for User Profile
  static final AppUser mockUserProfile = AppUser(
    id: '1',
    name: "Nguyễn Văn A",
    email: "nguyenvana@email.com",
    phone: "0123456789",
    address: "123 Nguyễn Du, Hai Bà Trưng, Hà Nội",
    birthDate: DateTime.parse("1990-05-15"),
    joinDate: DateTime.parse("2023-01-15"),
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    loyaltyPoints: 1250,
    totalOrders: 47,
    favoriteTable: "Bàn VIP 01",
    membershipTier: "VIP",
  );

  // Mock Data for Orders
  static final List<Order> mockOrderHistory = [
    Order(
      id: '1',
      bookingId: '1',
      items: [
        OrderItem(
          id: '3',
          name: "Phở bò",
          price: 80000,
          quantity: 1,
          customizations: [],
          estimatedTime: 15,
          image: "https://images.unsplash.com/photo-1590420882553-4f9150b71f92?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWV0bmFtZXNlJTIwcGhvJTIwZm9vZHxlbnwxfHx8fDE3NTc2ODA2OTd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        ),
        OrderItem(
          id: '6',
          name: "Cà phê sữa đá",
          price: 25000,
          quantity: 1,
          customizations: [],
          estimatedTime: 5,
          image: "https://images.unsplash.com/photo-1559847844-d724b4b24e5e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWV0bmFtZXNlJTIwY29mZmVlfGVufDF8fHx8MTc1NzcyNDU5Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        ),
      ],
      subtotal: 105000,
      serviceCharge: 10500,
      tax: 11550,
      total: 127050,
      status: OrderStatus.completed,
      createdAt: DateTime.parse("2024-01-15T12:30:00"),
    ),
  ];

  // Mock Data for Event Bookings
  static final List<EventBooking> mockEventBookings = [
    EventBooking(
      id: '1',
      eventId: '1',
      eventTitle: "Đêm nhạc acoustic",
      date: DateTime.parse("2024-01-25"),
      time: "19:00 - 22:00",
      guests: 2,
      status: "confirmed",
      bookingDate: DateTime.parse("2024-01-15"),
      notes: "Bàn gần sân khấu",
    ),
    EventBooking(
      id: '2',
      eventId: '4',
      eventTitle: "Workshop nấu ăn",
      date: DateTime.parse("2024-02-05"),
      time: "14:00 - 17:00",
      guests: 1,
      status: "pending",
      bookingDate: DateTime.parse("2024-01-16"),
      notes: "Người mới bắt đầu",
    ),
  ];

  // Mock Payment Methods
  static final List<PaymentMethod> mockPaymentMethods = [
    PaymentMethod(
      id: "cash",
      type: PaymentMethodType.cash,
      name: "Tiền mặt",
      description: "Thanh toán khi phục vụ mang món",
      iconPath: "assets/icons/cash.png",
    ),
    PaymentMethod(
      id: "card",
      type: PaymentMethodType.card,
      name: "Thẻ tín dụng",
      description: "Visa, Mastercard, JCB",
      iconPath: "assets/icons/credit_card.png",
    ),
    PaymentMethod(
      id: "momo",
      type: PaymentMethodType.momo,
      name: "MoMo",
      description: "Ví điện tử MoMo",
      iconPath: "assets/icons/momo.png",
    ),
    PaymentMethod(
      id: "banking",
      type: PaymentMethodType.banking,
      name: "Chuyển khoản",
      description: "Internet Banking",
      iconPath: "assets/icons/bank.png",
    ),
  ];

  // Mock Reviews and Complaints
  static final List<Review> mockReviews = [
    Review(
      id: "1",
      customerId: "user1",
      customerName: "Nguyễn Văn A",
      customerAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  rating: 5,
  comment: "Món ăn rất ngon, phục vụ nhiệt tình. Nhà hàng có không gian đẹp và sạch sẽ. Sẽ quay lại lần sau!",
      type: ReviewType.review,
      status: ReviewStatus.approved,
      createdAt: DateTime.parse("2024-01-15T14:30:00"),
      helpfulCount: 12,
      restaurantResponse: "Cảm ơn bạn đã đánh giá tích cực! Chúng tôi rất vui khi bạn hài lòng với dịch vụ.",
      responseDate: DateTime.parse("2024-01-15T16:00:00"),
      orderId: "order1",
    ),
    Review(
      id: "2",
      customerId: "user2",
      customerName: "Trần Thị B",
      customerAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b5e5?w=150&h=150&fit=crop&crop=face",
  rating: 4,
  comment: "Đồ ăn ngon nhưng thời gian chờ hơi lâu. Nhân viên thân thiện.",
      type: ReviewType.review,
      status: ReviewStatus.approved,
      createdAt: DateTime.parse("2024-01-12T19:20:00"),
      helpfulCount: 8,
      orderId: "order2",
    ),
    Review(
      id: "3",
      customerId: "user3",
      customerName: "Lê Văn C",
      customerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  rating: 2,
  comment: "Món ăn không đúng vị như mong đợi, giá cả hơi cao so với chất lượng.",
      type: ReviewType.complaint,
      status: ReviewStatus.approved,
      createdAt: DateTime.parse("2024-01-10T20:15:00"),
      helpfulCount: 3,
      restaurantResponse: "Chúng tôi xin lỗi về trải nghiệm không tốt. Bộ phận quản lý sẽ liên hệ với bạn để giải quyết.",
      responseDate: DateTime.parse("2024-01-11T09:00:00"),
      orderId: "order3",
    ),
    Review(
      id: "4",
      customerId: "user4",
      customerName: "Phạm Thị D",
      customerAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
  rating: 5,
  comment: "Không gian tuyệt vời cho buổi hẹn hò. Món ăn ngon, phục vụ chu đáo. Đặc biệt thích món tôm nướng!",
      type: ReviewType.review,
      status: ReviewStatus.approved,
      createdAt: DateTime.parse("2024-01-08T18:45:00"),
      helpfulCount: 15,
      orderId: "order4",
    ),
  ];

  // Mock Vouchers
  static final List<Voucher> mockVouchers = [
    Voucher(
      id: "voucher1",
      code: "WELCOME15",
      name: "Giảm giá 15%",
      description: "Áp dụng cho hóa đơn từ 500,000đ",
      type: VoucherType.discount,
      status: VoucherStatus.active,
      discountPercentage: 15.0,
      minimumOrderAmount: 500000,
      createdAt: DateTime.parse("2024-01-01T00:00:00"),
      validFrom: DateTime.parse("2024-01-01T00:00:00"),
      validUntil: DateTime.parse("2024-12-31T23:59:59"),
      iconPath: "assets/icons/discount.png",
      colorHex: "#FF6B6B",
    ),
    Voucher(
      id: "voucher2",
      code: "FREEAPP200",
      name: "Món khai vị miễn phí",
      description: "Chọn 1 món khai vị bất kỳ trong menu",
      type: VoucherType.freebie,
      status: VoucherStatus.active,
      createdAt: DateTime.parse("2024-01-05T00:00:00"),
      validFrom: DateTime.parse("2024-01-05T00:00:00"),
      validUntil: DateTime.parse("2024-10-31T23:59:59"),
      iconPath: "assets/icons/gift.png",
      colorHex: "#4ECDC4",
    ),
    Voucher(
      id: "voucher3",
      code: "VIPUPGRADE",
      name: "Nâng cấp bàn VIP",
      description: "Miễn phí nâng cấp lên bàn VIP (có sẵn)",
      type: VoucherType.upgrade,
      status: VoucherStatus.active,
      createdAt: DateTime.parse("2024-01-10T00:00:00"),
      validFrom: DateTime.parse("2024-01-10T00:00:00"),
      validUntil: DateTime.parse("2024-11-15T23:59:59"),
      iconPath: "assets/icons/upgrade.png",
      colorHex: "#A8E6CF",
    ),
    Voucher(
      id: "voucher4",
      code: "BIGDISCOUNT25",
      name: "Giảm giá 25%",
      description: "Áp dụng cho hóa đơn từ 1,000,000đ",
      type: VoucherType.discount,
      status: VoucherStatus.used,
      discountPercentage: 25.0,
      minimumOrderAmount: 1000000,
      createdAt: DateTime.parse("2024-01-01T00:00:00"),
      validFrom: DateTime.parse("2024-01-01T00:00:00"),
      validUntil: DateTime.parse("2024-12-25T23:59:59"),
      usedAt: DateTime.parse("2024-01-20T19:30:00"),
      orderId: "order5",
      iconPath: "assets/icons/discount.png",
      colorHex: "#FFD93D",
    ),
    Voucher(
      id: "voucher5",
      code: "FREEDESSERT",
      name: "Set tráng miệng miễn phí",
      description: "Set tráng miệng cho 2 người",
      type: VoucherType.freebie,
      status: VoucherStatus.expired,
      createdAt: DateTime.parse("2023-12-01T00:00:00"),
      validFrom: DateTime.parse("2023-12-01T00:00:00"),
      validUntil: DateTime.parse("2024-01-20T23:59:59"),
      iconPath: "assets/icons/dessert.png",
      colorHex: "#FF8A80",
    ),
  ];
}
