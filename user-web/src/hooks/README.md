# Socket Hooks for User-Web

Tài liệu hướng dẫn sử dụng các socket hooks cho namespace `/customer` trong user-web.

## Tổng Quan

Hệ thống WebSocket cho user-web sử dụng namespace `/customer` để kết nối với backend. Tất cả các hooks được thiết kế để:

- Chỉ sử dụng namespace `/customer`
- Tự động cập nhật Zustand store (`socketStore`) khi nhận events
- Cung cấp API đơn giản để emit events lên server
- Hỗ trợ reconnection và error handling

## Cấu Trúc

```
src/
├── hooks/
│   ├── useSocket.ts          # Hook cơ bản: connection, room management
│   ├── useChatSocket.ts      # Chat events
│   ├── useOrderSocket.ts     # Order events
│   ├── useReservationSocket.ts # Reservation events
│   ├── useNotificationSocket.ts # Notification events
│   └── index.ts              # Export tất cả hooks
├── store/
│   └── socketStore.ts        # Zustand store cho tất cả realtime data
└── components/
    └── socket/
        └── SocketListeners.tsx # Auto-listen component
```

## Cách Sử Dụng

### 1. Setup Provider (Đã có sẵn)

`WebSocketProvider` đã được mount trong `layout.tsx`. Provider tự động:

- Kết nối tới `/customer` namespace khi user đăng nhập
- Hỗ trợ anonymous connection (không cần token)
- Tự động reconnect khi mất kết nối

### 2. Mount Socket Listeners

Component `SocketListeners` tự động lắng nghe tất cả events và cập nhật store. Đã được mount trong `layout.tsx`.

### 3. Sử dụng Hooks trong Components

#### Chat Socket

```tsx
import { useChatSocket } from "@/hooks";

function ChatComponent() {
  const chatSocket = useChatSocket();
  const [sessionId, setSessionId] = useState("session-123");

  useEffect(() => {
    if (!chatSocket.isConnected) return;

    // Join session when component mounts
    chatSocket.joinSession(sessionId);

    // Listen to new messages
    chatSocket.onMessageReceived((message) => {
      console.log("New message:", message);
      // Message đã được tự động lưu vào store
    });

    return () => {
      chatSocket.leaveSession(sessionId);
    };
  }, [sessionId, chatSocket]);

  const handleSendMessage = () => {
    const clientMessageId = chatSocket.sendMessage(sessionId, "Hello!", "text");
    console.log("Sent message with ID:", clientMessageId);
  };

  // Lấy messages từ store
  const messages = chatSocket.getMessages(sessionId);

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.message_text}</div>
      ))}
    </div>
  );
}
```

#### Order Socket

```tsx
import { useOrderSocket } from "@/hooks";

function OrderDetailPage({ orderId }: { orderId: string }) {
  const orderSocket = useOrderSocket();

  useEffect(() => {
    if (!orderSocket.isConnected) return;

    // Join order room để nhận realtime updates
    orderSocket.joinOrder(orderId);

    // Listen to status changes
    orderSocket.onOrderStatusChanged((order) => {
      console.log("Order status updated:", order.status);
      // Order đã được tự động cập nhật trong store
    });

    return () => {
      orderSocket.leaveOrder(orderId);
    };
  }, [orderId, orderSocket]);

  // Request support
  const handleRequestSupport = () => {
    orderSocket.requestSupport(orderId);
  };

  // Lấy order từ store
  const order = orderSocket.getOrder(orderId);

  return <div>Order Status: {order?.status}</div>;
}
```

#### Reservation Socket

```tsx
import { useReservationSocket } from "@/hooks";

function ReservationPage() {
  const reservationSocket = useReservationSocket();

  useEffect(() => {
    if (!reservationSocket.isConnected) return;

    // Listen to reservation updates
    reservationSocket.onReservationStatusChanged((reservation) => {
      console.log("Reservation updated:", reservation);
    });

    reservationSocket.onDepositPaymentCompleted((reservation) => {
      console.log("Payment completed for:", reservation.id);
    });
  }, [reservationSocket]);

  // Lấy tất cả reservations từ store
  const reservations = reservationSocket.getReservations();

  return <div>{/* Render reservations */}</div>;
}
```

#### Notification Socket

```tsx
import { useNotificationSocket } from "@/hooks";
import { useSocketStore } from "@/store/socketStore";

function NotificationBell() {
  const notificationSocket = useNotificationSocket();
  const unreadCount = notificationSocket.getUnreadCount();

  const handleMarkAsRead = (ids: string[]) => {
    notificationSocket.markNotificationsAsRead(ids);
  };

  return (
    <div>
      <BellIcon />
      {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
    </div>
  );
}
```

## Store API

Sử dụng `useSocketStore` để truy cập trực tiếp vào store:

```tsx
import { useSocketStore } from "@/store/socketStore";

function MyComponent() {
  const {
    messages,
    orders,
    reservations,
    notifications,
    unreadCount,
    addMessage,
    updateOrder,
  } = useSocketStore();

  // Direct access to store state
  const myOrders = Object.values(orders);
}
```

## Events Mapping

### Chat Events (Customer → Server)

- `chat:send_message` - Gửi tin nhắn
- `chat:join_session` - Join chat session
- `chat:leave_session` - Leave chat session
- `chat:typing` - Typing indicator
- `chat:mark_read` - Đánh dấu đã đọc

### Chat Events (Server → Customer)

- `chat:new_message` - Tin nhắn mới
- `chat:typing` - Typing indicator từ admin/user khác
- `chat:messages_read` - Messages đã được đọc
- `chat:session_new` - Session mới được tạo
- `chat:session_status_changed` - Status session thay đổi
- `chat:message_ack` - ACK cho message đã gửi

### Order Events (Customer → Server)

- `order:join` - Join order room
- `order:leave` - Leave order room
- `order:request_support` - Yêu cầu hỗ trợ

### Order Events (Server → Customer)

- `order:created` - Order mới được tạo
- `order:updated` - Order được cập nhật
- `order:status_changed` - Status order thay đổi
- `order:payment_requested` - Yêu cầu thanh toán
- `order:payment_completed` - Thanh toán thành công
- `order:payment_failed` - Thanh toán thất bại
- `order:voucher_applied` - Voucher được áp dụng
- `order:voucher_removed` - Voucher bị gỡ
- `order:merged` - Order được merge

### Reservation Events (Customer → Server)

- `reservation:join` - Join reservation room
- `reservation:leave` - Leave reservation room

### Reservation Events (Server → Customer)

- `reservation:created` - Reservation mới được tạo
- `reservation:updated` - Reservation được cập nhật
- `reservation:status_changed` - Status reservation thay đổi
- `reservation:checked_in` - Đã check-in
- `reservation:deposit_payment_requested` - Yêu cầu đặt cọc
- `reservation:deposit_payment_completed` - Đặt cọc thành công
- `reservation:deposit_payment_failed` - Đặt cọc thất bại

### Notification Events (Customer → Server)

- `notification:mark_read` - Đánh dấu đã đọc

### Notification Events (Server → Customer)

- `notification:new` - Notification mới
- `notification:broadcast` - Broadcast notification

## Best Practices

1. **Always check `isConnected`**: Đảm bảo socket đã kết nối trước khi emit events
2. **Cleanup listeners**: Components tự động cleanup khi unmount
3. **Use store getters**: Sử dụng `getOrder()`, `getMessages()`, etc. thay vì truy cập store trực tiếp
4. **Join rooms when needed**: Join order/reservation rooms khi component mount, leave khi unmount
5. **Handle errors**: Listeners có thể nhận error events từ server

## Debugging

Tất cả socket events được log ra console với prefix `[Socket]`, `[Chat]`, `[Order]`, etc.

Kiểm tra connection status:

```tsx
const { isConnected } = useWebSocket();
console.log("Socket connected:", isConnected);
```
