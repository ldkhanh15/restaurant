# ✅ Kiểm Tra Environment Variables Template

## 🔍 Kết Quả Kiểm Tra

### 🔹 be_restaurant/env.template

#### ✅ Đã Có Đầy Đủ (30 biến)

| Biến                          | Trạng thái | Ghi chú           |
| ----------------------------- | ---------- | ----------------- |
| `NODE_ENV`                    | ✅         | Có trong template |
| `PORT`                        | ✅         | Có trong template |
| `CORS_ORIGIN`                 | ✅         | Có trong template |
| `DB_HOST`                     | ✅         | Có trong template |
| `DB_PORT`                     | ✅         | Có trong template |
| `DB_NAME`                     | ✅         | Có trong template |
| `DB_USER`                     | ✅         | Có trong template |
| `DB_PASSWORD`                 | ✅         | Có trong template |
| `DB_POOL_MAX`                 | ✅         | Có trong template |
| `DB_POOL_MIN`                 | ✅         | Có trong template |
| `DB_POOL_ACQUIRE`             | ✅         | Có trong template |
| `DB_POOL_IDLE`                | ✅         | Có trong template |
| `JWT_SECRET`                  | ✅         | Có trong template |
| `JWT_EXPIRES_IN`              | ✅         | Có trong template |
| `CLOUDINARY_CLOUD_NAME`       | ✅         | Có trong template |
| `CLOUDINARY_API_KEY`          | ✅         | Có trong template |
| `CLOUDINARY_API_SECRET`       | ✅         | Có trong template |
| `VNPAY_TMN_CODE`              | ✅         | Có trong template |
| `VNPAY_HASH_SECRET`           | ✅         | Có trong template |
| `VNP_URL`                     | ✅         | Có trong template |
| `VNP_RETURN_URL`              | ✅         | Có trong template |
| `VNP_RETURN_URL_APP_USER`     | ✅         | Có trong template |
| `VNP_DEV_RETURN_OVERRIDE`     | ✅         | Có trong template |
| `CLIENT_URL`                  | ✅         | Có trong template |
| `CLIENT_ADMIN_URL`            | ✅         | Có trong template |
| `CLIENT_USER_URL`             | ✅         | Có trong template |
| `CLIENT_APP_SCHEME`           | ✅         | Có trong template |
| `CHATBOT_URL`                 | ✅         | Có trong template |
| `CHATBOT_TIMEOUT`             | ✅         | Có trong template |
| `UPLOAD_DIR`                  | ✅         | Có trong template |
| `UPLOAD_MAX_SIZE`             | ✅         | Có trong template |
| `RESERVATION_TIMEOUT_MINUTES` | ✅         | Có trong template |
| `DEBUG_SQL`                   | ✅         | Có trong template |

#### ⚠️ Biến Được Sử Dụng Nhưng Không Có Trong Template

| Biến                         | Vị trí sử dụng                                     | Ghi chú     |
| ---------------------------- | -------------------------------------------------- | ----------- |
| `VNP_RETURN_URL_ORDER`       | `be_restaurant/src/services/paymentService.ts:130` | ⚠️ Cần thêm |
| `VNP_RETURN_URL_RESERVATION` | `be_restaurant/src/services/paymentService.ts:156` | ⚠️ Cần thêm |

### 🔹 admin-web/env.template

#### ✅ Đã Có Đầy Đủ (9 biến)

| Biến                                   | Trạng thái | Ghi chú           |
| -------------------------------------- | ---------- | ----------------- |
| `NEXT_PUBLIC_API_URL`                  | ✅         | Có trong template |
| `NEXT_PUBLIC_WS_URL`                   | ✅         | Có trong template |
| `NEXT_PUBLIC_API_TIMEOUT`              | ✅         | Có trong template |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`    | ✅         | Có trong template |
| `NEXT_PUBLIC_CLOUDINARY_API_KEY`       | ✅         | Có trong template |
| `NEXT_PUBLIC_CLOUDINARY_API_SECRET`    | ✅         | Có trong template |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | ✅         | Có trong template |
| `NEXT_PUBLIC_CLOUDINARY_FOLDER`        | ✅         | Có trong template |
| `NODE_ENV`                             | ✅         | Có trong template |

### 🔹 user-web/env.template

#### ✅ Đã Có Đầy Đủ (4 biến)

| Biến                      | Trạng thái | Ghi chú           |
| ------------------------- | ---------- | ----------------- |
| `NEXT_PUBLIC_API_URL`     | ✅         | Có trong template |
| `NEXT_PUBLIC_WS_URL`      | ✅         | Có trong template |
| `NEXT_PUBLIC_API_TIMEOUT` | ✅         | Có trong template |
| `NODE_ENV`                | ✅         | Có trong template |

---

## 🔧 Cần Bổ Sung

### be_restaurant/env.template

Cần thêm 2 biến:

```env
# VNPay Return URLs (specific for order and reservation)
# If not set, will use VNP_RETURN_URL or construct from CLIENT_URL
VNP_RETURN_URL_ORDER=
VNP_RETURN_URL_RESERVATION=
```

---

## 📊 Tổng Kết

- **be_restaurant**: 30/32 biến (thiếu 2 biến)
- **admin-web**: 9/9 biến ✅
- **user-web**: 4/4 biến ✅

**Tổng**: 43/45 biến (thiếu 2 biến trong be_restaurant)

---

**Last Updated:** 2024-12-XX
