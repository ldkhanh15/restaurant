# ✅ Payment Feature Complete

## 📌 Tổng quan

Đã hoàn thành 3 yêu cầu về tính năng thanh toán:

1. ✅ Fix tính tiền - trừ voucher discount
2. ✅ Tạo hóa đơn thanh toán với lựa chọn tiền mặt/VNPay
3. ✅ Tạo các trang thông báo trạng thái thanh toán

---

## 🎯 Yêu cầu 1: Fix tính tiền

### Vấn đề:

Dialog thanh toán hiển thị `total_amount` thay vì `final_amount` (đã trừ voucher)

### Giải pháp:

```typescript
// ❌ TRƯỚC: Dùng total_amount
{
  formatCurrency(order.total_amount);
}

// ✅ SAU: Dùng final_amount (đã trừ voucher)
{
  formatCurrency(order.final_amount);
}
```

---

## 🎯 Yêu cầu 2: Dialog thanh toán mới

### Tính năng:

#### 1. Hiển thị hóa đơn chi tiết

```typescript
- Chi tiết món ăn (tên món x số lượng = giá)
- Tổng tiền món ăn (total_amount)
- Giảm giá voucher (-voucher_discount_amount)
- Phí sự kiện (+event_fee)
- Tổng thanh toán (final_amount) ← Số tiền cuối cùng
```

#### 2. Lựa chọn phương thức thanh toán

- **Tiền mặt**: Xác nhận thanh toán ngay → Order status = "paid"
- **VNPay**: Redirect đến cổng thanh toán VNPay

### Logic xử lý:

```typescript
const requestPayment = async () => {
  if (!order) return;

  try {
    if (paymentMethod === "cash") {
      // Thanh toán tiền mặt - chuyển trạng thái order thành paid
      await api.orders.updateStatus(orderId, "paid");
      toast({
        title: "Thành công",
        description: "Đã xác nhận thanh toán tiền mặt",
      });
      loadOrder();
    } else if (paymentMethod === "vnpay") {
      // Thanh toán VNPAY - gọi API lấy URL redirect
      const response = await api.orders.requestPayment(orderId, {
        method: paymentMethod,
        amount: order.final_amount, // ✅ Dùng final_amount
      });

      // Redirect đến VNPay
      if (response.data.redirect_url) {
        window.location.href = response.data.redirect_url;
      }
    }
  } catch (error) {
    toast({ title: "Lỗi", description: "Không thể xử lý thanh toán" });
  }
};
```

### UI Dialog:

**Cấu trúc:**

```
┌─────────────────────────────────┐
│  Hóa đơn thanh toán             │
│  Đơn hàng #xxxxxxxx             │
├─────────────────────────────────┤
│  Chi tiết đơn hàng              │
│  ├─ Món 1 x2        100,000đ    │
│  ├─ Món 2 x1         50,000đ    │
│  └─ Món 3 x3        150,000đ    │
├─────────────────────────────────┤
│  Tổng tiền món ăn:   300,000đ   │
│  Giảm giá (Voucher): -50,000đ   │ ← Hiển thị nếu có voucher
│  Phí sự kiện:        +20,000đ   │ ← Hiển thị nếu có event
├─────────────────────────────────┤
│  Tổng thanh toán:    270,000đ   │ ← final_amount (màu xanh, to)
├─────────────────────────────────┤
│  Phương thức thanh toán          │
│  [Select: Tiền mặt / VNPay]     │
├─────────────────────────────────┤
│  [Hủy]  [Xác nhận thanh toán]   │
└─────────────────────────────────┘
```

**Nút động:**

- Tiền mặt → "Xác nhận thanh toán"
- VNPay → "Thanh toán VNPay"

---

## 🎯 Yêu cầu 3: Trang thông báo thanh toán

### 1. Payment Success Page

**Route:** `/payment/success`

**Query params:**

- `?order_id={order_id}` - Thanh toán đơn hàng
- `?reservation_id={reservation_id}` - Đặt cọc reservation

**Features:**

- ✅ Icon thành công (CheckCircle màu xanh)
- ✅ Hiển thị mã đơn hàng/reservation
- ✅ Countdown tự động redirect (10 giây)
- ✅ Nút "Xem chi tiết" và "Về trang chủ"
- ✅ Auto redirect đến order/reservation detail

**UI:**

```
┌──────────────────────────────────┐
│         ✓ (icon xanh)            │
│   Thanh toán thành công!         │
├──────────────────────────────────┤
│ Đơn hàng của bạn đã được thanh   │
│ toán thành công                  │
├──────────────────────────────────┤
│ 📄 Mã đơn hàng                   │
│    #12345678                     │
├──────────────────────────────────┤
│ Tự động chuyển hướng sau 10s...  │
├──────────────────────────────────┤
│ [Về trang chủ] [Xem chi tiết →] │
└──────────────────────────────────┘
```

### 2. Payment Failed Page

**Route:** `/payment/failed`

**Query params:**

- `?reason=invalid_hash` - Chữ ký không hợp lệ
- `?reason=order_not_found` - Không tìm thấy order
- `?reason=unknown_type` - Không xác định loại giao dịch
- `?order_id={order_id}` - Lỗi thanh toán order
- `?reservation_id={reservation_id}` - Lỗi đặt cọc reservation

**Error Messages:**

| Reason            | Title                         | Description                                                                    |
| ----------------- | ----------------------------- | ------------------------------------------------------------------------------ |
| `invalid_hash`    | Giao dịch không hợp lệ        | Chữ ký điện tử không đúng. Link thanh toán có thể đã bị thay đổi hoặc hết hạn. |
| `order_not_found` | Không tìm thấy đơn hàng       | Đơn hàng không tồn tại trong hệ thống.                                         |
| `unknown_type`    | Loại giao dịch không xác định | Không xác định được đây là thanh toán đơn hàng hay đặt cọc reservation.        |
| `default`         | Thanh toán thất bại           | Đã xảy ra lỗi trong quá trình thanh toán.                                      |

**Features:**

- ✅ Icon lỗi tương ứng (XCircle, AlertTriangle, HelpCircle...)
- ✅ Alert box màu đỏ với thông báo lỗi
- ✅ Hiển thị mã đơn hàng/reservation (nếu có)
- ✅ Lưu ý: "Không có khoản tiền nào bị trừ"
- ✅ Countdown tự động về trang chủ (15 giây)
- ✅ Nút "Thử lại" và "Về trang chủ"

**UI:**

```
┌──────────────────────────────────┐
│         ✗ (icon đỏ)              │
│   Thanh toán thất bại            │
├──────────────────────────────────┤
│ ⚠️ [Thông báo lỗi chi tiết]     │
├──────────────────────────────────┤
│ 📄 Mã đơn hàng                   │
│    #12345678                     │
├──────────────────────────────────┤
│ 📌 Lưu ý: Giao dịch chưa được   │
│ thực hiện. Không có khoản tiền   │
│ nào bị trừ từ tài khoản.         │
├──────────────────────────────────┤
│ Tự động quay về sau 15s...       │
├──────────────────────────────────┤
│ [← Về trang chủ]  [Thử lại]     │
└──────────────────────────────────┘
```

---

## 📂 Files Created/Modified

### Created (2 new pages)

1. ✅ `admin-web/src/app/(modules)/payment/success/page.tsx`
2. ✅ `admin-web/src/app/(modules)/payment/failed/page.tsx`

### Modified (1 file)

1. ✅ `admin-web/src/app/(modules)/orders/[id]/page.tsx`
   - Sửa dialog thanh toán
   - Fix tính tiền (dùng `final_amount`)
   - Thêm logic thanh toán tiền mặt/VNPay

---

## 🔄 Payment Flow

### Flow 1: Thanh toán tiền mặt

```
User bấm "Yêu cầu thanh toán"
  ↓
Dialog hiển thị hóa đơn
  ↓
Chọn "Tiền mặt"
  ↓
Bấm "Xác nhận thanh toán"
  ↓
Call API: PATCH /api/orders/{id}/status → "paid"
  ↓
Toast: "Đã xác nhận thanh toán tiền mặt"
  ↓
Reload order details
```

### Flow 2: Thanh toán VNPay

```
User bấm "Yêu cầu thanh toán"
  ↓
Dialog hiển thị hóa đơn
  ↓
Chọn "VNPay"
  ↓
Bấm "Thanh toán VNPay"
  ↓
Call API: POST /api/orders/{id}/payment/request
  ↓
Response: { redirect_url: "https://vnpay.vn/..." }
  ↓
window.location.href = redirect_url
  ↓
User thanh toán trên VNPay
  ↓
VNPay callback về backend
  ↓
Backend xử lý kết quả
  ↓
Backend redirect đến:
  ✅ /payment/success?order_id={id}
  ❌ /payment/failed?reason=...&order_id={id}
```

---

## 🧪 Testing Guide

### Test Case 1: Thanh toán tiền mặt thành công

1. Vào order detail page
2. Bấm "Yêu cầu thanh toán"
3. Verify:
   - ✅ Hiển thị đúng chi tiết món ăn
   - ✅ Tổng tiền = total_amount
   - ✅ Giảm giá = voucher_discount_amount (nếu có)
   - ✅ Tổng thanh toán = final_amount
4. Chọn "Tiền mặt"
5. Bấm "Xác nhận thanh toán"
6. Verify:
   - ✅ Toast hiển thị thành công
   - ✅ Order status chuyển sang "paid"
   - ✅ Dialog đóng lại

### Test Case 2: Thanh toán VNPay

1. Vào order detail page
2. Bấm "Yêu cầu thanh toán"
3. Chọn "VNPay"
4. Bấm "Thanh toán VNPay"
5. Verify:
   - ✅ Redirect đến VNPay payment gateway
   - ✅ URL chứa order_id và amount đúng

### Test Case 3: Payment Success Page

**URL:** `/payment/success?order_id=xxx`

Verify:

- ✅ Icon xanh hiển thị
- ✅ Hiển thị mã đơn hàng
- ✅ Countdown từ 10 → 0
- ✅ Auto redirect đến `/orders/{id}`
- ✅ Nút "Xem chi tiết" hoạt động

### Test Case 4: Payment Failed Page

**URL:** `/payment/failed?reason=invalid_hash&order_id=xxx`

Verify:

- ✅ Icon đỏ hiển thị
- ✅ Thông báo lỗi đúng với reason
- ✅ Hiển thị mã đơn hàng
- ✅ Lưu ý "không bị trừ tiền" hiển thị
- ✅ Countdown từ 15 → 0
- ✅ Nút "Thử lại" hoạt động

### Test Case 5: Tính tiền đúng với voucher

1. Tạo order có voucher discount
2. Bấm "Yêu cầu thanh toán"
3. Verify:
   - ✅ Tổng tiền món ăn = total_amount
   - ✅ Giảm giá hiển thị màu xanh với dấu "-"
   - ✅ Tổng thanh toán = total_amount - voucher_discount_amount
   - ✅ Số tiền gửi lên API = final_amount (không phải total_amount)

---

## 🎨 UI/UX Highlights

### Design Principles

- ✅ Màu sắc rõ ràng: Xanh (success), Đỏ (error)
- ✅ Icons trực quan: CheckCircle, XCircle, AlertTriangle
- ✅ Countdown để user biết thời gian redirect
- ✅ Buttons rõ ràng: "Về trang chủ" vs "Xem chi tiết"/"Thử lại"
- ✅ Gradient backgrounds sang trọng
- ✅ Card với shadow để nổi bật
- ✅ Responsive design

### Color Scheme

**Success:**

- Background: `from-emerald-50 via-white to-amber-50`
- Icon: `from-emerald-500 to-emerald-600`
- Primary button: `from-emerald-500 to-emerald-600`

**Failed:**

- Background: `from-red-50 via-white to-orange-50`
- Icon: `from-red-500 to-red-600`
- Alert: `border-red-300 bg-red-50`

---

## 🚨 Important Notes

### 1. Migration Database

⚠️ **QUAN TRỌNG:** Phải chạy migration trước khi test:

```bash
cd be_restaurant
mysql -u root -p your_database < MIGRATION_OrderItem_Status.sql
npm run dev
```

### 2. Backend API Requirements

Backend cần có các endpoints:

- ✅ `PATCH /api/orders/{id}/status` - Update order status
- ✅ `POST /api/orders/{id}/payment/request` - Request VNPay payment
- ✅ Backend callback handler cho VNPay
- ✅ Backend redirect logic đến `/payment/success` hoặc `/payment/failed`

### 3. Frontend Routes

Routes đã được tạo:

- ✅ `/payment/success` - Success page
- ✅ `/payment/failed` - Failed page

---

## ✅ Completion Checklist

- [x] Fix tính tiền trong dialog (dùng `final_amount`)
- [x] Tạo UI hóa đơn chi tiết
- [x] Hiển thị voucher discount
- [x] Hiển thị event fee (nếu có)
- [x] Select phương thức thanh toán
- [x] Logic thanh toán tiền mặt
- [x] Logic thanh toán VNPay (redirect)
- [x] Tạo payment success page
- [x] Tạo payment failed page
- [x] Xử lý các loại lỗi khác nhau
- [x] Auto countdown và redirect
- [x] Responsive UI
- [x] No linter errors

---

**Status:** ✅ COMPLETE  
**Date:** 2025-10-30  
**Version:** 1.0.0

Tất cả 3 yêu cầu đã được hoàn thành với UI/UX sang trọng và logic xử lý đầy đủ!
