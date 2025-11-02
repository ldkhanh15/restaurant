# Frontend Migration Guide - API Field Changes

## ⚠️ Breaking Changes

Backend models **KHÔNG** có các field sau. Frontend đang sử dụng sai:

### 1. Order Model - KHÔNG CÓ:

- ❌ `order_number`
- ❌ `customer_name`
- ❌ `table_name`

### 2. OrderItem Model - KHÔNG CÓ:

- ❌ `dish_name`

### 3. Payment Model - CÓ THỂ KHÔNG CÓ:

- ⚠️ `order_number` (cần kiểm tra)
- ⚠️ `customer_name` (cần kiểm tra)
- ⚠️ `table_name` (cần kiểm tra)

---

## ✅ Cách Sửa

### Pattern: Thay thế direct fields bằng nested relations

#### ❌ SAI:

```typescript
// KHÔNG TỒN TẠI trong backend model
order.order_number;
order.customer_name;
order.table_name;
item.dish_name;
```

#### ✅ ĐÚNG:

```typescript
// Sử dụng nested relations hoặc fallback
order.id.slice(0, 8); // Thay cho order_number
order.user?.username || order.user?.full_name || "Khách vãng lai";
order.table?.table_number || "N/A";
item.dish?.name || "Unknown";
```

---

## 📝 Files Cần Sửa

### Priority 1: Core Components

#### 1. `admin-web/src/components/modules/order-management-enhanced.tsx`

**Dòng 151-226:** WebSocket event descriptions

```typescript
// ❌ BEFORE
description: `Đơn hàng #${newOrder.order_number} đã được tạo`;

// ✅ AFTER
description: `Đơn hàng #${newOrder.id.slice(0, 8)} đã được tạo`;
```

**Dòng 256-260:** Search filter

```typescript
// ❌ BEFORE
order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
  order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  order.table_name?.toLowerCase().includes(searchTerm.toLowerCase());

// ✅ AFTER
order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
  order.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  order.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  order.table?.table_number?.toLowerCase().includes(searchTerm.toLowerCase());
```

**Dòng 813:** Delete confirmation

```typescript
// ❌ BEFORE
Bạn có chắc chắn muốn xóa đơn hàng #{orderToDelete?.order_number}?

// ✅ AFTER
Bạn có chắc chắn muốn xóa đơn hàng #{orderToDelete?.id.slice(0, 8)}?
```

#### 2. `admin-web/src/app/(modules)/orders/[id]/page.tsx`

**Dòng 457:** Display dish name

```typescript
// ❌ BEFORE
{
  item.dish_name;
}

// ✅ AFTER
{
  item.dish?.name || "Unknown Dish";
}
```

#### 3. `admin-web/src/components/modules/order-detail-page.tsx`

**Multiple lines (602, 995, 1057, 1105):**

```typescript
// ❌ BEFORE
Đơn hàng #{order.order_number || order.id.slice(0, 8)}

// ✅ AFTER
Đơn hàng #{order.id.slice(0, 8)}
```

**Interface definition (line ~115):**

```typescript
// ❌ REMOVE THIS
order_number?: string;

// Interface should match backend Order model
```

---

### Priority 2: Chat Components (customer_name is OK - it's computed)

> ✅ **GOOD NEWS:** `customer_name` trong chat là computed field từ backend!
> Backend query có JOIN User và trả về username/full_name như `customer_name`.

Files này **CÓ THỂ** không cần sửa (cần verify backend response):

- `admin-web/src/components/modules/chat-system.tsx`
- `admin-web/src/components/modules/chat-session-details.tsx`
- `admin-web/src/services/chatService.ts`

**TODO:** Verify backend chatRepository có return computed `customer_name` field hay không.

Nếu backend KHÔNG trả về computed field, sửa như sau:

```typescript
// ❌ BEFORE
session.customer_name;

// ✅ AFTER
session.user?.username || session.user?.full_name || "Anonymous";
```

---

### Priority 3: Payment Components

#### File: `admin-web/src/app/(modules)/payments/[id]/page.tsx`

**Cần verify backend Payment model có include relations không.**

**Dòng 287:**

```typescript
// ❌ BEFORE (nếu backend không có)
#{payment.order_number}

// ✅ AFTER
#{payment.order?.id.slice(0, 8) || 'N/A'}
```

**Dòng 413:**

```typescript
// ❌ BEFORE (nếu backend không có)
{
  payment.customer_name || "Khách vãng lai";
}

// ✅ AFTER
{
  payment.order?.user?.username ||
    payment.reservation?.user?.username ||
    "Khách vãng lai";
}
```

**Dòng 419:**

```typescript
// ❌ BEFORE (nếu backend không có)
{
  payment.table_name || "N/A";
}

// ✅ AFTER
{
  payment.order?.table?.table_number ||
    payment.reservation?.table?.table_number ||
    "N/A";
}
```

---

## 🔍 How to Verify Backend Response

### Step 1: Check if backend returns computed fields

```bash
# In be_restaurant
grep -r "customer_name.*:" src/repositories/
grep -r "order_number.*:" src/repositories/
grep -r "table_name.*:" src/repositories/
grep -r "dish_name.*:" src/repositories/
```

### Step 2: Test API responses

```bash
# Test order endpoint
curl http://localhost:8000/api/orders/:id | jq

# Check if response includes:
# - order.user.username
# - order.table.table_number
# - order.items[].dish.name
```

### Step 3: Update TypeScript interfaces

If backend DOES return computed fields (like `customer_name` in chat), add them to interfaces:

```typescript
export interface ChatSession {
  // ... existing fields

  // Computed fields from backend (verify first!)
  customer_name?: string; // ONLY if backend returns it
}
```

---

## 🎯 Action Plan

### Phase 1: Fix Critical Bugs (ORDER model) ✅ MUST DO

1. ✅ Fix `order-management-enhanced.tsx` (search, WebSocket events, delete)
2. ✅ Fix `orders/[id]/page.tsx` (dish display)
3. ✅ Fix `order-detail-page.tsx` (header, modals)
4. ✅ Remove `order_number` from Order interface

### Phase 2: Verify & Fix Chat (VERIFY FIRST)

1. ⚠️ Check backend `chatRepository.ts` - does it return `customer_name`?
2. ⚠️ If NO → Update `chat-system.tsx` to use `session.user?.username`
3. ⚠️ If YES → Add `customer_name` to `ChatSession` interface

### Phase 3: Fix Payment Components (VERIFY FIRST)

1. ⚠️ Check backend Payment response - does it include `order.user`, `order.table`?
2. ⚠️ Update `payments/[id]/page.tsx` accordingly
3. ⚠️ Update Payment interface if needed

---

## 📊 Summary

| Field           | Model       | Status           | Solution                        |
| --------------- | ----------- | ---------------- | ------------------------------- |
| `order_number`  | Order       | ❌ KHÔNG TỒN TẠI | Use `order.id.slice(0, 8)`      |
| `customer_name` | Order       | ❌ KHÔNG TỒN TẠI | Use `order.user?.username`      |
| `table_name`    | Order       | ❌ KHÔNG TỒN TẠI | Use `order.table?.table_number` |
| `dish_name`     | OrderItem   | ❌ KHÔNG TỒN TẠI | Use `item.dish?.name`           |
| `customer_name` | ChatSession | ⚠️ CẦN VERIFY    | Check backend response          |
| `order_number`  | Payment     | ⚠️ CẦN VERIFY    | Check backend response          |

---

## 🧪 Testing After Migration

```typescript
// Test cases
1. Display order list → check customer name displays correctly
2. Search orders by customer → verify search works with new field
3. WebSocket order events → check toast notifications display correct IDs
4. Order detail page → verify dish names show up
5. Payment detail page → verify all related info displays
6. Chat sessions → verify customer names show up
```

---

## 🚨 IMPORTANT

Backend model ONLY has these fields. Frontend MUST adapt:

### Order Model Fields:

```typescript
{
  id, user_id, reservation_id, table_id, table_group_id,
  event_id, voucher_id, status, total_amount,
  voucher_discount_amount, final_amount, event_fee,
  deposit_amount, customizations, notes,
  payment_status, payment_method,
  created_at, updated_at, deleted_at,

  // Relations (if included):
  user: { id, username, email, phone, full_name },
  table: { id, table_number, capacity, status },
  items: [ { ...OrderItem } ],
  voucher: { ...Voucher }
}
```

KHÔNG CÓ: `order_number`, `customer_name`, `table_name`

### OrderItem Model Fields:

```typescript
{
  id, order_id, dish_id, quantity, price,
  customizations, status, special_instructions,
  estimated_wait_time, completed_at, created_at,

  // Relation (if included):
  dish: { id, name, price, media_urls }
}
```

KHÔNG CÓ: `dish_name`
