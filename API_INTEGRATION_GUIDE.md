# 🔗 API Integration Complete Guide

## ✅ Completed Tasks

### 1. Order Detail Page - Remove Voucher ✅

**Function added:**

```typescript
const removeVoucher = async () => {
  try {
    await api.orders.removeVoucher(orderId);
    await loadOrder();
    toast({ title: "Thành công", description: "Đã xóa voucher khỏi đơn hàng" });
  } catch (error) {
    toast({
      title: "Lỗi",
      description: "Không thể xóa voucher",
      variant: "destructive",
    });
  }
};
```

**UI Button to add** (in CardContent after Apply Voucher):

```tsx
{
  order.voucher_id && (
    <Button
      variant="outline"
      onClick={removeVoucher}
      className="w-full border-red-300 hover:bg-red-50 hover:text-red-900"
    >
      <X className="h-4 w-4 mr-2" />
      Xóa Voucher
    </Button>
  );
}
```

### 2. Order Detail Page - Request Support ✅

**Function added:**

```typescript
const requestSupport = async () => {
  try {
    await api.orders.requestSupport(orderId);
    toast({ title: "Thành công", description: "Yêu cầu hỗ trợ đã được gửi" });
  } catch (error) {
    toast({ title: "Lỗi", description: "Không thể gửi yêu cầu hỗ trợ" });
  }
};
```

**UI Button to add** (in CardContent after Payment button):

```tsx
<Button
  variant="outline"
  onClick={requestSupport}
  className="w-full border-orange-300 hover:bg-orange-50 hover:text-orange-900"
>
  <HelpCircle className="h-4 w-4 mr-2" />
  Yêu cầu hỗ trợ
</Button>
```

### 3. Add Item to Order ✅

**Already implemented** - API `addItem` đã có trong order detail page (addItemToOrder)

---

## 📋 Remaining Tasks

### Task 4: Create New Order Form

**Location:** `admin-web/src/app/(modules)/orders/page.tsx`

**Required Data:**

```typescript
{
  table_id?: string;          // Required
  table_group_id?: string;
  reservation_id?: string;
  items?: Array<{
    dish_id: string;
    quantity: number;
    price: number;
    customizations?: any;
  }>;
  voucher_code?: string;
  status?: string;
}
```

**Implementation Steps:**

1. **Add state variables:**

```typescript
const [showCreateDialog, setShowCreateDialog] = useState(false);
const [tables, setTables] = useState<any[]>([]);
const [dishes, setDishes] = useState<any[]>([]);
const [selectedTableId, setSelectedTableId] = useState("");
const [selectedDishes, setSelectedDishes] = useState<
  Array<{
    dish_id: string;
    quantity: number;
    price: number;
  }>
>([]);
```

2. **Load data:**

```typescript
useEffect(() => {
  loadTables();
  loadDishes();
}, []);

const loadTables = async () => {
  try {
    const response = await api.tables.getAvailable();
    setTables(response.data || response);
  } catch (error) {
    console.error("Failed to load tables:", error);
  }
};

const loadDishes = async () => {
  try {
    const response = await api.dishes.getAll();
    setDishes(response.data || response);
  } catch (error) {
    console.error("Failed to load dishes:", error);
  }
};
```

3. **Create order function:**

```typescript
const createOrder = async () => {
  try {
    await api.orders.create({
      table_id: selectedTableId,
      items: selectedDishes,
    });
    toast({ title: "Thành công", description: "Tạo đơn hàng thành công" });
    setShowCreateDialog(false);
    loadOrders(); // Reload list
  } catch (error) {
    toast({ title: "Lỗi", description: "Không thể tạo đơn hàng" });
  }
};
```

4. **UI Dialog:**

```tsx
<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
  <DialogTrigger asChild>
    <Button className="bg-emerald-600">
      <Plus className="h-4 w-4 mr-2" />
      Tạo đơn hàng mới
    </Button>
  </DialogTrigger>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Tạo đơn hàng mới</DialogTitle>
    </DialogHeader>

    <div className="space-y-4">
      {/* Select Table */}
      <div>
        <Label>Bàn</Label>
        <Select value={selectedTableId} onValueChange={setSelectedTableId}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn bàn" />
          </SelectTrigger>
          <SelectContent>
            {tables.map((table) => (
              <SelectItem key={table.id} value={table.id}>
                Bàn {table.table_number} - {table.capacity} người
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Select Dishes */}
      <div>
        <Label>Món ăn</Label>
        {/* Add dish selection UI here */}
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
        Hủy
      </Button>
      <Button onClick={createOrder}>Tạo đơn hàng</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### Task 5: Create New Reservation Form

**Location:** `admin-web/src/app/(modules)/reservations/page.tsx`

**Required Data:**

```typescript
{
  table_id?: string;
  table_group_id?: string;
  reservation_time: string;   // Required - ISO format
  duration_minutes: number;   // Required
  num_people: number;         // Required
  preferences?: any;
  pre_order_items?: any;
  event_id?: string;
  notes?: string;
}
```

**Implementation Steps:**

1. **Add state:**

```typescript
const [showCreateDialog, setShowCreateDialog] = useState(false);
const [tables, setTables] = useState<any[]>([]);
const [events, setEvents] = useState<any[]>([]);
const [formData, setFormData] = useState({
  table_id: "",
  reservation_time: "",
  duration_minutes: 120,
  num_people: 2,
  event_id: "",
  notes: "",
});
```

2. **Load data:**

```typescript
useEffect(() => {
  loadTables();
  loadEvents();
}, []);

const loadEvents = async () => {
  try {
    const response = await api.events.getActive();
    setEvents(response.data || response);
  } catch (error) {
    console.error("Failed to load events:", error);
  }
};
```

3. **Create reservation:**

```typescript
const createReservation = async () => {
  try {
    await api.reservations.create({
      ...formData,
      reservation_time: new Date(formData.reservation_time).toISOString(),
    });
    toast({ title: "Thành công", description: "Tạo đặt bàn thành công" });
    setShowCreateDialog(false);
    loadReservations();
  } catch (error) {
    toast({ title: "Lỗi", description: "Không thể tạo đặt bàn" });
  }
};
```

4. **UI Dialog:** Similar structure to order form

---

### Task 6: Update Order

**Location:** `admin-web/src/app/(modules)/orders/[id]/page.tsx`

**API:**

```typescript
api.orders.update(orderId, {
  table_id?: string;
  table_group_id?: string;
  status?: string;
  payment_method?: string;
});
```

**Implementation:**

```typescript
const updateOrder = async (data: any) => {
  try {
    await api.orders.update(orderId, data);
    await loadOrder();
    toast({ title: "Thành công", description: "Cập nhật đơn hàng thành công" });
  } catch (error) {
    toast({ title: "Lỗi", description: "Không thể cập nhật đơn hàng" });
  }
};

// Example: Change table
const changeTable = async (newTableId: string) => {
  await updateOrder({ table_id: newTableId });
};

// Example: Update payment method
const updatePaymentMethod = async (method: string) => {
  await updateOrder({ payment_method: method });
};
```

**UI:**

- Add "Đổi bàn" button with table selector
- Add payment method selector

---

### Task 7: Update Reservation

**Location:** `admin-web/src/app/(modules)/reservations/[id]/page.tsx`

**API:**

```typescript
api.reservations.update(reservationId, {
  table_id?: string;
  table_group_id?: string;
  reservation_time?: string;
  duration_minutes?: number;
  num_people?: number;
  preferences?: any;
  pre_order_items?: any;
  notes?: string;
});
```

**Implementation:**

```typescript
const updateReservation = async (data: any) => {
  try {
    await api.reservations.update(reservationId, data);
    await loadReservation();
    toast({ title: "Thành công", description: "Cập nhật đặt bàn thành công" });
  } catch (error) {
    toast({ title: "Lỗi", description: "Không thể cập nhật đặt bàn" });
  }
};
```

---

## 🎯 API Endpoints Summary

### Orders

- ✅ `GET /orders` - Get all orders
- ✅ `GET /orders/:id` - Get order detail
- ✅ `POST /orders` - Create new order
- ✅ `PATCH /orders/:id` - Update order
- ✅ `PATCH /orders/:id/status` - Update order status
- ✅ `POST /orders/:id/items` - Add item to order
- ✅ `DELETE /orders/items/:itemId` - Delete item
- ✅ `POST /orders/:id/voucher` - Apply voucher
- ✅ `DELETE /orders/:id/voucher` - Remove voucher
- ✅ `POST /orders/:id/support` - Request support
- ✅ `POST /orders/:id/payment/request` - Request payment

### Reservations

- ✅ `GET /reservations` - Get all reservations
- ✅ `GET /reservations/:id` - Get reservation detail
- ✅ `POST /reservations` - Create new reservation
- ✅ `PATCH /reservations/:id` - Update reservation
- ✅ `PATCH /reservations/:id/status` - Update status
- ✅ `POST /reservations/:id/checkin` - Check in
- ✅ `DELETE /reservations/:id` - Delete reservation

### Supporting APIs

- ✅ `GET /dishes` - Get all dishes
- ✅ `GET /tables` - Get all tables
- ✅ `GET /tables/available` - Get available tables
- ✅ `GET /events` - Get all events
- ✅ `GET /events/active` - Get active events

---

## 📝 Implementation Checklist

### Completed ✅

- [x] Add `removeVoucher` API to client
- [x] Add `create`, `update` APIs for orders
- [x] Add `create`, `update` APIs for reservations
- [x] Add `events` API endpoints
- [x] Implement `removeVoucher` function in order detail
- [x] Implement `requestSupport` function in order detail
- [x] Fix `requestPayment` response type

### Remaining 📋

- [ ] Add "Xóa Voucher" button UI in order detail (if voucher exists)
- [ ] Add "Yêu cầu hỗ trợ" button UI in order detail
- [ ] Create "Tạo đơn hàng mới" dialog in orders list page
- [ ] Create "Tạo đặt bàn mới" dialog in reservations list page
- [ ] Add "Đổi bàn" functionality in order detail
- [ ] Add "Cập nhật thông tin" functionality in reservation detail

---

## 🔧 Quick Implementation Guide

### For each remaining task:

1. **Open the target file**
2. **Add state variables** (see examples above)
3. **Load supporting data** (dishes, tables, events)
4. **Implement create/update function**
5. **Add Dialog UI** with form fields
6. **Add trigger button** to open dialog
7. **Test the functionality**

---

## 💡 Pro Tips

1. **Reuse existing patterns** - Look at how `applyVoucher` is implemented
2. **Use TypeScript** - API types are already defined in `api.ts`
3. **Error handling** - Always wrap API calls in try-catch
4. **Toast notifications** - Use for success/error feedback
5. **Reload after changes** - Call `loadOrder()` or `loadReservation()` after updates
6. **Validate inputs** - Check required fields before API call

---

## 🚨 Important Notes

1. **API Response Format:**

   - Backend returns: `{ status: "success", data: {...} }`
   - Access data via: `response.data` or `response`

2. **Date Handling:**

   - Backend expects ISO format
   - Use: `new Date(dateString).toISOString()`

3. **Optional Fields:**
   - `table_group_id` is alternative to `table_id`
   - `items` can be empty array for order (add later)
   - `event_id` is optional for reservation

---

**Status:** APIs Integrated ✅ | UI Implementation Pending 📋  
**Date:** 2025-10-30  
**Next Step:** Implement remaining UI dialogs and forms
