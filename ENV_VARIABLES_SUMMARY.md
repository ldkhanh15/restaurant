# 📋 Tổng Hợp Environment Variables

## 🔹 be_restaurant

### Tất Cả Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# CORS Configuration
CORS_ORIGIN=*

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=restaurant_db
DB_USER=root
DB_PASSWORD=your-database-password

# Database Connection Pool
DB_POOL_MAX=5
DB_POOL_MIN=0
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

# VNPay Payment Gateway
VNPAY_TMN_CODE=your-vnpay-tmn-code
VNPAY_HASH_SECRET=your-vnpay-hash-secret
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=
VNP_RETURN_URL_APP_USER=
VNP_DEV_RETURN_OVERRIDE=

# Frontend URLs
CLIENT_URL=http://localhost:3000
CLIENT_ADMIN_URL=http://localhost:8081
CLIENT_USER_URL=http://localhost:3000
CLIENT_APP_SCHEME=

# Chatbot
CHATBOT_URL=http://localhost:7860/api
CHATBOT_TIMEOUT=10000

# Upload Configuration
UPLOAD_DIR=uploads/
UPLOAD_MAX_SIZE=5242880

# Business Logic
RESERVATION_TIMEOUT_MINUTES=15

# Debug
DEBUG_SQL=false
```

**Tổng: 30 biến môi trường**

---

## 🔹 admin-web

### Tất Cả Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_API_TIMEOUT=30000

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dsudwzjut
NEXT_PUBLIC_CLOUDINARY_API_KEY=your-cloudinary-api-key
NEXT_PUBLIC_CLOUDINARY_API_SECRET=your-cloudinary-api-secret
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=pbl6_CNPM_
NEXT_PUBLIC_CLOUDINARY_FOLDER=pb6/

# Environment
NODE_ENV=development
```

**Tổng: 9 biến môi trường**

---

## 🔹 user-web

### Tất Cả Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_API_TIMEOUT=30000

# Environment
NODE_ENV=development
```

**Tổng: 4 biến môi trường**

---

## 📊 Thống Kê

| Module        | Biến Hiện Có | Biến Mới Đề Xuất | Tổng   |
| ------------- | ------------ | ---------------- | ------ |
| be_restaurant | 17           | 13               | 30     |
| admin-web     | 3            | 6                | 9      |
| user-web      | 3            | 1                | 4      |
| **TỔNG**      | **23**       | **20**           | **43** |

---

## 🎯 Các Biến Mới Đề Xuất (20 biến)

### be_restaurant (13 biến)

1. `CORS_ORIGIN` - CORS allowed origins
2. `CLIENT_ADMIN_URL` - Admin frontend URL
3. `CLIENT_USER_URL` - User frontend URL
4. `CLIENT_APP_SCHEME` - Mobile app deep link
5. `VNP_RETURN_URL` - VNPay return URL
6. `VNP_RETURN_URL_APP_USER` - VNPay app user return URL
7. `VNP_DEV_RETURN_OVERRIDE` - Dev override for return URL
8. `UPLOAD_DIR` - Upload directory path
9. `UPLOAD_MAX_SIZE` - Max upload file size
10. `CHATBOT_TIMEOUT` - Chatbot API timeout
11. `DB_POOL_MAX` - DB pool max connections
12. `DB_POOL_MIN` - DB pool min connections
13. `DB_POOL_ACQUIRE` - DB pool acquire timeout
14. `DB_POOL_IDLE` - DB pool idle timeout
15. `RESERVATION_TIMEOUT_MINUTES` - Default reservation timeout

### admin-web (6 biến)

1. `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
2. `NEXT_PUBLIC_CLOUDINARY_API_KEY` - Cloudinary API key
3. `NEXT_PUBLIC_CLOUDINARY_API_SECRET` - Cloudinary API secret
4. `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` - Upload preset prefix
5. `NEXT_PUBLIC_CLOUDINARY_FOLDER` - Folder prefix
6. `NEXT_PUBLIC_API_TIMEOUT` - API request timeout

### user-web (1 biến)

1. `NEXT_PUBLIC_API_TIMEOUT` - API request timeout

---

## 📁 Files Cần Sửa

### be_restaurant

- `src/app.ts` - CORS origin
- `src/controllers/paymentController.ts` - Client URLs
- `src/middlewares/upload.ts` - Upload directory
- `src/services/chatService.ts` - Chatbot timeout
- `src/config/database.ts` - DB pool config
- `src/services/reservationService.ts` - Reservation timeout

### admin-web

- `src/services/apiClient.ts` - API timeout
- `src/services/cloudinaryService.ts` - Cloudinary config
- `src/providers/WebSocketProvider.tsx` - WebSocket URL

### user-web

- `src/services/apiClient.ts` - API timeout
- `src/lib/apiClient.ts` - API URL parsing
- `src/providers/WebSocketProvider.tsx` - WebSocket URL

---

## ✅ Next Steps

1. ✅ Đã cập nhật `env.template` files với tất cả biến mới
2. ⏳ Cần sửa code để sử dụng các biến môi trường mới
3. ⏳ Tạo centralized config files
4. ⏳ Thêm validation cho ENV variables
5. ⏳ Update CI/CD workflows

---

**Last Updated:** 2024-12-XX  
**Version:** 1.0.0
