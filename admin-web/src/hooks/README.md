# WebSocket Hooks Documentation

## Tổng quan

Bộ WebSocket hooks này được thiết kế để tích hợp với backend `be_restaurant` và hỗ trợ real-time communication cho tất cả các module:

- **Order Management** - Quản lý đơn hàng
- **Reservation Management** - Quản lý đặt bàn
- **Chat System** - Hệ thống chat
- **Notification System** - Hệ thống thông báo

## Cấu trúc Files

```
src/hooks/
├── useWebSocket.ts          # Main file với unified hook và re-exports
├── useOrderWebSocket.ts     # Order-specific WebSocket hook
├── useReservationWebSocket.ts # Reservation-specific WebSocket hook
├── useChatWebSocket.ts      # Chat-specific WebSocket hook
├── useNotificationWebSocket.ts # Notification-specific WebSocket hook
└── README.md               # Documentation này
```

## Backend Events Mapping

### 1. Order Socket (`/order` namespace)

**Events được emit từ backend:**

- `orderCreated` - Đơn hàng được tạo
- `orderUpdated` - Đơn hàng được cập nhật
- `orderStatusChanged` - Trạng thái đơn hàng thay đổi
- `paymentRequested` - Yêu cầu thanh toán
- `paymentCompleted` - Thanh toán hoàn thành
- `paymentFailed` - Thanh toán thất bại
- `supportRequested` - Yêu cầu hỗ trợ
- `voucherApplied` - Áp dụng voucher
- `voucherRemoved` - Xóa voucher
- `orderMerged` - Gộp đơn hàng

**Payload:** `order: any` cho tất cả events

### 2. Reservation Socket (`/reservations` namespace)

**Events được emit từ backend:**

- `reservationCreated` - Đặt bàn được tạo
- `reservationUpdated` - Đặt bàn được cập nhật
- `reservationStatusChanged` - Trạng thái đặt bàn thay đổi
- `reservationCheckedIn` - Check-in đặt bàn
- `depositPaymentRequested` - Yêu cầu thanh toán cọc
- `depositPaymentCompleted` - Thanh toán cọc hoàn thành
- `depositPaymentFailed` - Thanh toán cọc thất bại

**Payload:**

- `reservation: any` cho hầu hết events
- `{ reservation, order }` cho `reservationCheckedIn`
- `{ reservation, payment_url }` cho `depositPaymentRequested`

### 3. Chat Socket (`/chat` namespace)

**Events được emit từ backend:**

- `userTyping` - Người dùng đang gõ

**Payload:** `{ sessionId: string, userId: string, isTyping: boolean }`

**Events được lắng nghe:**

- `joinSession` - Tham gia session chat
- `leaveSession` - Rời khỏi session chat
- `typingStart` - Bắt đầu gõ
- `typingStop` - Dừng gõ

### 4. Notification Socket (`/notifications` namespace)

**Events được emit từ backend:**

- `newNotification` - Thông báo mới

**Payload:** `notification: any`

**Events được lắng nghe:**

- `joinStaffRoom` - Tham gia room staff
- `joinUserRoom` - Tham gia room user cụ thể
- `leaveUserRoom` - Rời khỏi room user

## Cách sử dụng

### 1. Sử dụng Individual Hooks

```typescript
import { useOrderWebSocket } from "@/hooks/useWebSocket";

function OrderComponent() {
  const {
    isConnected,
    onOrderCreated,
    onOrderUpdated,
    onOrderStatusChanged,
    joinOrder,
    joinTable,
  } = useOrderWebSocket();

  useEffect(() => {
    // Lắng nghe events
    onOrderCreated((order) => {
      console.log("New order created:", order);
      // Cập nhật UI
    });

    onOrderStatusChanged((order) => {
      console.log("Order status changed:", order);
      // Cập nhật UI
    });

    // Tham gia rooms
    joinOrder("order-123");
    joinTable("table-456");
  }, [onOrderCreated, onOrderStatusChanged, joinOrder, joinTable]);

  return (
    <div>Connection Status: {isConnected ? "Connected" : "Disconnected"}</div>
  );
}
```

### 2. Sử dụng Unified Hook

```typescript
import { useUnifiedWebSocket } from "@/hooks/useWebSocket";

function AdminDashboard() {
  const {
    connections,
    onOrderEvent,
    onReservationEvent,
    onChatEvent,
    onNotificationEvent,
    joinStaffRoom,
  } = useUnifiedWebSocket();

  useEffect(() => {
    // Lắng nghe tất cả events
    onOrderEvent("orderCreated", (order) => {
      console.log("Order created:", order);
    });

    onReservationEvent("reservationCreated", (reservation) => {
      console.log("Reservation created:", reservation);
    });

    onChatEvent("userTyping", (data) => {
      console.log("User typing:", data);
    });

    onNotificationEvent("newNotification", (notification) => {
      console.log("New notification:", notification);
    });

    // Tham gia staff room
    joinStaffRoom();
  }, []);

  return (
    <div>
      <div>Order: {connections.order ? "✅" : "❌"}</div>
      <div>Reservation: {connections.reservation ? "✅" : "❌"}</div>
      <div>Chat: {connections.chat ? "✅" : "❌"}</div>
      <div>Notification: {connections.notification ? "✅" : "❌"}</div>
    </div>
  );
}
```

### 3. Sử dụng trong Components

```typescript
// Order Management Component
import { useOrderWebSocket } from "@/hooks/useWebSocket";

function OrderManagement() {
  const { onOrderCreated, onOrderStatusChanged, joinOrder } =
    useOrderWebSocket();

  useEffect(() => {
    onOrderCreated((order) => {
      // Thêm order mới vào danh sách
      setOrders((prev) => [...prev, order]);
    });

    onOrderStatusChanged((order) => {
      // Cập nhật trạng thái order
      setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
    });
  }, []);

  // Component logic...
}

// Chat Component
import { useChatWebSocket } from "@/hooks/useWebSocket";

function ChatComponent({ sessionId }: { sessionId: string }) {
  const { onUserTyping, joinSession, leaveSession, startTyping, stopTyping } =
    useChatWebSocket();

  useEffect(() => {
    joinSession(sessionId);

    onUserTyping((data) => {
      if (data.sessionId === sessionId) {
        setTypingUsers((prev) => ({
          ...prev,
          [data.userId]: data.isTyping,
        }));
      }
    });

    return () => leaveSession(sessionId);
  }, [sessionId]);

  // Component logic...
}
```

## Environment Variables

Đảm bảo có biến môi trường:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Best Practices

1. **Cleanup**: Luôn cleanup listeners khi component unmount
2. **Error Handling**: Xử lý lỗi connection và reconnect
3. **Room Management**: Chỉ join rooms khi cần thiết và leave khi không cần
4. **State Management**: Sử dụng state management để sync data giữa các components
5. **Performance**: Tránh tạo quá nhiều listeners không cần thiết

## Troubleshooting

### Connection Issues

- Kiểm tra `NEXT_PUBLIC_API_URL` có đúng không
- Kiểm tra backend có chạy không
- Kiểm tra CORS settings

### Event Not Received

- Kiểm tra event name có khớp với backend không
- Kiểm tra có join đúng room không
- Kiểm tra namespace có đúng không

### TypeScript Errors

- Đảm bảo import đúng types
- Kiểm tra interface definitions
- Sử dụng proper typing cho callbacks
