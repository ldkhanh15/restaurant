# Notification System - User-Web

## Tổng Quan

Hệ thống notification cho user-web đã được hoàn thiện với đầy đủ:
- API endpoints với phân quyền đúng user
- WebSocket realtime events cho namespace `/customer`
- UI component (NotificationBell) với click handler và redirect
- Đồng bộ giữa API và Socket.IO

## Backend API Endpoints

### Customer Endpoints

Tất cả endpoints đều yêu cầu authentication và tự động filter theo `req.user.id` nếu user là customer:

| Method | Endpoint | Description | Authorization |
|--------|----------|-------------|---------------|
| GET | `/api/notifications` | Lấy danh sách notifications (tự động filter theo user nếu customer) | Customer: chỉ thấy của mình |
| GET | `/api/notifications/:id` | Lấy notification theo ID | Customer: chỉ thấy của mình (403 nếu không phải) |
| GET | `/api/notifications/unread/count` | Số lượng chưa đọc | Customer: chỉ đếm của mình |
| GET | `/api/notifications/unread/list` | Danh sách chưa đọc | Customer: chỉ thấy của mình |
| PATCH | `/api/notifications/:id/read` | Đánh dấu đã đọc | Customer: chỉ đánh dấu của mình (403 nếu không phải) |
| PATCH | `/api/notifications/read-all` | Đánh dấu tất cả đã đọc | Customer: chỉ đánh dấu của mình |
| DELETE | `/api/notifications/:id` | Xóa notification | Customer: chỉ xóa của mình (403 nếu không phải) |

### Phân Quyền

- **Customer**: Chỉ có thể xem, đánh dấu đã đọc, xóa notifications của chính họ
- **Admin/Employee**: Có thể xem tất cả notifications, có thể filter theo `user_id`

## WebSocket Events

### Customer → Server (Emit)

| Event | Payload | Description |
|-------|---------|-------------|
| `notification:mark_read` | `{ notificationIds: string[] }` | Đánh dấu một hoặc nhiều notifications đã đọc |
| `notification:mark_all_read` | `{}` | Đánh dấu tất cả notifications đã đọc |

### Server → Customer (Listen)

| Event | Payload | Description |
|-------|---------|-------------|
| `notification:new` | `Notification` | Notification mới được tạo cho user |
| `notification:update` | `{ notifications: [{ id, is_read }] }` hoặc `{ id, is_read }` | Cập nhật trạng thái read/unread |
| `notification:mark_all_read` | `{ userId, affected_count }` | Confirmation khi mark all as read |
| `notification:error` | `{ message: string }` | Lỗi (unauthorized, invalid data, etc.) |

### Room Management

Khi customer kết nối vào `/customer` namespace:
1. Socket tự động join room `customer:${userId}` nếu đã authenticate
2. Server emit notifications vào room này để đảm bảo đúng user nhận được

## Frontend Implementation

### Service (`src/services/notificationService.ts`)

```typescript
import { notificationService } from "@/services/notificationService";

// Get all notifications
const response = await notificationService.getAll({ limit: 20 });

// Get unread count
const { data } = await notificationService.getUnreadCount();

// Mark as read
await notificationService.markAsRead(notificationId);

// Mark all as read
await notificationService.markAllAsRead();
```

### Hook (`src/hooks/useNotificationSocket.ts`)

```typescript
import { useNotificationSocket } from "@/hooks";

function MyComponent() {
  const notificationSocket = useNotificationSocket();

  useEffect(() => {
    // Listen to new notifications
    notificationSocket.onNewNotification((notification) => {
      console.log("New notification:", notification);
    });

    // Listen to updates
    notificationSocket.onNotificationUpdate((data) => {
      console.log("Notifications updated:", data);
    });
  }, []);

  // Mark as read
  const handleClick = () => {
    notificationSocket.markNotificationsAsRead([notificationId]);
    // Or mark all
    notificationSocket.markAllAsRead();
  };
}
```

### Component (`src/components/notification/NotificationBell.tsx`)

Component đã được tích hợp vào Header, tự động:
- Load notifications từ API khi mount
- Listen realtime events
- Hiển thị unread count badge
- Handle click → mark as read + redirect
- "Mark all as read" button

### Store (`src/store/socketStore.ts`)

```typescript
import { useSocketStore } from "@/store/socketStore";

const { notifications, unreadCount, addNotification, markAsRead } = useSocketStore();
```

## Flow Diagram

```
1. User Login
   ↓
2. WebSocket connects to /customer namespace
   ↓
3. Socket joins room: customer:${userId}
   ↓
4. Component mounts → Fetch notifications via API
   ↓
5. Listen to socket events:
   - notification:new → Add to list
   - notification:update → Update read status
   ↓
6. User clicks notification:
   - Call API markAsRead()
   - Emit socket notification:mark_read
   - Update UI
   - Redirect to appropriate page
```

## Redirect Logic

| Notification Type | Redirect Path |
|-------------------|---------------|
| `order_*` | `/orders/${order_id}` hoặc `/orders` |
| `reservation_*` | `/reservations/${reservation_id}` hoặc `/reservations` |
| `chat_message`, `support_request` | Open chat widget (null) |
| `promotion` | `/vouchers` |
| Other | null (no redirect) |

## Security

### Backend Validation

1. **Controller Level**: Mỗi endpoint kiểm tra `req.user.id` và `req.user.role`
   - Customer chỉ thấy/update notifications có `user_id === req.user.id`
   - Admin/Employee có thể xem tất cả

2. **Socket Level**: 
   - Customer phải authenticate để join room
   - Server verify ownership trước khi mark as read
   - Emit error nếu user cố truy cập notification của người khác

3. **Service Level**:
   - Validate user exists khi tạo notification
   - Verify ownership khi update/delete

### Frontend Validation

- Chỉ hiển thị notifications từ API (đã được filter)
- Socket events chỉ update notifications đã có trong store
- Redirect paths validate từ notification metadata

## Testing Checklist

✅ **User A chỉ nhận thông báo của user A**
- Test: Login với user A, tạo notification cho user A
- Expected: User A nhận được, User B không nhận được

✅ **User B không nhận event của user A**
- Test: Login với user B, emit notification cho user A
- Expected: User B không nhận được event

✅ **Khi tạo thông báo mới → A nhận realtime**
- Test: Tạo notification với `user_id = A`
- Expected: User A nhận `notification:new` event ngay lập tức

✅ **Khi A click đọc → DB và UI cập nhật đúng**
- Test: Click vào notification chưa đọc
- Expected: 
  - API call thành công
  - Socket emit `notification:update`
  - UI cập nhật `is_read = true`
  - Unread count giảm

✅ **Khi reload trang → API trả dữ liệu đồng nhất với socket**
- Test: Reload sau khi nhận socket event
- Expected: API trả về cùng dữ liệu đã nhận từ socket

## Error Handling

### Backend Errors

- `401 Unauthorized`: Không có token hoặc token invalid
- `403 Forbidden`: Customer cố truy cập notification của người khác
- `404 Not Found`: Notification không tồn tại
- Socket `notification:error`: Unauthorized, invalid data, etc.

### Frontend Errors

- API errors → Toast notification
- Socket errors → Console log + optional toast
- Optimistic updates → Rollback nếu API call fails

## Next Steps (Suggestions)

1. Add notification sound (optional)
2. Add notification badge animation
3. Add infinite scroll cho notification list
4. Add notification filters (type, date range)
5. Add delete notification functionality trong UI
6. Add notification preferences (turn on/off by type)

