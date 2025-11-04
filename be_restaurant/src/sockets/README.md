# Socket.IO Architecture - Namespace-based with JWT Authentication

## 📋 Tổng quan

Hệ thống Socket.IO được refactor hoàn toàn theo mô hình **namespace-based authentication** với JWT middleware.

### Cấu trúc Namespaces

1. **`/admin`** - Dành cho quản trị viên và nhân viên
2. **`/customer`** - Dành cho khách hàng (cho phép anonymous)

## 🔐 Authentication & Authorization

### Admin Namespace (`/admin`)

**Middleware:** `authenticateAdmin`

- **Yêu cầu:** JWT token bắt buộc
- **Roles được phép:** `admin`, `employee` (staff)
- **Hành vi:**
  - Nếu thiếu token → `Error("Unauthorized: Missing token")`
  - Nếu role không hợp lệ → `Error("Forbidden: Invalid role for admin namespace")`
  - Khi connect thành công → tự động join vào `admin_room` và `staff_room`

### Customer Namespace (`/customer`)

**Middleware:** `authenticateCustomer`

- **Yêu cầu:** JWT token tùy chọn (cho phép anonymous)
- **Roles được phép:** `customer` hoặc anonymous
- **Hành vi:**
  - Nếu có token hợp lệ và role = `customer` → attach user data
  - Nếu không có token hoặc token lỗi → cho phép kết nối anonymous
  - Khi customer authenticated → tự động join vào `customer:<customer_id>`

## 🏗️ Architecture Pattern

### 1. Event Routing Pattern

#### Customer → Admin

Khi customer emit event trong `/customer` namespace:

```typescript
// Customer emits
socket.emit("customer:event", { event: "chat:send_message", payload: {...} });

// Backend forwards to admin
forwardToAdmin(io, "chat:new_message", {
  customer_id: userId,
  ...payload
});

// Admin receives
adminNsp.emit("customer:chat:new_message", {
  customer_id: userId,
  timestamp: "...",
  ...payload
});
```

#### Admin → Customer

Khi admin muốn gửi event đến 1 customer cụ thể:

```typescript
// Admin emits
socket.emit("admin:send_to_customer", {
  customer_id: "uuid",
  event: "chat:new_message",
  payload: {...}
});

// Backend forwards to customer room
forwardToCustomer(io, customerId, "chat:new_message", payload);

// Customer receives in their room
customerNsp.to(`customer:${customerId}`).emit("chat:new_message", {
  ...payload,
  from_admin: true,
  admin_id: userId,
  timestamp: "..."
});
```

### 2. Helper Functions

Các helper functions trong `index.ts`:

- **`forwardToAdmin(io, event, data)`** - Forward event từ customer → admin namespace
- **`forwardToCustomer(io, customerId, event, data)`** - Forward event từ admin → customer room
- **`broadcastToAdmin(io, event, data)`** - Broadcast đến tất cả admin

## 📁 Module Structure

### Chat Socket (`chatSocket.ts`)

**Admin Handlers:**

- `chat:send_message` - Admin gửi message → lưu DB → forward to customer
- `chat:typing` - Admin typing indicator
- `chat:mark_read` - Admin marks messages as read
- `chat:join_session` / `chat:leave_session` - Join/leave chat sessions

**Customer Handlers:**

- `chat:send_message` - Customer gửi message → lưu DB → forward to admin
- `chat:typing` - Customer typing indicator
- `chat:mark_read` - Customer marks messages as read
- `chat:join_session` / `chat:leave_session` - Join/leave chat sessions

**Events:**

- `chatEvents.newChatSession()` - Notify new session
- `chatEvents.sessionStatusChanged()` - Session status update
- `chatEvents.agentAssigned()` - Agent assignment
- `chatEvents.botMessage()` - Bot message to customer

### Order Socket (`orderSocket.ts`)

**Admin Handlers:**

- `order:join` / `order:leave` - Join/leave order rooms
- `order:join_table` / `order:leave_table` - Join/leave table rooms

**Customer Handlers:**

- `order:join` / `order:leave` - Join/leave order rooms
- `order:request_support` - Request support → forward to admin

**Events:**

- `orderEvents.orderCreated()` - Order created
- `orderEvents.orderUpdated()` - Order updated
- `orderEvents.orderStatusChanged()` - Status changed
- `orderEvents.paymentRequested()` - Payment requested
- `orderEvents.paymentCompleted()` - Payment completed
- `orderEvents.paymentFailed()` - Payment failed
- `orderEvents.supportRequested()` - Support requested (admin only)
- `orderEvents.voucherApplied()` - Voucher applied
- `orderEvents.voucherRemoved()` - Voucher removed
- `orderEvents.orderMerged()` - Orders merged

### Reservation Socket (`reservationSocket.ts`)

**Admin Handlers:**

- `reservation:join` / `reservation:leave` - Join/leave reservation rooms
- `reservation:join_table` / `reservation:join_table_group` - Join table rooms

**Customer Handlers:**

- `reservation:join` / `reservation:leave` - Join/leave reservation rooms

**Events:**

- `reservationEvents.reservationCreated()` - Reservation created
- `reservationEvents.reservationUpdated()` - Reservation updated
- `reservationEvents.reservationStatusChanged()` - Status changed
- `reservationEvents.reservationCheckedIn()` - Checked in
- `reservationEvents.depositPaymentRequested()` - Deposit payment requested
- `reservationEvents.depositPaymentCompleted()` - Deposit payment completed
- `reservationEvents.depositPaymentFailed()` - Deposit payment failed

### Notification Socket (`notificationSocket.ts`)

**Handlers:** Minimal (notifications are server-emitted only)

**Events:**

- `notificationEvents.notifyStaff()` - Notify all staff
- `notificationEvents.notifyUser()` - Notify specific user
- `notificationEvents.notifyCustomer()` - Notify specific customer
- `notificationEvents.broadcastNotification()` - Broadcast to all
- `notificationEvents.orderNotification()` - Order notification (staff)
- `notificationEvents.reservationNotification()` - Reservation notification (staff)
- `notificationEvents.chatNotification()` - Chat notification (staff)

## 🔒 Security Features

### 1. Role-based Access Control

- Admin namespace: Chỉ `admin` và `employee` được phép
- Customer namespace: Cho phép `customer` hoặc anonymous
- Validation tại middleware level

### 2. Customer Isolation

- Mỗi customer chỉ nhận events trong room `customer:<customer_id>`
- Admin có thể gửi event đến customer cụ thể qua `admin:send_to_customer`
- Customer không thể xem events của customer khác

### 3. Socket Cleanup

- Tracking `customer_id → socket.id` mapping
- Auto cleanup khi disconnect
- Prevent memory leaks

## 📡 Frontend Integration

### Admin Panel (admin-web)

```typescript
// Connect to admin namespace
const socket = io(`${baseUrl}/admin`, {
  auth: { token: "jwt_token" }
});

// Listen to events
socket.on("admin:chat:new_message", (data) => {
  // Handle new message
});

// Send to customer
socket.emit("admin:send_to_customer", {
  customer_id: "uuid",
  event: "chat:new_message",
  payload: {...}
});
```

### Customer Web (user-web)

```typescript
// Connect to customer namespace
const socket = io(`${baseUrl}/customer`, {
  auth: { token: "jwt_token" } // Optional for anonymous
});

// Listen to events
socket.on("chat:new_message", (data) => {
  // Handle new message
});

// Send event (will be forwarded to admin)
socket.emit("customer:event", {
  event: "chat:send_message",
  payload: {...}
});
```

## 🧪 Testing

### Test Admin Connection

```bash
# Connect with admin token
socket.io-client connect http://localhost:8000/admin \
  --auth '{"token": "admin_jwt_token"}'
```

### Test Customer Connection

```bash
# Connect with customer token
socket.io-client connect http://localhost:8000/customer \
  --auth '{"token": "customer_jwt_token"}'

# Connect anonymous
socket.io-client connect http://localhost:8000/customer
```

## 📝 Notes

1. **Legacy Support:** Root namespace vẫn hoạt động để backward compatibility
2. **Event Naming:**
   - Customer events: `customer:<event_name>`
   - Admin events: `admin:<event_name>`
3. **Room Naming:**
   - Customer rooms: `customer:<customer_id>`
   - Order rooms: `order:<order_id>`
   - Chat sessions: `chat_session:<session_id>`
4. **Error Handling:** Tất cả errors được log và emit ACK với status "failed"

## 🔄 Migration Guide

Nếu bạn đang migrate từ code cũ:

1. **Frontend:** Update connection URLs từ root namespace → `/admin` hoặc `/customer`
2. **Backend Services:** Sử dụng helper functions (`forwardToAdmin`, `forwardToCustomer`, `broadcastToAdmin`)
3. **Event Names:** Update event names theo pattern mới (`admin:*`, `customer:*`)

## 🚀 Performance

- Namespace isolation giảm overhead
- Room-based routing chỉ emit đến sockets cần thiết
- Socket cleanup tự động prevent memory leaks
- Efficient event forwarding với helper functions
