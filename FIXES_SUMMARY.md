# Summary of Fixes

## Vấn đề 1: OrderItem Status Enum Mismatch ✅

### Lỗi gốc:

```
Error at Query.run (mysql/query.js:46:25)
at OrderRepository.updateItemStatus (orderRepository.ts:298:5)
at OrderService.updateItemStatus (orderService.ts:361:18)
at updateItemStatus (orderController.ts:146:18)
```

### Nguyên nhân:

- **Backend Model** (`OrderItem.ts`) chỉ định nghĩa status: `"pending" | "completed"`
- **Backend Repository** đang cố update sang: `"preparing" | "ready"`
- Database ENUM constraint chỉ cho phép `'pending', 'completed'`

### Giải pháp:

#### 1. ✅ Cập nhật Model (`be_restaurant/src/models/OrderItem.ts`)

**Thêm vào interface:**

```typescript
interface OrderItemAttributes {
  // ... existing fields
  status: "pending" | "completed" | "preparing" | "ready" | "cancelled";
  special_instructions?: string; // NEW
  // ... rest
}
```

**Cập nhật class:**

```typescript
class OrderItem extends Model<...> {
  // ... existing fields
  public status!: "pending" | "completed" | "preparing" | "ready" | "cancelled"
  public special_instructions?: string  // NEW
  // ... rest
}
```

**Cập nhật schema:**

```typescript
OrderItem.init({
  // ...
  status: {
    type: DataTypes.ENUM(
      "pending",
      "completed",
      "preparing",
      "ready",
      "cancelled"
    ),
    defaultValue: "pending",
  },
  special_instructions: {
    // NEW
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // ...
});
```

#### 2. ✅ Migration Database

Chạy file: `be_restaurant/MIGRATION_OrderItem_Status.sql`

```sql
ALTER TABLE `order_items`
MODIFY COLUMN `status` ENUM('pending', 'completed', 'preparing', 'ready', 'cancelled')
NOT NULL DEFAULT 'pending';

ALTER TABLE `order_items`
ADD COLUMN IF NOT EXISTS `special_instructions` TEXT NULL AFTER `status`;
```

---

## Vấn đề 2: API Response Interfaces Mismatch ✅

### Vấn đề:

Các interface trong `admin-web/src/lib/api.ts` không khớp với backend model fields.

### Giải pháp:

#### 1. ✅ Fix Order Interface

**Trước:**

```typescript
export interface Order {
  id: string;
  order_number: string;  // ❌ Không có trong backend
  status: "pending" | "confirmed" | ...  // ❌ Sai enum values
  table_name?: string;  // ❌ Không có trong backend
  customer_name?: string;  // ❌ Không có trong backend
  // ... missing many fields
}
```

**Sau:**

```typescript
export interface Order {
  id: string;
  user_id?: string;
  reservation_id?: string;
  table_id?: string;
  table_group_id?: string;
  event_id?: string;
  voucher_id?: string;
  status: "pending" | "dining" | "waiting_payment" | "preparing" | "ready" | "delivered" | "paid" | "cancelled";
  total_amount: number;
  voucher_discount_amount?: number;
  final_amount: number;
  event_fee?: number;
  deposit_amount?: number;
  customizations?: any;
  notes?: string;
  payment_status: "pending" | "paid" | "failed";
  payment_method?: "zalopay" | "momo" | "cash" | "vnpay";
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;

  // Relations (if included via JOIN)
  user?: { ... };
  table?: { ... };
  items?: OrderItem[];
  voucher?: Voucher;
}
```

#### 2. ✅ Fix OrderItem Interface

**Trước:**

```typescript
export interface OrderItem {
  id: string;
  dish_id: string;
  dish_name: string; // ❌ Không có trong backend
  quantity: number;
  price: number;
  status: "pending" | "preparing" | "ready" | "served" | "cancelled"; // ❌ Có "served" không có "completed"
  special_instructions?: string;
}
```

**Sau:**

```typescript
export interface OrderItem {
  id: string;
  order_id?: string;
  dish_id?: string;
  quantity: number;
  price: number;
  customizations?: any;
  status: "pending" | "completed" | "preparing" | "ready" | "cancelled"; // ✅ Khớp với backend
  special_instructions?: string;
  estimated_wait_time?: number;
  completed_at?: string;
  created_at: string;

  // Relation (if included)
  dish?: {
    id: string;
    name: string;
    price: number;
    media_urls?: string[];
  };
}
```

#### 3. ✅ Fix Reservation Interface

**Các thay đổi chính:**

- ✅ Đổi `status` từ `"checked_in" | "completed"` thành `"cancelled" | "no_show"` (khớp backend model)
- ✅ Đổi kiểu dữ liệu từ `string` sang `number` cho `event_fee`, `deposit_amount`
- ✅ Loại bỏ các field hardcoded payment details
- ✅ Thêm optional cho tất cả relations

#### 4. ✅ Fix Notification Interface

**Trước:**

```typescript
export interface Notification {
  id: string;
  user_id: string | null;  // ❌ Nên dùng optional
  type: ...;
  title: string;  // ❌ Nên optional
  content: string;
  is_read: boolean;
  data?: { ... };
  sent_at: string;
  status: string;  // ❌ Nên có enum cụ thể
  user?: any | null;
}
```

**Sau:**

```typescript
export interface Notification {
  id: string;
  user_id?: string;  // ✅ Optional
  type: ...;
  content: string;
  title?: string;  // ✅ Optional
  data?: any;
  is_read: boolean;
  sent_at: string;
  status: "sent" | "failed";  // ✅ Enum cụ thể

  user?: {
    id: string;
    username: string;
    email: string;
  };
}
```

#### 5. ✅ Thêm ChatSession và ChatMessage Interfaces

**Mới thêm:**

```typescript
export interface ChatSession {
  id: string;
  user_id?: string;
  is_authenticated: boolean;
  channel: "web" | "app" | "zalo";
  context?: any;
  start_time?: string;
  end_time?: string;
  status: "active" | "closed";
  handled_by: "bot" | "human";
  bot_enabled?: boolean;

  user?: {
    id: string;
    username: string;
    email: string;
    phone?: string;
    full_name?: string;
  };
}

export interface ChatMessage {
  id: string;
  session_id?: string;
  sender_type: "user" | "bot" | "human";
  sender_id?: string | null;
  message_text: string;
  timestamp?: string;
}
```

---

## Mapping Backend Models → Frontend Interfaces

### Order Model

| Backend Field    | Type    | Frontend Field   | Type    | Notes          |
| ---------------- | ------- | ---------------- | ------- | -------------- |
| `id`             | UUID    | `id`             | string  | ✅             |
| `user_id`        | UUID?   | `user_id`        | string? | ✅             |
| `table_id`       | UUID?   | `table_id`       | string? | ✅             |
| `status`         | ENUM    | `status`         | string  | ✅ Now matches |
| `total_amount`   | DECIMAL | `total_amount`   | number  | ✅             |
| `final_amount`   | DECIMAL | `final_amount`   | number  | ✅             |
| `payment_status` | ENUM    | `payment_status` | string  | ✅             |
| `created_at`     | DATE    | `created_at`     | string  | ✅ ISO string  |

### Reservation Model

| Backend Field      | Type    | Frontend Field     | Type    | Notes          |
| ------------------ | ------- | ------------------ | ------- | -------------- |
| `id`               | UUID    | `id`               | string  | ✅             |
| `reservation_time` | DATE    | `reservation_time` | string  | ✅ ISO string  |
| `status`           | ENUM(4) | `status`           | ENUM(4) | ✅ Now matches |
| `event_fee`        | DECIMAL | `event_fee`        | number  | ✅ Fixed       |
| `deposit_amount`   | DECIMAL | `deposit_amount`   | number  | ✅ Fixed       |

### Notification Model

| Backend Field | Type     | Frontend Field | Type             | Notes           |
| ------------- | -------- | -------------- | ---------------- | --------------- |
| `id`          | UUID     | `id`           | string           | ✅              |
| `user_id`     | UUID?    | `user_id`      | string?          | ✅ Now optional |
| `type`        | ENUM(11) | `type`         | ENUM(11)         | ✅              |
| `content`     | TEXT     | `content`      | string           | ✅              |
| `title`       | STRING?  | `title`        | string?          | ✅ Now optional |
| `status`      | ENUM     | `status`       | "sent"\|"failed" | ✅ Fixed        |
| `sent_at`     | DATE     | `sent_at`      | string           | ✅              |

### ChatSession Model

| Backend Field | Type    | Frontend Field | Type               | Notes |
| ------------- | ------- | -------------- | ------------------ | ----- |
| `id`          | UUID    | `id`           | string             | ✅    |
| `channel`     | ENUM(3) | `channel`      | ENUM(3)            | ✅    |
| `status`      | ENUM(2) | `status`       | "active"\|"closed" | ✅    |
| `handled_by`  | ENUM(2) | `handled_by`   | "bot"\|"human"     | ✅    |

### ChatMessage Model

| Backend Field  | Type    | Frontend Field | Type    | Notes |
| -------------- | ------- | -------------- | ------- | ----- |
| `id`           | UUID    | `id`           | string  | ✅    |
| `session_id`   | UUID?   | `session_id`   | string? | ✅    |
| `sender_type`  | ENUM(3) | `sender_type`  | ENUM(3) | ✅    |
| `message_text` | TEXT    | `message_text` | string  | ✅    |
| `timestamp`    | DATE    | `timestamp`    | string  | ✅    |

---

## Action Items

### For Backend:

1. ✅ Run migration: `MIGRATION_OrderItem_Status.sql`
2. ✅ Restart backend server
3. ⚠️ Test `PATCH /orders/items/:id/status` endpoint with status: `"preparing"`, `"ready"`, `"cancelled"`

### For Frontend:

1. ✅ Updated all type definitions in `admin-web/src/lib/api.ts`
2. ⚠️ Check if any UI components are using old field names:
   - `order.order_number` → should use `order.id`
   - `order.customer_name` → should use `order.user?.username`
   - `order.table_name` → should use `order.table?.table_number`
   - `item.dish_name` → should use `item.dish?.name`

### Testing Checklist:

- [ ] Create order with items
- [ ] Update item status to "preparing" ✅
- [ ] Update item status to "ready" ✅
- [ ] Update item status to "completed" ✅
- [ ] Update item status to "cancelled" ✅
- [ ] Add special_instructions to order item
- [ ] Verify WebSocket events for order updates
- [ ] Verify UI displays correct order/reservation/notification data

---

## Files Changed

### Backend:

1. ✅ `be_restaurant/src/models/OrderItem.ts`
2. ✅ `be_restaurant/MIGRATION_OrderItem_Status.sql` (NEW)

### Frontend:

1. ✅ `admin-web/src/lib/api.ts`

### Documentation:

1. ✅ `FIXES_SUMMARY.md` (this file)

---

## Next Steps

1. **Chạy migration database:**

   ```bash
   mysql -u root -p your_database < be_restaurant/MIGRATION_OrderItem_Status.sql
   ```

2. **Restart backend:**

   ```bash
   cd be_restaurant
   npm run dev
   ```

3. **Test các API endpoints:**

   - `PATCH /api/orders/items/:id/status` với các status mới
   - `POST /api/orders/:id/items` với `special_instructions`

4. **Kiểm tra UI components:**

   - Tìm kiếm các field không còn tồn tại: `order_number`, `customer_name`, `table_name`, `dish_name`
   - Cập nhật code để sử dụng relations: `order.user.username`, `order.table.table_number`, `item.dish.name`

5. **Verify WebSocket:**
   - Test real-time order updates với status mới
   - Verify notification events
