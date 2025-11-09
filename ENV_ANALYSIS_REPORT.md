# 📋 Báo Cáo Phân Tích Environment Variables

## 🔍 Tổng Quan

Báo cáo này phân tích toàn bộ source code để tìm các giá trị hardcode cần chuyển sang environment variables.

---

## 🔹 be_restaurant

### ✅ Environment Variables Hiện Có

| Variable                | Mô tả                 | Default                            | Status |
| ----------------------- | --------------------- | ---------------------------------- | ------ |
| `NODE_ENV`              | Environment mode      | `development`                      | ✅ OK  |
| `PORT`                  | Server port           | `3000`                             | ✅ OK  |
| `DB_HOST`               | Database host         | `localhost`                        | ✅ OK  |
| `DB_PORT`               | Database port         | `3306`                             | ✅ OK  |
| `DB_NAME`               | Database name         | `restaurant_db`                    | ✅ OK  |
| `DB_USER`               | Database user         | `root`                             | ✅ OK  |
| `DB_PASSWORD`           | Database password     | -                                  | ✅ OK  |
| `JWT_SECRET`            | JWT secret key        | -                                  | ✅ OK  |
| `JWT_EXPIRES_IN`        | JWT expiration        | `7d`                               | ✅ OK  |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | -                                  | ✅ OK  |
| `CLOUDINARY_API_KEY`    | Cloudinary API key    | -                                  | ✅ OK  |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | -                                  | ✅ OK  |
| `VNPAY_TMN_CODE`        | VNPay terminal code   | -                                  | ✅ OK  |
| `VNPAY_HASH_SECRET`     | VNPay hash secret     | -                                  | ✅ OK  |
| `VNP_URL`               | VNPay payment URL     | `https://sandbox.vnpayment.vn/...` | ✅ OK  |
| `CLIENT_URL`            | Frontend URL          | `http://localhost:3000`            | ✅ OK  |
| `CHATBOT_URL`           | Chatbot API URL       | `http://localhost:7860/api`        | ✅ OK  |
| `DEBUG_SQL`             | Enable SQL logging    | `false`                            | ✅ OK  |

### ⚠️ Environment Variables Cần Thêm

| Variable                      | Mô tả                       | Default                 | Vị trí Hardcode                                                  |
| ----------------------------- | --------------------------- | ----------------------- | ---------------------------------------------------------------- |
| `CORS_ORIGIN`                 | CORS allowed origins        | `*`                     | `be_restaurant/src/app.ts:63`                                    |
| `CLIENT_ADMIN_URL`            | Admin frontend URL          | `http://localhost:8081` | `be_restaurant/src/controllers/paymentController.ts:23`          |
| `CLIENT_USER_URL`             | User frontend URL           | `http://localhost:3000` | `be_restaurant/src/controllers/paymentController.ts:24`          |
| `CLIENT_APP_SCHEME`           | Mobile app deep link scheme | -                       | `be_restaurant/src/controllers/payment_app_userController.ts:16` |
| `VNP_RETURN_URL`              | VNPay return URL            | Auto from CLIENT_URL    | `be_restaurant/src/config/vnpay.config.ts:13`                    |
| `VNP_RETURN_URL_APP_USER`     | VNPay app user return URL   | -                       | `be_restaurant/src/services/payment_app_userService.ts:37`       |
| `VNP_DEV_RETURN_OVERRIDE`     | Dev override for return URL | -                       | `be_restaurant/src/services/payment_app_userService.ts:52`       |
| `UPLOAD_DIR`                  | Upload directory path       | `uploads/`              | `be_restaurant/src/middlewares/upload.ts:3`                      |
| `CHATBOT_TIMEOUT`             | Chatbot API timeout (ms)    | `10000`                 | `be_restaurant/src/services/chatService.ts:148`                  |
| `DB_POOL_MAX`                 | DB connection pool max      | `5`                     | `be_restaurant/src/config/database.ts:30`                        |
| `DB_POOL_MIN`                 | DB connection pool min      | `0`                     | `be_restaurant/src/config/database.ts:31`                        |
| `DB_POOL_ACQUIRE`             | DB pool acquire timeout     | `30000`                 | `be_restaurant/src/config/database.ts:32`                        |
| `DB_POOL_IDLE`                | DB pool idle timeout        | `10000`                 | `be_restaurant/src/config/database.ts:33`                        |
| `RESERVATION_TIMEOUT_MINUTES` | Default reservation timeout | `15`                    | `be_restaurant/src/services/reservationService.ts:223`           |

### 📁 Files Có Hardcode Cần Sửa

1. **`be_restaurant/src/app.ts:63`**

   ```typescript
   // ❌ Trước
   app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));

   // ✅ Sau
   app.use(
     cors({
       origin: process.env.CORS_ORIGIN || "*",
       credentials: true,
     })
   );
   ```

2. **`be_restaurant/src/controllers/paymentController.ts:23-24`**

   ```typescript
   // ❌ Trước
   const adminClient = process.env.CLIENT_ADMIN_URL || "http://localhost:8081";
   const userClient = process.env.CLIENT_USER_URL || "http://localhost:3000";

   // ✅ Sau (đã có ENV, chỉ cần đảm bảo có trong .env)
   const adminClient =
     process.env.CLIENT_ADMIN_URL ||
     process.env.CLIENT_URL ||
     "http://localhost:8081";
   const userClient =
     process.env.CLIENT_USER_URL ||
     process.env.CLIENT_URL ||
     "http://localhost:3000";
   ```

3. **`be_restaurant/src/middlewares/upload.ts:3`**

   ```typescript
   // ❌ Trước
   const upload = multer({ dest: "uploads/" });

   // ✅ Sau
   const upload = multer({
     dest: process.env.UPLOAD_DIR || "uploads/",
     limits: {
       fileSize: parseInt(process.env.UPLOAD_MAX_SIZE || "5242880"), // 5MB default
     },
   });
   ```

4. **`be_restaurant/src/services/chatService.ts:148`**

   ```typescript
   // ❌ Trước
   {
     timeout: 10000;
   }

   // ✅ Sau
   {
     timeout: parseInt(process.env.CHATBOT_TIMEOUT || "10000");
   }
   ```

5. **`be_restaurant/src/config/database.ts:30-33`**

   ```typescript
   // ❌ Trước
   pool: {
     max: 5,
     min: 0,
     acquire: 30000,
     idle: 10000,
   }

   // ✅ Sau
   pool: {
     max: parseInt(process.env.DB_POOL_MAX || "5"),
     min: parseInt(process.env.DB_POOL_MIN || "0"),
     acquire: parseInt(process.env.DB_POOL_ACQUIRE || "30000"),
     idle: parseInt(process.env.DB_POOL_IDLE || "10000"),
   }
   ```

6. **`be_restaurant/src/services/reservationService.ts:223`**

   ```typescript
   // ❌ Trước
   timeout_minutes: 15,

   // ✅ Sau
   timeout_minutes: parseInt(process.env.RESERVATION_TIMEOUT_MINUTES || "15"),
   ```

---

## 🔹 admin-web

### ✅ Environment Variables Hiện Có

| Variable              | Mô tả            | Default                     | Status     |
| --------------------- | ---------------- | --------------------------- | ---------- |
| `NEXT_PUBLIC_API_URL` | Backend API URL  | `http://localhost:8000/api` | ✅ OK      |
| `NEXT_PUBLIC_WS_URL`  | WebSocket URL    | `ws://localhost:8000`       | ⚠️ Cần sửa |
| `NODE_ENV`            | Environment mode | `development`               | ✅ OK      |

### ⚠️ Environment Variables Cần Thêm

| Variable                               | Mô tả                           | Default      | Vị trí Hardcode                                  |
| -------------------------------------- | ------------------------------- | ------------ | ------------------------------------------------ |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`    | Cloudinary cloud name           | `dsudwzjut`  | `admin-web/src/services/cloudinaryService.ts:9`  |
| `NEXT_PUBLIC_CLOUDINARY_API_KEY`       | Cloudinary API key              | -            | `admin-web/src/services/cloudinaryService.ts:45` |
| `NEXT_PUBLIC_CLOUDINARY_API_SECRET`    | Cloudinary API secret           | -            | `admin-web/src/services/cloudinaryService.ts:46` |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Cloudinary upload preset prefix | `pbl6_CNPM_` | `admin-web/src/services/cloudinaryService.ts:6`  |
| `NEXT_PUBLIC_CLOUDINARY_FOLDER`        | Cloudinary folder prefix        | `pb6/`       | `admin-web/src/services/cloudinaryService.ts:7`  |
| `NEXT_PUBLIC_API_TIMEOUT`              | API request timeout (ms)        | `30000`      | Nên thêm                                         |

### 📁 Files Có Hardcode Cần Sửa

1. **`admin-web/src/services/apiClient.ts:8`**

   ```typescript
   // ❌ Trước
   baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api` || "http://localhost:8000/api",

   // ✅ Sau
   baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
   timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "30000"),
   ```

2. **`admin-web/src/services/cloudinaryService.ts:9`**

   ```typescript
   // ❌ Trước
   const response = await fetch("https://api.cloudinary.com/v1_1/dsudwzjut/image/upload", {

   // ✅ Sau
   const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dsudwzjut";
   const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
   ```

3. **`admin-web/src/services/cloudinaryService.ts:6-7`**

   ```typescript
   // ❌ Trước
   formData.append("upload_preset", `pbl6_CNPM_${param}`);
   formData.append("folder", `pb6/${param}`);

   // ✅ Sau
   const uploadPresetPrefix =
     process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "pbl6_CNPM_";
   const folderPrefix = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || "pb6/";
   formData.append("upload_preset", `${uploadPresetPrefix}${param}`);
   formData.append("folder", `${folderPrefix}${param}`);
   ```

4. **`admin-web/src/services/cloudinaryService.ts:38`**

   ```typescript
   // ❌ Trước
   const response = await fetch(`https://api.cloudinary.com/v1_1/dsudwzjut/image/destroy`, {

   // ✅ Sau
   const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dsudwzjut";
   const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
   ```

5. **`admin-web/src/providers/WebSocketProvider.tsx:166`**

   ```typescript
   // ❌ Trước
   const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

   // ✅ Sau
   const baseUrl =
     process.env.NEXT_PUBLIC_WS_URL ||
     process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
     "http://localhost:8000";
   ```

---

## 🔹 user-web

### ✅ Environment Variables Hiện Có

| Variable              | Mô tả            | Default                     | Status     |
| --------------------- | ---------------- | --------------------------- | ---------- |
| `NEXT_PUBLIC_API_URL` | Backend API URL  | `http://localhost:8000/api` | ✅ OK      |
| `NEXT_PUBLIC_WS_URL`  | WebSocket URL    | `ws://localhost:8000`       | ⚠️ Cần sửa |
| `NODE_ENV`            | Environment mode | `development`               | ✅ OK      |

### ⚠️ Environment Variables Cần Thêm

| Variable                  | Mô tả                    | Default | Vị trí Hardcode |
| ------------------------- | ------------------------ | ------- | --------------- |
| `NEXT_PUBLIC_API_TIMEOUT` | API request timeout (ms) | `30000` | Nên thêm        |

### 📁 Files Có Hardcode Cần Sửa

1. **`user-web/src/services/apiClient.ts:4`**

   ```typescript
   // ❌ Trước
   baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',

   // ✅ Sau
   baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
   timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "30000"),
   ```

2. **`user-web/src/lib/apiClient.ts:1`**

   ```typescript
   // ❌ Trước
   const API_URL =
     `${process.env.NEXT_PUBLIC_API_URL}` || "http://localhost:8000";

   // ✅ Sau
   const API_URL =
     process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
     "http://localhost:8000";
   ```

3. **`user-web/src/providers/WebSocketProvider.tsx:80`**

   ```typescript
   // ❌ Trước
   const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

   // ✅ Sau
   const baseUrl =
     process.env.NEXT_PUBLIC_WS_URL ||
     process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
     "http://localhost:8000";
   ```

---

## 🎯 Tổng Hợp ENV Variables Cần Thêm

### be_restaurant (13 biến mới)

```env
# CORS Configuration
CORS_ORIGIN=*

# Frontend URLs
CLIENT_ADMIN_URL=http://localhost:8081
CLIENT_USER_URL=http://localhost:3000
CLIENT_APP_SCHEME=

# VNPay Return URLs
VNP_RETURN_URL=
VNP_RETURN_URL_APP_USER=
VNP_DEV_RETURN_OVERRIDE=

# Upload Configuration
UPLOAD_DIR=uploads/
UPLOAD_MAX_SIZE=5242880

# Chatbot Configuration
CHATBOT_TIMEOUT=10000

# Database Pool Configuration
DB_POOL_MAX=5
DB_POOL_MIN=0
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000

# Business Logic
RESERVATION_TIMEOUT_MINUTES=15
```

### admin-web (5 biến mới)

```env
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dsudwzjut
NEXT_PUBLIC_CLOUDINARY_API_KEY=
NEXT_PUBLIC_CLOUDINARY_API_SECRET=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=pbl6_CNPM_
NEXT_PUBLIC_CLOUDINARY_FOLDER=pb6/

# API Configuration
NEXT_PUBLIC_API_TIMEOUT=30000
```

### user-web (1 biến mới)

```env
# API Configuration
NEXT_PUBLIC_API_TIMEOUT=30000
```

---

## 🔧 Gợi Ý Cải Thiện

### 1. Validation ENV Variables

Tạo file `be_restaurant/src/config/validateEnv.ts`:

```typescript
import dotenv from "dotenv";

dotenv.config();

const requiredEnvVars = [
  "DB_HOST",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "JWT_SECRET",
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:");
  missingVars.forEach((varName) => console.error(`  - ${varName}`));
  process.exit(1);
}

console.log("✅ All required environment variables are set");
```

### 2. Centralized Config

Tạo file `be_restaurant/src/config/app.config.ts`:

```typescript
export const AppConfig = {
  server: {
    port: parseInt(process.env.PORT || "3000"),
    nodeEnv: process.env.NODE_ENV || "development",
  },
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
  },
  client: {
    url: process.env.CLIENT_URL || "http://localhost:3000",
    adminUrl:
      process.env.CLIENT_ADMIN_URL ||
      process.env.CLIENT_URL ||
      "http://localhost:8081",
    userUrl:
      process.env.CLIENT_USER_URL ||
      process.env.CLIENT_URL ||
      "http://localhost:3000",
    appScheme: process.env.CLIENT_APP_SCHEME || "",
  },
  upload: {
    dir: process.env.UPLOAD_DIR || "uploads/",
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || "5242880"),
  },
  chatbot: {
    url: process.env.CHATBOT_URL || "http://localhost:7860/api",
    timeout: parseInt(process.env.CHATBOT_TIMEOUT || "10000"),
  },
  database: {
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || "5"),
      min: parseInt(process.env.DB_POOL_MIN || "0"),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || "30000"),
      idle: parseInt(process.env.DB_POOL_IDLE || "10000"),
    },
  },
  reservation: {
    timeoutMinutes: parseInt(process.env.RESERVATION_TIMEOUT_MINUTES || "15"),
  },
};
```

### 3. Next.js Config Helper

Tạo file `admin-web/src/lib/config.ts`:

```typescript
export const AppConfig = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "30000"),
  },
  ws: {
    url:
      process.env.NEXT_PUBLIC_WS_URL ||
      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
      "ws://localhost:8000",
  },
  cloudinary: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dsudwzjut",
    apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || "",
    apiSecret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET || "",
    uploadPresetPrefix:
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "pbl6_CNPM_",
    folderPrefix: process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || "pb6/",
  },
};
```

---

## 📝 Checklist Implementation

- [ ] Thêm tất cả ENV variables vào `.env.template`
- [ ] Tạo file validation cho ENV variables
- [ ] Sửa tất cả hardcoded values trong code
- [ ] Tạo centralized config files
- [ ] Update documentation
- [ ] Test với các giá trị ENV khác nhau
- [ ] Update CI/CD workflows để set ENV variables

---

**Last Updated:** 2024-12-XX  
**Version:** 1.0.0
