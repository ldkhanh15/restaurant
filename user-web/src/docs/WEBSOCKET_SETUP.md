# WebSocket Setup Guide - User-Web

## Tổng Quan

Hệ thống WebSocket cho user-web đã được tích hợp hoàn chỉnh với namespace `/customer`. Tất cả các module (Chat, Order, Reservation, Notification) đều hoạt động realtime thông qua Socket.IO.

## Kiến Trúc

```
┌─────────────────────────────────────────────────┐
│  Backend (be_restaurant)                        │
│  - chatSocket.ts                                │
│  - orderSocket.ts                               │
│  - reservationSocket.ts                        │
│  - notificationSocket.ts                       │
│                                                 │
│  Namespace: /customer                           │
│  - Customer events → Admin namespace            │
│  - Admin events → Customer rooms                │
└─────────────────────────────────────────────────┘
                    ↕ Socket.IO
┌─────────────────────────────────────────────────┐
│  Frontend (user-web)                            │
│  - WebSocketProvider                            │
│  - useSocket.ts                                 │
│  - useChatSocket.ts                             │
│  - useOrderSocket.ts                            │
│  - useReservationSocket.ts                     │
│  - useNotificationSocket.ts                    │
│  - socketStore.ts (Zustand)                    │
│  - SocketListeners.tsx                          │
└─────────────────────────────────────────────────┘
```

## Files Đã Tạo/Cập Nhật

### Store

- ✅ `src/store/socketStore.ts` - Zustand store cho tất cả realtime data

### Hooks

- ✅ `src/hooks/useSocket.ts` - Base hook cho connection và room management
- ✅ `src/hooks/useChatSocket.ts` - Chat events handler
- ✅ `src/hooks/useOrderSocket.ts` - Order events handler
- ✅ `src/hooks/useReservationSocket.ts` - Reservation events handler
- ✅ `src/hooks/useNotificationSocket.ts` - Notification events handler
- ✅ `src/hooks/index.ts` - Export tất cả hooks

### Components

- ✅ `src/components/socket/SocketListeners.tsx` - Auto-listen component

### Configuration

- ✅ `src/app/layout.tsx` - Đã mount SocketListeners
- ✅ `src/providers/WebSocketProvider.tsx` - Đã hỗ trợ /customer namespace

## Event Mapping

### Chat Events

**Customer → Server:**

- `chat:send_message` - Gửi tin nhắn
- `chat:join_session` - Join chat session
- `chat:leave_session` - Leave chat session
- `chat:typing` - Typing indicator (isTyping: true/false)
- `chat:mark_read` - Đánh dấu messages đã đọc

**Server → Customer:**

- `chat:new_message` - Tin nhắn mới (từ admin, bot, hoặc user khác)
- `chat:typing` - Typing indicator từ admin
- `chat:messages_read` - Messages đã được đọc bởi admin
- `chat:session_new` - Session mới được tạo
- `chat:session_status_changed` - Status session thay đổi
- `chat:message_ack` - ACK cho message đã gửi (status: saved/failed)

### Order Events

**Customer → Server:**

- `order:join` - Join order room
- `order:leave` - Leave order room
- `order:request_support` - Yêu cầu hỗ trợ

**Server → Customer:**

- `order:created` - Order mới được tạo
- `order:updated` - Order được cập nhật
- `order:status_changed` - Status order thay đổi
- `order:payment_requested` - Yêu cầu thanh toán
- `order:payment_completed` - Thanh toán thành công
- `order:payment_failed` - Thanh toán thất bại
- `order:voucher_applied` - Voucher được áp dụng
- `order:voucher_removed` - Voucher bị gỡ
- `order:merged` - Order được merge

### Reservation Events

**Customer → Server:**

- `reservation:join` - Join reservation room
- `reservation:leave` - Leave reservation room

**Server → Customer:**

- `reservation:created` - Reservation mới được tạo
- `reservation:updated` - Reservation được cập nhật
- `reservation:status_changed` - Status reservation thay đổi
- `reservation:checked_in` - Đã check-in (kèm order nếu có)
- `reservation:deposit_payment_requested` - Yêu cầu đặt cọc (kèm payment_url)
- `reservation:deposit_payment_completed` - Đặt cọc thành công
- `reservation:deposit_payment_failed` - Đặt cọc thất bại

### Notification Events

**Customer → Server:**

- `notification:mark_read` - Đánh dấu đã đọc

**Server → Customer:**

- `notification:new` - Notification mới (tất cả loại)
- `notification:broadcast` - Broadcast notification

## Cách Sử Dụng Trong Components

### Ví dụ: Order Detail Page với Realtime Updates

```tsx
"use client";

import { useEffect, useState } from "react";
import { useOrderSocket } from "@/hooks";
import { useSocketStore } from "@/store/socketStore";

export default function OrderDetailPage({ orderId }: { orderId: string }) {
  const orderSocket = useOrderSocket();
  const { orders } = useSocketStore();
  const [order, setOrder] = useState(orders[orderId]);

  useEffect(() => {
    if (!orderSocket.isConnected) return;

    // Join order room để nhận realtime updates
    orderSocket.joinOrder(orderId);

    // Listen to status changes
    orderSocket.onOrderStatusChanged((updatedOrder) => {
      console.log("Order status updated:", updatedOrder.status);
      setOrder(updatedOrder);
    });

    return () => {
      orderSocket.leaveOrder(orderId);
    };
  }, [orderId, orderSocket]);

  // Request support
  const handleRequestSupport = () => {
    orderSocket.requestSupport(orderId);
  };

  return (
    <div>
      <h1>Order {orderId}</h1>
      <p>Status: {order?.status}</p>
      <button onClick={handleRequestSupport}>Yêu Cầu Hỗ Trợ</button>
    </div>
  );
}
```

### Ví dụ: Chat Widget với Realtime Messages

```tsx
"use client";

import { useEffect, useState } from "react";
import { useChatSocket } from "@/hooks";

export default function ChatWidget({ sessionId }: { sessionId: string }) {
  const chatSocket = useChatSocket();
  const messages = chatSocket.getMessages(sessionId);

  useEffect(() => {
    if (!chatSocket.isConnected) return;

    // Join session
    chatSocket.joinSession(sessionId);

    // Listen to new messages
    chatSocket.onMessageReceived((message) => {
      console.log("New message:", message);
    });

    return () => {
      chatSocket.leaveSession(sessionId);
    };
  }, [sessionId, chatSocket]);

  const handleSend = (text: string) => {
    chatSocket.sendMessage(sessionId, text);
  };

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.message_text}</div>
      ))}
    </div>
  );
}
```

## Testing

### Kiểm Tra Kết Nối

Mở browser console, bạn sẽ thấy logs:

- `✅ [user-web] WebSocket connected successfully`
- `📡 Socket ID: ...`
- `📡 Namespace: /customer`

### Kiểm Tra Events

Tất cả events được log với prefix:

- `[Chat]` - Chat events
- `[Order]` - Order events
- `[Reservation]` - Reservation events
- `[Socket]` - General socket events

## Troubleshooting

### Socket không kết nối

1. Kiểm tra `NEXT_PUBLIC_API_URL` trong `.env`
2. Kiểm tra backend có chạy không
3. Kiểm tra token (nếu cần) trong localStorage
4. Xem console logs để debug

### Events không nhận được

1. Đảm bảo `SocketListeners` đã được mount trong `layout.tsx`
2. Kiểm tra namespace đúng (`/customer`)
3. Kiểm tra user đã join đúng room chưa
4. Xem backend logs để xác nhận events được emit

### Store không cập nhật

1. Đảm bảo listeners đã được register
2. Kiểm tra callback functions có được gọi không
3. Sử dụng React DevTools để inspect store state

## Next Steps

1. ✅ WebSocket infrastructure đã hoàn chỉnh
2. 🔄 Tích hợp vào các component hiện có (Order Detail, Reservation Detail, Chat Widget)
3. 🔄 Thêm UI feedback khi nhận realtime updates (toasts, notifications)
4. 🔄 Optimize reconnection logic nếu cần
5. 🔄 Add error boundaries cho socket errors
