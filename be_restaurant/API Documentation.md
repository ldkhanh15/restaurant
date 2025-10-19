# Restaurant Backend API Documentation

## 🔐 Authentication & Authorization

Hệ thống sử dụng **JWT (JSON Web Token)** để xác thực và phân quyền:

### Authentication Flow

1. **Login**: Client gửi credentials → Server trả về JWT token
2. **Authorization**: Client gửi token trong header `Authorization: Bearer <token>`
3. **Token Validation**: Middleware `authenticate` kiểm tra token hợp lệ
4. **Role-based Access**: Middleware `authorize` kiểm tra quyền truy cập

### User Roles

- **customer**: Khách hàng thông thường
- **employee**: Nhân viên nhà hàng
- **admin**: Quản trị viên

### Middleware

- `authenticate`: Kiểm tra JWT token
- `authorize(roles)`: Kiểm tra quyền truy cập theo role

---

## 📢 Notification Module

### GET /api/notifications

- ✅ **Mô tả chức năng**: Lấy danh sách thông báo với bộ lọc
- 🔑 **Quyền truy cập**: Tất cả user đã xác thực
- 📥 **Input**:
  - Query: `user_id` (UUID, optional), `type` (enum, optional), `is_read` (boolean, optional)
  - Headers: `Authorization: Bearer <token>`
- 📤 **Output (200)**:

```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "type": "order_created|order_updated|reservation_confirm|...",
        "title": "string",
        "content": "string",
        "data": {},
        "is_read": false,
        "sent_at": "2024-01-01T00:00:00Z",
        "status": "sent|failed"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

- 🚫 **Error cases**: 401 (Unauthorized), 400 (Invalid query params)

### GET /api/notifications/:id

- ✅ **Mô tả chức năng**: Lấy thông báo theo ID
- 🔑 **Quyền truy cập**: Tất cả user đã xác thực
- 📥 **Input**: Path param `id` (UUID)
- 📤 **Output (200)**: Thông báo object
- 🚫 **Error cases**: 401, 404 (Not found)

### GET /api/notifications/unread/count

- ✅ **Mô tả chức năng**: Lấy số lượng thông báo chưa đọc
- 🔑 **Quyền truy cập**: Tất cả user đã xác thực
- 📥 **Input**: Headers: `Authorization: Bearer <token>`
- 📤 **Output (200)**:

```json
{
  "status": "success",
  "data": { "count": 5 }
}
```

### GET /api/notifications/unread/list

- ✅ **Mô tả chức năng**: Lấy danh sách thông báo chưa đọc
- 🔑 **Quyền truy cập**: Tất cả user đã xác thực
- 📥 **Input**: Headers: `Authorization: Bearer <token>`
- 📤 **Output (200)**: Array of unread notifications

### GET /api/notifications/stats

- ✅ **Mô tả chức năng**: Lấy thống kê thông báo
- 🔑 **Quyền truy cập**: admin, employee
- 📥 **Input**: Headers: `Authorization: Bearer <token>`
- 📤 **Output (200)**: Notification statistics

### GET /api/notifications/recent

- ✅ **Mô tả chức năng**: Lấy thông báo gần đây
- 🔑 **Quyền truy cập**: admin, employee
- 📥 **Input**: Query `limit` (1-100, default 20)
- 📤 **Output (200)**: Array of recent notifications

### GET /api/notifications/type/:type

- ✅ **Mô tả chức năng**: Lấy thông báo theo loại
- 🔑 **Quyền truy cập**: admin, employee
- 📥 **Input**: Path param `type`, Query `limit` (1-100, default 50)
- 📤 **Output (200)**: Array of notifications by type

### POST /api/notifications

- ✅ **Mô tả chức năng**: Tạo thông báo mới
- 🔑 **Quyền truy cập**: admin, employee
- 📥 **Input**:

```json
{
  "type": "order_created|order_updated|reservation_confirm|promotion|...",
  "title": "string (max 200 chars)",
  "content": "string (1-1000 chars)",
  "user_id": "uuid (optional)",
  "data": {} // optional
}
```

- 📤 **Output (201)**: Created notification object
- 🚫 **Error cases**: 401, 403, 400 (Validation error)

### PUT /api/notifications/:id

- ✅ **Mô tả chức năng**: Cập nhật thông báo
- 🔑 **Quyền truy cập**: Tất cả user đã xác thực
- 📥 **Input**:

```json
{
  "title": "string (optional)",
  "content": "string (optional)",
  "data": {} // optional
}
```

- 📤 **Output (200)**: Updated notification object

### DELETE /api/notifications/:id

- ✅ **Mô tả chức năng**: Xóa thông báo
- 🔑 **Quyền truy cập**: Tất cả user đã xác thực
- 📥 **Input**: Path param `id`
- 📤 **Output (200)**:

```json
{
  "status": "success",
  "message": "Notification deleted successfully"
}
```

### PATCH /api/notifications/:id/read

- ✅ **Mô tả chức năng**: Đánh dấu thông báo đã đọc
- 🔑 **Quyền truy cập**: Tất cả user đã xác thực
- 📥 **Input**: Path param `id`
- 📤 **Output (200)**: Updated notification object

### PATCH /api/notifications/read-all

- ✅ **Mô tả chức năng**: Đánh dấu tất cả thông báo đã đọc
- 🔑 **Quyền truy cập**: Tất cả user đã xác thực
- 📥 **Input**: Headers: `Authorization: Bearer <token>`
- 📤 **Output (200)**: Result object

### DELETE /api/notifications/cleanup

- ✅ **Mô tả chức năng**: Xóa thông báo cũ
- 🔑 **Quyền truy cập**: admin, employee
- 📥 **Input**:

```json
{
  "days_old": 30 // optional, default 30
}
```

- 📤 **Output (200)**:

```json
{
  "status": "success",
  "data": { "deleted_count": 15 }
}
```

---

## 🍽️ Order Module

### GET /api/orders

- ✅ **Mô tả chức năng**: Lấy danh sách đơn hàng với bộ lọc
- 🔑 **Quyền truy cập**: admin, employee
- 📥 **Input**:
  - Query: `date` (ISO8601), `status` (pending|preparing|ready|delivered|paid|cancelled), `user_id` (UUID), `table_id` (UUID)
- 📤 **Output (200)**: Paginated orders list
- 🚫 **Error cases**: 401, 403, 400 (Invalid query params)

### GET /api/orders/:id

- ✅ **Mô tả chức năng**: Lấy đơn hàng theo ID
- 🔑 **Quyền truy cập**: Tất cả user đã xác thực
- 📥 **Input**: Path param `id` (UUID)
- 📤 **Output (200)**: Order object with items
- 🚫 **Error cases**: 401, 404 (Not found)

### GET /api/orders/table/:tableId

- ✅ **Mô tả chức năng**: Lấy đơn hàng theo bàn
- 🔑 **Quyền truy cập**: Tất cả user đã xác thực
- 📥 **Input**: Path param `tableId`, Query `status` (optional)
- 📤 **Output (200)**: Order object
- 🚫 **Error cases**: 401, 404 (Table not found)

### POST /api/orders

- ✅ **Mô tả chức năng**: Tạo đơn hàng mới
- 🔑 **Quyền truy cập**: Tất cả user đã xác thực
- 📥 **Input**:

```json
{
  "table_id": "uuid" // required
}
```

- 📤 **Output (201)**: Created order object
- 🚫 **Error cases**: 401, 400 (Invalid table_id)

### PUT /api/orders/:id

- ✅ **Mô tả chức năng**: Cập nhật đơn hàng
- 🔑 **Quyền truy cập**: Tất cả user đã xác thực
- 📥 **Input**:

```json
{
  "table_id": "uuid" // optional
}
```

- 📤 **Output (200)**: Updated order object

### PATCH /api/orders/:id/status

- ✅ **Mô tả chức năng**: Cập nhật trạng thái đơn hàng
- 🔑 **Quyền truy cập**: admin, employee
- 📥 **Input**:

```json
{
  "status": "pending|preparing|ready|delivered|paid|cancelled"
}
```

- 📤 **Output (200)**: Updated order object
- 🚫 **Error cases**: 401, 403, 400 (Invalid status)

### POST /api/orders/:id/items

- ✅ **Mô tả chức năng**: Thêm món vào đơn hàng
- 🔑 **Quyền truy cập**: Tất cả user đã xác thực
- 📥 **Input**:

```json
{
  "dish_id": "uuid", // required
  "quantity": 2 // required, min 1
}
```

- 📤 **Output (200)**: Updated order object
- 🚫 **Error cases**: 401, 400 (Invalid dish_id or quantity)

### PATCH /api/orders/items/:itemId/quantity

- ✅ **Mô tả chức năng**: Cập nhật số lượng món
- 🔑 **Quyền truy cập**: Tất cả user đã xác thực
- 📥 **Input**:

```json
{
  "quantity": 3 // min 0
}
```

- 📤 **Output (200)**: Updated item object

### PATCH /api/orders/items/:itemId/status

- ✅ **Mô tả chức năng**: Cập nhật trạng thái món
- 🔑 **Quyền truy cập**: admin, employee
- 📥 **Input**:

```json
{
  "status": "pending|completed"
}
```

- 📤 **Output (200)**: Updated item object

### DELETE /api/orders/items/:itemId

- ✅ **Mô tả chức năng**: Xóa món khỏi đơn hàng
- 🔑 **Quyền truy cập**: Tất cả user đã xác thực
- 📥 **Input**: Path param `itemId`
- 📤 **Output (200)**: Updated order object

### POST /api/orders/:id/voucher

- ✅ **Mô tả chức năng**: Áp dụng voucher
- 🔑 **Quyền truy cập**: Tất cả user đã xác thực
- 📥 **Input**:

```json
{
  "code": "VOUCHER_CODE" // required
}
```

- 📤 **Output (200)**: Updated order object
- 🚫 **Error cases**: 401, 400 (Invalid voucher code)

### DELETE /api/orders/:id/voucher

- ✅ **Mô tả chức năng**: Xóa voucher khỏi đơn hàng
- 🔑 **Quyền truy cập**: Tất cả user đã xác thực
- 📥 **Input**: Path param `id`
- 📤 **Output (200)**: Updated order object

### POST /api/orders/merge

- ✅ **Mô tả chức năng**: Gộp đơn hàng
- 🔑 **Quyền truy cập**: admin, employee
- 📥 **Input**:

```json
{
  "source_order_id": "uuid", // required
  "target_order_id": "uuid" // required
}
```

- 📤 **Output (200)**: Merged order object
- 🚫 **Error cases**: 401, 403, 400 (Invalid order IDs)

### POST /api/orders/:id/support

- ✅ **Mô tả chức năng**: Yêu cầu hỗ trợ
- 🔑 **Quyền truy cập**: Tất cả user đã xác thực
- 📥 **Input**: Path param `id`
- 📤 **Output (200)**: Support request result

### POST /api/orders/:id/payment/request

- ✅ **Mô tả chức năng**: Yêu cầu thanh toán
- 🔑 **Quyền truy cập**: Tất cả user đã xác thực
- 📥 **Input**: Path param `id`
- 📤 **Output (200)**: Payment request result

### GET /api/orders/stats/revenue

- ✅ **Mô tả chức năng**: Lấy thống kê doanh thu
- 🔑 **Quyền truy cập**: admin, employee
- 📥 **Input**: Query `start_date` (ISO8601, required), `end_date` (ISO8601, required)
- 📤 **Output (200)**: Revenue statistics
- 🚫 **Error cases**: 401, 403, 400 (Missing dates)

---

## 📅 Reservation Module

### GET /api/reservations

- ✅ **Mô tả chức năng**: Lấy danh sách đặt bàn với bộ lọc
- 🔑 **Quyền truy cập**: admin, employee
- 📥 **Input**:
  - Query: `date` (ISO8601), `status` (pending|confirmed|cancelled|no_show), `table_id` (UUID), `user_id` (UUID), `event_id` (UUID)
- 📤 **Output (200)**: Paginated reservations list
- 🚫 **Error cases**: 401, 403, 400 (Invalid query params)

### GET /api/reservations/:id

- ✅ **Mô tả chức năng**: Lấy đặt bàn theo ID
- 🔑 **Quyền truy cập**: Tất cả user đã xác thực
- 📥 **Input**: Path param `id` (UUID)
- 📤 **Output (200)**: Reservation object
- 🚫 **Error cases**: 401, 404 (Not found)

### POST /api/reservations

- ✅ **Mô tả chức năng**: Tạo đặt bàn mới
- 🔑 **Quyền truy cập**: Tất cả user đã xác thực
- 📥 **Input**:

```json
{
  "table_id": "uuid", // required
  "reservation_time": "2024-01-01T19:00:00Z", // required, ISO8601
  "duration_minutes": 120, // optional, 30-480, default 90
  "num_people": 4, // required, 1-50
  "preferences": {}, // optional
  "event_id": "uuid", // optional
  "pre_order_items": [
    // optional
    {
      "dish_id": "uuid",
      "quantity": 2
    }
  ]
}
```

- 📤 **Output (201)**: Created reservation object
- 🚫 **Error cases**: 401, 400 (Invalid input)

### PUT /api/reservations/:id

- ✅ **Mô tả chức năng**: Cập nhật đặt bàn
- 🔑 **Quyền truy cập**: Tất cả user đã xác thực
- 📥 **Input**: Same as POST (all fields optional)
- 📤 **Output (200)**: Updated reservation object

### PATCH /api/reservations/:id/status

- ✅ **Mô tả chức năng**: Cập nhật trạng thái đặt bàn
- 🔑 **Quyền truy cập**: admin, employee
- 📥 **Input**:

```json
{
  "status": "pending|confirmed|cancelled|no_show"
}
```

- 📤 **Output (200)**: Updated reservation object

### POST /api/reservations/:id/checkin

- ✅ **Mô tả chức năng**: Check-in đặt bàn
- 🔑 **Quyền truy cập**: Tất cả user đã xác thực
- 📥 **Input**: Path param `id`
- 📤 **Output (200)**: Check-in result with order

### DELETE /api/reservations/:id

- ✅ **Mô tả chức năng**: Xóa đặt bàn
- 🔑 **Quyền truy cập**: Tất cả user đã xác thực
- 📥 **Input**: Path param `id`
- 📤 **Output (200)**:

```json
{
  "status": "success",
  "message": "Reservation deleted successfully"
}
```

---

## 💳 Payment Module

### GET /api/payments

- ✅ **Mô tả chức năng**: Lấy danh sách thanh toán
- 🔑 **Quyền truy cập**: admin
- 📥 **Input**:
  - Query: `page` (1+), `limit` (1-100), `method` (cash|vnpay), `status` (pending|completed|failed), `user_id` (UUID), `start_date` (ISO8601), `end_date` (ISO8601)
- 📤 **Output (200)**: Paginated payments list
- 🚫 **Error cases**: 401, 403, 400 (Invalid query params)

### GET /api/payments/:id

- ✅ **Mô tả chức năng**: Lấy thanh toán theo ID
- 🔑 **Quyền truy cập**: admin
- 📥 **Input**: Path param `id` (UUID)
- 📤 **Output (200)**: Payment object
- 🚫 **Error cases**: 401, 403, 404 (Not found)

### GET /api/payments/vnpay/return

- ✅ **Mô tả chức năng**: VNPay callback URL
- 🔑 **Quyền truy cập**: Public
- 📥 **Input**: VNPay query parameters
- 📤 **Output**: Redirect to client URL
- 🚫 **Error cases**: Redirect to failure page

### POST /api/payments/vnpay/ipn

- ✅ **Mô tả chức năng**: VNPay IPN (Instant Payment Notification)
- 🔑 **Quyền truy cập**: VNPay servers only
- 📥 **Input**: VNPay IPN parameters
- 📤 **Output (200)**:

```json
{
  "RspCode": "00|01|97",
  "Message": "Success|Not recognized|Checksum failed"
}
```

### GET /api/payments/stats/revenue

- ✅ **Mô tả chức năng**: Thống kê doanh thu
- 🔑 **Quyền truy cập**: admin
- 📥 **Input**: Query `start_date` (ISO8601, optional), `end_date` (ISO8601, optional)
- 📤 **Output (200)**: Revenue statistics

### GET /api/payments/stats/orders

- ✅ **Mô tả chức năng**: Thống kê đơn hàng
- 🔑 **Quyền truy cập**: admin
- 📥 **Input**: Query `start_date`, `end_date` (optional)
- 📤 **Output (200)**: Order statistics

### GET /api/payments/stats/reservations

- ✅ **Mô tả chức năng**: Thống kê đặt bàn
- 🔑 **Quyền truy cập**: admin
- 📥 **Input**: Query `start_date`, `end_date` (optional)
- 📤 **Output (200)**: Reservation statistics

### GET /api/payments/stats/payments

- ✅ **Mô tả chức năng**: Thống kê thanh toán
- 🔑 **Quyền truy cập**: admin
- 📥 **Input**: Query `start_date`, `end_date` (optional)
- 📤 **Output (200)**: Payment statistics

### GET /api/payments/stats/tables

- ✅ **Mô tả chức năng**: Thống kê doanh thu theo bàn
- 🔑 **Quyền truy cập**: admin
- 📥 **Input**: Query `start_date`, `end_date` (optional)
- 📤 **Output (200)**: Table revenue statistics

### GET /api/payments/stats/customers

- ✅ **Mô tả chức năng**: Thống kê chi tiêu khách hàng
- 🔑 **Quyền truy cập**: admin
- 📥 **Input**: Query `start_date`, `end_date` (optional)
- 📤 **Output (200)**: Customer spending statistics

### GET /api/payments/stats/daily

- ✅ **Mô tả chức năng**: Thống kê doanh thu theo ngày
- 🔑 **Quyền truy cập**: admin
- 📥 **Input**: Query `start_date` (required), `end_date` (required)
- 📤 **Output (200)**: Daily revenue statistics
- 🚫 **Error cases**: 400 (Missing dates)

### GET /api/payments/stats/monthly

- ✅ **Mô tả chức năng**: Thống kê doanh thu theo tháng
- 🔑 **Quyền truy cập**: admin
- 📥 **Input**: Query `start_date` (required), `end_date` (required)
- 📤 **Output (200)**: Monthly revenue statistics

### GET /api/payments/stats/dishes

- ✅ **Mô tả chức năng**: Thống kê món ăn
- 🔑 **Quyền truy cập**: admin
- 📥 **Input**: Query `start_date`, `end_date` (optional)
- 📤 **Output (200)**: Dish statistics

### GET /api/payments/stats/dashboard

- ✅ **Mô tả chức năng**: Tổng quan dashboard
- 🔑 **Quyền truy cập**: admin
- 📥 **Input**: Query `start_date`, `end_date` (optional)
- 📤 **Output (200)**:

```json
{
  "status": "success",
  "data": {
    "revenue": {},
    "orders": {},
    "reservations": {},
    "payments": {},
    "top_tables": [],
    "top_customers": [],
    "top_dishes": []
  }
}
```

---

## 🔌 WebSocket Events

### Notification Namespace (`/notifications`)

#### Client Events

- **joinStaffRoom**: Tham gia room nhân viên
- **joinUserRoom**: Tham gia room user cụ thể
  - Payload: `{ userId: string }`
- **leaveUserRoom**: Rời room user
  - Payload: `{ userId: string }`

#### Server Events

- **newNotification**: Thông báo mới
  - Payload: Notification object
  - Broadcast rules:
    - `notifyStaff`: Gửi đến tất cả staff
    - `notifyUser`: Gửi đến user cụ thể
    - `broadcastNotification`: Gửi đến tất cả client

### Order Namespace (`/order`)

#### Client Events

- **joinOrder**: Tham gia room đơn hàng
  - Payload: `{ orderId: string }`
- **joinTable**: Tham gia room bàn
  - Payload: `{ tableId: string }`
- **leaveOrder**: Rời room đơn hàng
- **leaveTable**: Rời room bàn

#### Server Events

- **orderCreated**: Đơn hàng được tạo
- **orderUpdated**: Đơn hàng được cập nhật
- **orderStatusChanged**: Trạng thái đơn hàng thay đổi
- **paymentRequested**: Yêu cầu thanh toán
- **paymentCompleted**: Thanh toán thành công
- **paymentFailed**: Thanh toán thất bại
- **supportRequested**: Yêu cầu hỗ trợ
- **voucherApplied**: Áp dụng voucher
- **voucherRemoved**: Xóa voucher
- **orderMerged**: Gộp đơn hàng

### Reservation Namespace (`/reservations`)

#### Client Events

- **joinReservation**: Tham gia room đặt bàn
  - Payload: `{ reservationId: string }`
- **joinTable**: Tham gia room bàn
- **joinTableGroup**: Tham gia room nhóm bàn
- **leaveReservation**: Rời room đặt bàn
- **leaveTable**: Rời room bàn
- **leaveTableGroup**: Rời room nhóm bàn

#### Server Events

- **reservationCreated**: Đặt bàn được tạo
- **reservationUpdated**: Đặt bàn được cập nhật
- **reservationStatusChanged**: Trạng thái đặt bàn thay đổi
- **reservationCheckedIn**: Check-in đặt bàn
  - Payload: `{ reservation: object, order: object }`
- **depositPaymentRequested**: Yêu cầu thanh toán cọc
  - Payload: `{ reservation: object, payment_url: string }`
- **depositPaymentCompleted**: Thanh toán cọc thành công
- **depositPaymentFailed**: Thanh toán cọc thất bại

---

## 📊 Data Models

### Notification

```typescript
{
  id: string (UUID)
  user_id?: string (UUID)
  type: "low_stock" | "reservation_confirm" | "promotion" | "order_created" | "order_updated" | "order_status_changed" | "reservation_created" | "reservation_updated" | "chat_message" | "support_request" | "payment_completed" | "other"
  content: string
  title?: string
  data?: any
  is_read: boolean
  sent_at?: Date
  status: "sent" | "failed"
}
```

### Order

```typescript
{
  id: string (UUID)
  user_id?: string (UUID)
  reservation_id?: string (UUID)
  table_id?: string (UUID)
  table_group_id?: string (UUID)
  event_id?: string (UUID)
  voucher_id?: string (UUID)
  status: "pending" | "dining" | "waiting_payment" | "preparing" | "ready" | "delivered" | "paid" | "cancelled"
  total_amount: number
  voucher_discount_amount?: number
  final_amount: number
  event_fee?: number
  deposit_amount?: number
  customizations?: any
  notes?: string
  payment_status: "pending" | "paid" | "failed"
  payment_method?: "zalopay" | "momo" | "cash" | "vnpay"
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}
```

### Reservation

```typescript
{
  id: string (UUID)
  user_id?: string (UUID)
  table_id?: string (UUID)
  table_group_id?: string (UUID)
  reservation_time: Date
  duration_minutes: number
  num_people: number
  preferences?: any
  event_id?: string (UUID)
  event_fee?: number
  status: "pending" | "confirmed" | "cancelled" | "no_show"
  timeout_minutes: number
  deposit_amount?: number
  pre_order_items?: any
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}
```

### Payment

```typescript
{
  id: string (UUID)
  order_id?: string (UUID)
  reservation_id?: string (UUID)
  amount: number
  method: "cash" | "vnpay"
  status: "pending" | "completed" | "failed"
  transaction_id?: string
  created_at?: Date
  updated_at?: Date
}
```

---

## 🚨 Error Responses

### Standard Error Format

```json
{
  "status": "error",
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {} // optional
}
```

### Common Error Codes

- **400**: Bad Request - Invalid input data
- **401**: Unauthorized - Missing or invalid token
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource not found
- **422**: Validation Error - Invalid request format
- **500**: Internal Server Error - Server error

---

## 🔧 Environment Variables

```env
PORT=3000
NODE_ENV=development|production
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your_jwt_secret
DB_HOST=localhost
DB_PORT=3306
DB_NAME=restaurant_db
DB_USER=root
DB_PASSWORD=password
CLIENT_URL=http://localhost:3000
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
```

---

## 📝 Notes

1. **Pagination**: Tất cả API list đều hỗ trợ pagination với `page` và `limit`
2. **Timestamps**: Tất cả timestamps đều ở format ISO8601
3. **UUID**: Tất cả ID đều sử dụng UUID v4
4. **Validation**: Sử dụng express-validator cho input validation
5. **Error Handling**: Centralized error handling với custom error classes
6. **Logging**: Winston logger cho tất cả requests và errors
7. **Database**: Sequelize ORM với MySQL
8. **Real-time**: Socket.IO cho real-time notifications và updates
