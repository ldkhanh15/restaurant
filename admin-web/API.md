## FE API Guide: Blog, Order, Reservation, Payment

This guide summarizes the available endpoints for Blog, Order, Reservation, and Payment. All responses (unless noted) follow the shape:

```json
{ "status": "success", "data": <payload> }
```

Errors are returned via centralized error handling with appropriate HTTP codes.

Assume the API base path is `/api` and endpoints below are mounted as shown:

- Blog: `/api/blog-posts`
- Orders: `/api/orders`
- Reservations: `/api/reservations`
- Payments: `/api/payments`

Authentication is via bearer token. Where roles are listed, user must be authenticated and authorized with one of the listed roles.

### Conventions

- Pagination: `page` (default 1), `limit` (default 10), optional `sortBy` and `sortOrder` are supported internally for list endpoints that use pagination.
- UUID path params are strings.
- Money numbers are decimal numbers (server returns as numbers).

---

## Blog

Base: `/api/blog-posts`

### GET `/` (Public)

- Query: `page?`, `limit?`, `status?` in `draft|published|deleted`.
- Response: paginated list `{ items, total, page, limit }` under `data`.

### GET `/published` (Public)

- Response: array of published posts.

### GET `/:id` (Public)

- Path: `id` (UUID)
- Response: blog post object.

### POST `/` (Admin)

- Auth: roles `admin`
- Body:
  - `title` string 10-200, `content` string ≥50
  - Optional: `slug` (slug), `thumbnail_url` URL, `cover_image_url` URL,
    `tags` array, `category` string, `status` in `draft|published|deleted`,
    `meta_title` ≤200, `meta_description` ≤300, `keywords` array
- Behavior: auto-generates `slug` from `title` if missing; sets `author_id` from authenticated user.
- Response: created post.

### PUT `/:id` (Admin)

- Auth: roles `admin`
- Body: same fields as POST but all optional; if `title` provided and `slug` missing, backend regenerates `slug`.
- Response: updated post.

### DELETE `/:id` (Admin)

- Auth: roles `admin`
- Response: `{ status: "success", message: "Blog post deleted successfully" }`

---

## Orders

Base: `/api/orders`

### GET `/` (Admin/Employee)

- Auth: roles `admin|employee`
- Query: `page?`, `limit?`, `search?`
- Response: paginated orders including `items`.

### GET `/user/:userId` (Authenticated)

- Auth: any authenticated; customers can only access their own `userId`.
- Query: `page?`, `limit?`
- Response: paginated orders for the user.

### GET `/status/:status` (Authenticated)

- Auth: any authenticated; customers limited to their orders.
- Path: `status` in allowed list (server-validated).
- Query: `page?`, `limit?`
- Response: paginated orders with that status.

### GET `/:id` (Authenticated)

- Auth: any authenticated; customers limited to own order.
- Response: order with `items`.

### GET `/:id/details` (Authenticated)

- Same as above; returns order with `items`.

### POST `/` (Authenticated)

- Auth: any authenticated
- Body:
  - `items`: array of `{ dish_id: UUID, quantity: integer, price: number, customizations? }` (min 1)
  - Optional: `voucher_code` string, `table_id` UUID, `user_id` UUID, `staff_id` UUID, `status` in `pending|dining`
- Response: created order with `items` and computed totals (`total_amount`, `voucher_discount_amount`, `final_amount`).

### PUT `/:id` (Authenticated)

- Auth: any authenticated; customers can only update their own order.
- Body: any order fields to update.
- Response: updated order.

### DELETE `/:id` (Admin)

- Auth: roles `admin`
- Response: `{ status, message: "Order deleted successfully" }`

### PUT `/:id/status` (Authenticated)

- Auth: any authenticated; customers limited to own order.
- Body: `{ status }` where status must be one of allowed values (backend-enforced).
- Response: updated order with `items`.

### POST `/:id/apply-voucher` (Authenticated)

- Auth: any authenticated; customers limited to own order.
- Body: `{ code: string }`
- Response: updated order with applied voucher and recomputed `final_amount`.

### DELETE `/:id/remove-voucher` (Authenticated)

- Auth: `customer|employee|admin`
- Response: updated order with voucher removed.

### PATCH `/:id/discount` (Employee/Admin)

- Auth: roles `employee|admin`
- Body: `{ amount: number >= 0 }`
- Response: updated order with manual discount applied (voucher cleared).

### POST `/:id/items` (Customer/Employee/Admin)

- Auth: roles `customer|employee|admin`
- Body: `{ dish_id: UUID, quantity: integer>=1 }`
- Response: updated order with `items` and recomputed totals.

### PATCH `/:orderId/items/:itemId` (Customer/Employee/Admin)

- Auth: roles `customer|employee|admin`
- Body: `{ quantity: integer>=0 }` (0 removes the item)
- Response: updated order with `items`.

### DELETE `/:orderId/items/:itemId` (Customer/Employee/Admin)

- Auth: roles `customer|employee|admin`
- Response: updated order with `items`.

### DELETE `/:orderId/items/:itemId/cancel` (Customer/Employee/Admin)

- Auth: roles `customer|employee|admin`
- Behavior: cancels item only if `status === "pending"`.
- Response: updated order with `items`.

### PATCH `/:orderId/items/:itemId/status` (Employee/Admin)

- Auth: roles `employee|admin`
- Body: `{ status: "pending" | "completed" }`
- Response: updated order with `items`.

### PUT `/:id/change-table` (Employee/Admin)

- Auth: roles `employee|admin`
- Body: `{ new_table_id: UUID }`
- Behavior: sets new table occupied, frees old table if appropriate.
- Response: updated order with `items`.

### GET `/:id/summary` (Customer/Employee/Admin)

- Auth: roles `customer|employee|admin`
- Response: `{ subtotal, event_fee, deposit, vat_rate, vat, discount, total }`.

### POST `/:id/split` (Employee/Admin)

- Auth: roles `employee|admin`
- Body: `{ item_ids: UUID[] }`
- Response: `{ source: <updated original>, target: <new order> }`.

### PATCH `/:id/event` (Employee/Admin)

- Auth: roles `employee|admin`
- Body: `{ event_id?: UUID, event_fee?: number>=0 }`
- Response: updated order with `items` (totals recomputed including `event_fee`).

### POST `/:id/request-support` (Customer/Employee/Admin)

- Auth: roles `customer|employee|admin`
- Behavior: sends support request notification to staff.
- Response: `{ status: "success", message: "Support requested" }`.

### POST `/:id/request-payment` (Customer/Employee/Admin)

- Auth: roles `customer|employee|admin`
- Behavior: sets status to `waiting_payment`.
- Response: updated order.

### PATCH `/:id/payment-method` (Customer/Employee/Admin)

- Auth: roles `customer|employee|admin`
- Body: `{ payment_method: "cash|vnpay|momo|zalopay|card|qr" }`
- Response: updated order.

### PATCH `/:id/complete-payment` (Employee/Admin)

- Auth: roles `employee|admin`
- Behavior: sets `payment_status=paid` and `status=paid`.
- Response: updated order.

### GET `/:id/invoice` (Customer/Employee/Admin)

- Auth: roles `customer|employee|admin`
- Response: `{ order, invoice }` (placeholder `invoice` string in current implementation).

### POST `/:id/review` (Customer)

- Auth: role `customer`
- Body: `{ type: "dish|table", rating: 1..5, ... }` (other fields as defined in `Review` model)
- Response: created review.

### POST `/:id/complaint` (Customer/Employee/Admin)

- Auth: roles `customer|employee|admin`
- Body: `{ description: string, ... }`
- Response: created complaint.

### GET `/:id/print-preview` (Employee/Admin)

- Auth: roles `employee|admin`
- Response: `{ order, preview: true }`.

### POST `/merge` (Employee/Admin)

- Auth: roles `employee|admin`
- Body: `{ source_table_id: UUID, target_table_id: UUID }`
- Response: merged target order with consolidated items; frees source table.

---

## Reservations

Base: `/api/reservations`

All reservation routes require authentication (`router.use(authenticate)`).

### GET `/` (Admin/Employee)

- Auth: roles `admin|employee`
- Query: `page?`, `limit?`
- Response: paginated reservations with details.

### GET `/:id` (Authenticated)

- Response: reservation by id.

### POST `/` (Authenticated)

- Body: reservation fields (see `Reservation` model); server validates.
- Response: created reservation.

### PUT `/:id` (Authenticated)

- Body: reservation fields to update.
- Response: updated reservation.

### DELETE `/:id` (Authenticated)

- Response: `{ status, message: "Reservation deleted successfully" }`.

### PATCH `/:id/confirm` (Admin/Employee)

- Auth: roles `admin|employee`
- Behavior: sets `status=confirmed`.
- Response: updated reservation.

### PATCH `/:id/event` (Admin/Employee)

- Auth: roles `admin|employee`
- Body: `{ event_id?: UUID, event_fee?: number>=0 }`
- Response: updated reservation.

### POST `/:id/create-order` (Admin/Employee)

- Auth: roles `admin|employee`
- Body: `{ items?: [{ dish_id: UUID, quantity: integer }] }`
- Behavior: creates or reuses a pending order linked to the reservation; optionally attaches items; totals computed with `event_fee`, `deposit`, `voucher_discount_amount`.
- Response: created/reloaded order with `items`.

### POST `/:id/items` (Admin/Employee)

- Auth: roles `admin|employee`
- Body: `{ dish_id: UUID, quantity: integer>=1 }`
- Behavior: auto-creates pending order if absent; adds/merges items; recomputes totals.
- Response: updated order with `items`.

### POST `/:id/checkin` (Admin/Employee)

- Auth: roles `admin|employee`
- Behavior: sets order status to `dining` and marks table `occupied`.
- Response: updated order with `items`.

---

## Payments

Base: `/api/payments`

### VNPay: Create payment URL (Authenticated)

POST `/vnpay/create`

- Body: `{ order_id: UUID, bankCode?: string }`
- Response: `{ redirect_url }` to VNPay.
- Notes: Fails if order is already `paid`. Customers can only pay their own orders.

### VNPay: Return URL (Public redirect)

GET `/vnpay/return`

- Query: VNPay return params (server-verified).
- Redirects to frontend:
  - Success order: `/payment/success?order_id=<id>`
  - Failed: `/payment/failed?...`
  - Deposit cases include `type=deposit` and `order_id` or `reservation_id`.

### VNPay: IPN (VNPay server -> backend)

POST `/vnpay/ipn`

- Body: VNPay IPN payload (server-verified).
- Response JSON: `{ RspCode, Message }` per VNPay spec; updates order/reservation amounts and statuses.

### VNPay: Create deposit for Order (Authenticated)

POST `/vnpay/deposit/order`

- Body: `{ order_id: UUID, amount: number>0, bankCode?: string }`
- Response: `{ redirect_url }` to VNPay for deposit.

### VNPay: Create deposit for Reservation (Authenticated)

POST `/vnpay/deposit/reservation`

- Body: `{ reservation_id: UUID, amount: number>0, bankCode?: string }`
- Response: `{ redirect_url }` to VNPay for deposit.

### Payments CRUD (Authenticated)

#### GET `/`

- List payments.

#### GET `/search`

- Search payments (server-defined criteria).

#### GET `/:id`

- Retrieve single payment.

#### POST `/`

- Body: `{ amount: number>0, method: "cash|credit_card|momo|vnpay|zalopay|card|qr", status: "pending|completed|failed", order_id?: UUID, reservation_id?: UUID }`
- Response: created payment.

#### PUT `/:id`

- Body: same as POST but optional fields; updates payment.

#### DELETE `/:id`

- Deletes a payment.

---

---

## Notifications

Base: `/api/notifications`

The notification system provides real-time alerts to staff when customers perform various actions like placing orders, making reservations, sending chat messages, or requesting support.

### GET `/` (Authenticated)

- Response: paginated list of all notifications with user details.

### GET `/unread` (Authenticated)

- Response: array of unread notifications for the authenticated user.

### GET `/:id` (Authenticated)

- Response: single notification by id.

### POST `/` (Admin)

- Auth: roles `admin`
- Body: notification fields
- Response: created notification.

### PUT `/:id` (Authenticated)

- Body: notification fields to update.
- Response: updated notification.

### DELETE `/:id` (Authenticated)

- Response: `{ status, message: "Notification deleted successfully" }`.

### PATCH `/:id/read` (Authenticated)

- Behavior: marks notification as read.
- Response: updated notification.

### PATCH `/read-all` (Authenticated)

- Behavior: marks all notifications as read for the authenticated user.
- Response: `{ status, message: "All notifications marked as read" }`.

### Notification Types

The system automatically creates notifications for:

- **`order_created`**: New order placed by customer
- **`order_updated`**: Order modified (items added/removed, quantities changed)
- **`order_status_changed`**: Order status updated (pending → preparing → ready → delivered)
- **`reservation_created`**: New table reservation made
- **`reservation_updated`**: Reservation details modified
- **`chat_message`**: New customer message in chat session
- **`support_request`**: Customer requests support for their order
- **`payment_completed`**: Order payment completed successfully

### Notification Data Structure

```json
{
  "id": "uuid",
  "type": "order_created|order_updated|...",
  "title": "Đơn hàng mới",
  "content": "Khách hàng đã tạo đơn hàng mới #123 với tổng tiền 150000đ",
  "data": {
    "order_id": "uuid",
    "table_id": "uuid",
    "amount": 150000
  },
  "is_read": false,
  "sent_at": "2024-01-01T10:00:00Z",
  "status": "sent"
}
```

---

## Chat

Base: `/api/chat/sessions` and `/api/chat/messages`

### Chat Sessions

Base: `/api/chat/sessions`

#### GET `/` (Admin/Employee)

- Auth: roles `admin|employee`
- Query: `page?`, `limit?`
- Response: paginated chat sessions with user details.

#### GET `/:id` (Authenticated)

- Response: chat session by id.

#### POST `/` (Authenticated)

- Auth: any authenticated
- Body: `{ device_id?: string, name?: string }`
- Behavior: auto-sets `user_id` and `is_authenticated=true` if user is logged in; uses `x-device-id` header for name if not provided.
- Response: created session.

#### PUT `/:id` (Authenticated)

- Body: session fields to update.
- Response: updated session.

#### DELETE `/:id` (Authenticated)

- Response: `{ status, message: "Chat session deleted successfully" }`.

### Chat Messages

Base: `/api/chat/messages`

#### GET `/session/:sessionId` (Authenticated)

- Response: array of messages for the session.

#### GET `/:id` (Authenticated)

- Response: single message by id.

#### POST `/` (Authenticated)

- Body:
  - `session_id: UUID` (required)
  - `sender_type: "user" | "bot" | "human"` (required)
  - `message_text: string` (required, min 1 char)
- Behavior: emits `messageReceived` WebSocket event to session room.
- Response: created message.

#### PUT `/:id` (Authenticated)

- Body: message fields to update.
- Response: updated message.

#### DELETE `/:id` (Authenticated)

- Response: `{ status, message: "Chat message deleted successfully" }`.

---

## WebSocket Events

### Connection Setup

WebSocket server runs on the same port as HTTP server. Authentication is optional via JWT token in:

- `socket.handshake.auth.token` or
- `socket.handshake.query.token`

### Chat WebSocket (`/chat` namespace)

#### Client Events (emit to server):

- `joinSession(sessionId: string)` - Join a chat session room
- `newMessage(payload)` - Broadcast new message to session
- `typing(payload)` - Send typing indicator
- `sessionClosed(payload)` - Notify session closure

#### Server Events (listen from server):

- `messageReceived(payload)` - New message in session
- `typing({ session_id, from })` - Typing indicator from user
- `sessionClosed(payload)` - Session closed notification

### Order WebSocket (`/order` namespace)

#### Client Events (emit to server):

- `joinOrder(orderId: string)` - Join an order room
- `joinTable(tableId: string)` - Join a table room

#### Server Events (listen from server):

- `orderCreated(payload)` - New order created
- `orderUpdated(payload)` - Order modified (items, totals, etc.)
- `orderStatusChanged(payload)` - Order status updated
- `tableChanged(payload)` - Order moved to different table
- `paymentRequested(payload)` - Payment requested for order
- `paymentCompleted(payload)` - Payment completed
- `voucherApplied(payload)` - Voucher applied to order
- `voucherRemoved(payload)` - Voucher removed from order
- `orderSplit(payload)` - Order split into multiple orders

### Notification WebSocket (`/notifications` namespace)

#### Client Events (emit to server):

- `joinStaffRoom()` - Join staff room to receive all notifications
- `joinUserRoom(userId: string)` - Join specific user room for personal notifications
- `leaveUserRoom(userId: string)` - Leave user room

#### Server Events (listen from server):

- `newNotification(notification)` - New notification received (real-time alerts for staff)

### WebSocket Room Strategy

- **Chat**: Rooms are `session:{sessionId}`
- **Orders**: Rooms are `order:{orderId}` and `table:{tableId}`
- **Notifications**: Rooms are `staff` (all staff) and `user:{userId}` (specific user)
- Events are broadcast to relevant rooms (order + table for order events)

### Frontend Integration Example

```javascript
// Connect to WebSocket
const socket = io("ws://localhost:3000", {
  auth: { token: "your-jwt-token" },
});

// Chat
const chatSocket = socket.of("/chat");
chatSocket.emit("joinSession", "session-uuid");
chatSocket.on("messageReceived", (message) => {
  // Handle new message
});

// Orders
const orderSocket = socket.of("/order");
orderSocket.emit("joinOrder", "order-uuid");
orderSocket.emit("joinTable", "table-uuid");
orderSocket.on("orderStatusChanged", (order) => {
  // Handle order status update
});

// Notifications
const notificationSocket = socket.of("/notifications");
notificationSocket.emit("joinStaffRoom");
notificationSocket.on("newNotification", (notification) => {
  // Handle new notification (show toast, update badge, etc.)
});
```
