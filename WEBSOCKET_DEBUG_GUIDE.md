# Hướng dẫn kiểm tra và debug WebSocket

## Các thay đổi đã thực hiện

### 1. Backend (`be_restaurant`)

#### Sửa lỗi authentication namespace `/admin`

**File:** `be_restaurant/src/sockets/index.ts`

**Vấn đề:** Backend đang check role `"staff"` nhưng database và JWT sử dụng role `"employee"`

**Sửa:**

```typescript
// Trước:
if (!decoded || (decoded.role !== "admin" && decoded.role !== "staff")) {
  return next(new Error("Forbidden"));
}

// Sau:
// Allow admin and employee (employee is the backend role for staff)
if (!decoded || (decoded.role !== "admin" && decoded.role !== "employee")) {
  return next(new Error("Forbidden"));
}
```

### 2. Frontend (`admin-web`)

#### Cải thiện logging trong WebSocketProvider

**File:** `admin-web/src/providers/WebSocketProvider.tsx`

**Thêm:**

- Detailed logs khi connect/disconnect
- Log namespace, socket ID, transport type
- Log module-specific connection confirmations
- Log user info (userId, role, email) khi connect

### 3. Trang test WebSocket

**File:** `admin-web/src/app/(test)/websocket-customer/page.tsx`

Trang test hoàn chỉnh với:

- Real-time connection status monitoring
- Separate tabs for Chat, Orders, Reservations, Notifications
- Connection logs viewer
- Event listeners for all WebSocket events
- Test controls for sending messages

## Cách kiểm tra

### Bước 1: Khởi động backend

```bash
cd be_restaurant
npm run dev
```

Kiểm tra log backend có hiển thị:

```
Socket.IO server initialized
Server running on port 8000
```

### Bước 2: Khởi động frontend

```bash
cd admin-web
npm run dev
```

### Bước 3: Đăng nhập

1. Truy cập `http://localhost:3000/login`
2. Đăng nhập với tài khoản admin hoặc employee
3. Mở Console (F12) để xem logs

### Bước 4: Kiểm tra Console logs

**Logs thành công sẽ như sau:**

```
🔍 WebSocket connection effect triggered {hasToken: true, hasUser: true, userRole: "staff", userId: "xxx"}
✅ Conditions met, connecting...
🔌 Attempting to connect WebSocket... {token: "exists", userRole: "staff", userId: "xxx", userEmail: "xxx@example.com"}
🔌 Connecting to /admin namespace... (role: staff, userId: xxx)
✅ admin WebSocket connected successfully
📡 Socket ID: abc123
📡 Namespace: /admin
📡 Transport: websocket
✅ Order module connected on admin namespace
✅ Reservation module connected on admin namespace
✅ Notification module connected on admin namespace
✅ Chat module connected on admin namespace
```

**Nếu gặp lỗi:**

```
❌ admin WebSocket connection error: Forbidden
```

→ Kiểm tra lại backend có đã restart chưa và role mapping

### Bước 5: Truy cập trang test

1. Mở `http://localhost:3000/(test)/websocket-customer`
2. Kiểm tra Connection Status cards
3. Kiểm tra Connection Logs tab
4. Test gửi tin nhắn trong Chat tab

### Bước 6: Kiểm tra từng module

#### Module Orders

1. Vào trang `/orders`
2. Kiểm tra WebSocket status badge (phải hiện "Đã kết nối")
3. Tạo order mới từ một tab khác → Phải tự động update

#### Module Reservations

1. Vào trang `/reservations`
2. Kiểm tra WebSocket status badge
3. Tạo reservation mới → Phải tự động update

#### Module Notifications

1. Vào trang `/notifications`
2. Kiểm tra connection status
3. Tạo event từ module khác → Phải nhận notification

#### Module Chat

1. Vào trang `/chat`
2. Chọn một session
3. Gửi tin nhắn → Phải nhận ACK và hiển thị

## Kiểm tra Backend logs

Khi frontend connect, backend phải log:

```
[WS] /admin connected user=xxx role=employee
```

Hoặc cho customer:

```
[WS] /customer connected user=xxx
```

## Troubleshooting

### Vấn đề: WebSocket không kết nối

**Kiểm tra:**

1. `user.role` có được load chưa? (Check console log)
2. Token có valid không?
3. Backend có chạy không? (`http://localhost:8000`)
4. CORS có đúng không?

**Cách fix:**

- Logout và login lại để reload user info
- Clear localStorage
- Restart backend

### Vấn đề: "Missing user role"

**Nguyên nhân:** API `/auth/me` chưa được gọi hoặc failed

**Cách fix:**

1. Check console có log "Failed to load user info" không
2. Check API response của `/auth/me`
3. Check token validity

### Vấn đề: Backend reject với "Forbidden"

**Nguyên nhân:** Backend chưa accept role `"employee"`

**Cách fix:**

1. Đảm bảo đã sửa file `be_restaurant/src/sockets/index.ts`
2. Restart backend
3. Check lại backend logs

### Vấn đề: Events không được nhận

**Kiểm tra:**

1. Module-specific status (chat:connected, order:connected, etc.)
2. Event listeners có được setup đúng không
3. Backend có emit events không

**Debug:**

```javascript
// Thêm vào console để listen all events
socket.onAny((event, ...args) => {
  console.log("Received event:", event, args);
});
```

## Role Mapping Reference

| Database Role | JWT Role   | Frontend Role | Namespace   |
| ------------- | ---------- | ------------- | ----------- |
| `admin`       | `admin`    | `admin`       | `/admin`    |
| `employee`    | `employee` | `staff`       | `/admin`    |
| `customer`    | `customer` | `customer`    | `/customer` |

## API Endpoints

### Authentication

- `POST /api/auth/login` - Đăng nhập (trả về token)
- `GET /api/auth/me` - Lấy thông tin user hiện tại (cần token)

### WebSocket Namespaces

- `/admin` - Dành cho admin và employee (staff)
- `/customer` - Dành cho customer

### Events Reference

#### Order Events

- `orderCreated` / `order:created`
- `orderUpdated` / `order:updated`
- `orderStatusChanged` / `order:status_changed`
- `paymentCompleted` / `order:payment_completed`

#### Reservation Events

- `reservationCreated` / `reservation:created`
- `reservationUpdated` / `reservation:updated`
- `reservationStatusChanged` / `reservation:status_changed`

#### Notification Events

- `notification:new`
- `notification:order`
- `notification:reservation`
- `notification:chat`
- `notifications:marked_read`

#### Chat Events

- `chat:new_message`
- `chat:session_new`
- `chat:session_status_changed`
- `chat:message_read`
- `chat:typing_start`
- `chat:typing_end`

## Test Scenarios

### 1. Test Admin/Staff Connection

1. Login as admin or employee
2. Check console for `/admin` namespace connection
3. Navigate to each module page
4. Verify WebSocket status shows "Connected"

### 2. Test Customer Connection

1. Login as customer (or create customer account)
2. Check console for `/customer` namespace connection
3. Navigate to customer pages
4. Verify only customer-specific events are received

### 3. Test Real-time Updates

1. Open same page in 2 browser windows
2. Create/update record in window 1
3. Verify window 2 auto-updates

### 4. Test Cross-module Events

1. Create an order
2. Check if notification is received
3. Verify notification count updates

## Environment Variables

Đảm bảo file `.env.local` của admin-web có:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Next Steps

1. ✅ Test WebSocket connection với admin account
2. ✅ Test WebSocket connection với employee account
3. ✅ Test WebSocket connection với customer account
4. Test real-time events trong từng module
5. Test edge cases (disconnect, reconnect, etc.)
6. Performance testing với nhiều connections

## Liên hệ hỗ trợ

Nếu vẫn gặp vấn đề, cung cấp:

1. Console logs (full)
2. Backend logs
3. User role và token (first 10 chars)
4. Browser và version
5. Screenshots nếu có
