# 🚀 Hướng Dẫn Lấy Các Giá Trị Cho Deploy và CI/CD

## 📋 Tổng Quan

Tài liệu này hướng dẫn cách lấy tất cả các giá trị cần thiết cho việc deploy và cấu hình CI/CD từ Render và Vercel.

---

## 🔹 1. GitHub Secrets (Cho CI/CD)

### Vercel Secrets

#### 1.1 VERCEL_TOKEN

**Cách lấy:**

1. Đăng nhập Vercel Dashboard: https://vercel.com/dashboard
2. Click vào **Settings** (icon bánh răng ở góc trên bên phải)
3. Vào tab **Tokens**
4. Click **Create Token**
5. Đặt tên token (ví dụ: `GitHub Actions CI/CD`)
6. Chọn **Expiration** (khuyến nghị: No Expiration cho production)
7. Click **Create Token**
8. **Copy token ngay lập tức** (chỉ hiển thị 1 lần)
9. Vào GitHub Repository → **Settings** → **Secrets and variables** → **Actions**
10. Click **New repository secret**
11. Name: `VERCEL_TOKEN`
12. Value: Paste token vừa copy
13. Click **Add secret**

**Lưu ý:**

- Token có format: `vercel_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Không share token này với ai
- Nếu token bị lộ, xóa ngay và tạo token mới

#### 1.2 VERCEL_ORG_ID

**Cách lấy:**

1. Vào Vercel Dashboard: https://vercel.com/dashboard
2. Click vào **Settings** (icon bánh răng)
3. Vào tab **General**
4. Scroll xuống phần **Organization ID**
5. Copy **Organization ID** (format: `team_xxxxxxxxxxxxx` hoặc `user_xxxxxxxxxxxxx`)
6. Thêm vào GitHub Secret: `VERCEL_ORG_ID`

**Lưu ý:**

- Nếu dùng Personal Account: format là `user_xxxxxxxxxxxxx`
- Nếu dùng Team: format là `team_xxxxxxxxxxxxx`

#### 1.3 VERCEL_ADMIN_WEB_PROJECT_ID

**Cách lấy:**

1. Vào Vercel Dashboard
2. Click vào project **Admin Web** (hoặc tạo project mới nếu chưa có)
3. Vào **Settings** tab
4. Vào **General** section
5. Scroll xuống tìm **Project ID**
6. Copy **Project ID** (format: `prj_xxxxxxxxxxxxx`)
7. Thêm vào GitHub Secret: `VERCEL_ADMIN_WEB_PROJECT_ID`

**Tạo Project mới (nếu chưa có):**

1. Click **Add New** → **Project**
2. Import Git Repository (chọn GitHub repo)
3. Root Directory: `admin-web`
4. Framework Preset: **Next.js**
5. Build Command: `npm run build` (hoặc để mặc định)
6. Output Directory: `.next` (hoặc để mặc định)
7. Install Command: `npm install`
8. Click **Deploy**
9. Sau khi deploy xong, lấy Project ID như trên

#### 1.4 VERCEL_USER_WEB_PROJECT_ID

**Cách lấy:**

- Tương tự như `VERCEL_ADMIN_WEB_PROJECT_ID`
- Tạo project cho `user-web` folder
- Root Directory: `user-web`
- Thêm vào GitHub Secret: `VERCEL_USER_WEB_PROJECT_ID`

#### 1.5 BACKEND_API_URL

**Cách lấy:**

1. Sau khi deploy Backend lên Render (xem phần Render bên dưới)
2. Vào Render Dashboard → Backend Service
3. Copy **Service URL** (ví dụ: `https://restaurant-api.onrender.com`)
4. Thêm `/api` vào cuối: `https://restaurant-api.onrender.com/api`
5. Thêm vào GitHub Secret: `BACKEND_API_URL`

**Format:**

```
https://your-backend-service.onrender.com/api
```

#### 1.6 BACKEND_WS_URL

**Cách lấy:**

1. Lấy từ Backend Service URL trên Render
2. Thay `https://` thành `wss://` và bỏ `/api`
3. Ví dụ: `wss://restaurant-api.onrender.com`
4. Thêm vào GitHub Secret: `BACKEND_WS_URL`

**Format:**

```
wss://your-backend-service.onrender.com
```

---

### Render Secrets

#### 2.1 RENDER_API_KEY

**Cách lấy:**

1. Đăng nhập Render Dashboard: https://dashboard.render.com
2. Click vào avatar/username ở góc trên bên phải
3. Chọn **Account Settings**
4. Vào tab **API Keys**
5. Click **Create API Key**
6. Đặt tên (ví dụ: `GitHub Actions CI/CD`)
7. Click **Create API Key**
8. **Copy API key ngay lập tức** (chỉ hiển thị 1 lần)
9. Thêm vào GitHub Secret: `RENDER_API_KEY`

**Lưu ý:**

- API key có format: `rnd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Không share API key này
- Nếu bị lộ, xóa và tạo mới

#### 2.2 RENDER_BACKEND_SERVICE_ID

**Cách lấy:**

1. Tạo Backend Service trên Render (xem phần tạo service bên dưới)
2. Vào Backend Service
3. Click **Settings** tab
4. Scroll xuống phần **Service Details**
5. Copy **Service ID** (format: `srv-xxxxxxxxxxxxx`)
6. Thêm vào GitHub Secret: `RENDER_BACKEND_SERVICE_ID`

#### 2.3 RENDER_CHATBOT_SERVICE_ID

**Cách lấy:**

- Tương tự như `RENDER_BACKEND_SERVICE_ID`
- Tạo Chatbot Service trên Render
- Thêm vào GitHub Secret: `RENDER_CHATBOT_SERVICE_ID`

#### 2.4 CHATBOT_URL

**Cách lấy:**

1. Sau khi deploy Chatbot lên Render
2. Vào Chatbot Service trên Render Dashboard
3. Copy **Service URL** (ví dụ: `https://restaurant-chatbot.onrender.com`)
4. Thêm `/api` vào cuối: `https://restaurant-chatbot.onrender.com/api`
5. Thêm vào GitHub Secret: `CHATBOT_URL`

**Format:**

```
https://your-chatbot-service.onrender.com/api
```

#### 2.5 GEMINI_API_KEY

**Cách lấy:**

1. Truy cập: https://makersuite.google.com/app/apikey
2. Đăng nhập với Google Account
3. Click **Create API Key**
4. Copy API key
5. Thêm vào GitHub Secret: `GEMINI_API_KEY`

**Lưu ý:**

- API key có format: `AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Có thể cần enable Google AI API trong Google Cloud Console

---

## 🔹 2. Render Environment Variables

### Backend Service (be_restaurant)

#### Cách Set Environment Variables trên Render:

1. Vào Render Dashboard → Backend Service
2. Click **Environment** tab
3. Click **Add Environment Variable**
4. Thêm từng biến một:

#### Danh Sách Biến Cần Set:

| Biến                          | Giá Trị                                                              | Cách Lấy                                                                   |
| ----------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `NODE_ENV`                    | `production`                                                         | -                                                                          |
| `PORT`                        | `8080` hoặc để Render tự set                                         | Render tự động set, nhưng có thể override                                  |
| `CORS_ORIGIN`                 | `*` hoặc danh sách domains                                           | Ví dụ: `https://admin-restaurant.vercel.app,https://restaurant.vercel.app` |
| `DB_HOST`                     | Database host                                                        | Từ Render PostgreSQL service (xem bên dưới)                                |
| `DB_PORT`                     | `5432`                                                               | PostgreSQL port                                                            |
| `DB_NAME`                     | Database name                                                        | Từ Render PostgreSQL service                                               |
| `DB_USER`                     | Database user                                                        | Từ Render PostgreSQL service                                               |
| `DB_PASSWORD`                 | Database password                                                    | Từ Render PostgreSQL service                                               |
| `DB_POOL_MAX`                 | `5`                                                                  | -                                                                          |
| `DB_POOL_MIN`                 | `0`                                                                  | -                                                                          |
| `DB_POOL_ACQUIRE`             | `30000`                                                              | -                                                                          |
| `DB_POOL_IDLE`                | `10000`                                                              | -                                                                          |
| `JWT_SECRET`                  | Random string                                                        | Generate: `openssl rand -base64 32`                                        |
| `JWT_EXPIRES_IN`              | `7d`                                                                 | -                                                                          |
| `CLOUDINARY_CLOUD_NAME`       | Cloudinary name                                                      | Từ Cloudinary Dashboard                                                    |
| `CLOUDINARY_API_KEY`          | Cloudinary key                                                       | Từ Cloudinary Dashboard                                                    |
| `CLOUDINARY_API_SECRET`       | Cloudinary secret                                                    | Từ Cloudinary Dashboard                                                    |
| `VNPAY_TMN_CODE`              | VNPay TMN code                                                       | Từ VNPay Dashboard                                                         |
| `VNPAY_HASH_SECRET`           | VNPay hash secret                                                    | Từ VNPay Dashboard                                                         |
| `VNP_URL`                     | `https://www.vnpayment.vn/paymentv2/vpcpay.html`                     | Production URL                                                             |
| `VNP_RETURN_URL`              | `https://your-user-web.vercel.app/api/payments/vnpay/return`         | Sau khi deploy frontend                                                    |
| `VNP_RETURN_URL_APP_USER`     | `https://your-user-web.vercel.app/api/app_user/payment/vnpay/return` | Sau khi deploy frontend                                                    |
| `CLIENT_URL`                  | `https://your-user-web.vercel.app`                                   | Sau khi deploy frontend                                                    |
| `CLIENT_ADMIN_URL`            | `https://your-admin-web.vercel.app`                                  | Sau khi deploy frontend                                                    |
| `CLIENT_USER_URL`             | `https://your-user-web.vercel.app`                                   | Sau khi deploy frontend                                                    |
| `CHATBOT_URL`                 | `https://your-chatbot.onrender.com/api`                              | Sau khi deploy chatbot                                                     |
| `CHATBOT_TIMEOUT`             | `10000`                                                              | -                                                                          |
| `UPLOAD_DIR`                  | `uploads/`                                                           | -                                                                          |
| `UPLOAD_MAX_SIZE`             | `5242880`                                                            | -                                                                          |
| `RESERVATION_TIMEOUT_MINUTES` | `15`                                                                 | -                                                                          |
| `DEBUG_SQL`                   | `false`                                                              | -                                                                          |

#### Tạo PostgreSQL Database trên Render:

1. Vào Render Dashboard
2. Click **New +** → **PostgreSQL**
3. Đặt tên database (ví dụ: `restaurant-db`)
4. Chọn **Database** plan (Free tier available)
5. Chọn **Region** (gần nhất với backend service)
6. Click **Create Database**
7. Đợi database được tạo (1-2 phút)
8. Vào database → **Connections** tab
9. Copy các thông tin:
   - **Hostname** → `DB_HOST`
   - **Port** → `DB_PORT` (thường là 5432)
   - **Database** → `DB_NAME`
   - **User** → `DB_USER`
   - **Password** → `DB_PASSWORD` (click **Show** để xem)

**Lưu ý:**

- Render PostgreSQL dùng port 5432 (không phải 3306 như MySQL)
- Cần update code để support PostgreSQL nếu đang dùng MySQL

### Chatbot Service

| Biến               | Giá Trị                                 | Cách Lấy                 |
| ------------------ | --------------------------------------- | ------------------------ |
| `BE_URL`           | `https://your-backend.onrender.com/api` | Từ Backend Service URL   |
| `GEMINI_API_KEY`   | API key                                 | Từ Google Gemini Console |
| `PYTHONUNBUFFERED` | `1`                                     | -                        |

---

## 🔹 3. Vercel Environment Variables

### Admin Web Project

#### Cách Set Environment Variables trên Vercel:

1. Vào Vercel Dashboard → Admin Web Project
2. Click **Settings** tab
3. Vào **Environment Variables** section
4. Click **Add New**
5. Thêm từng biến:

#### Danh Sách Biến Cần Set:

| Biến                                   | Giá Trị                                 | Environment                      | Cách Lấy                        |
| -------------------------------------- | --------------------------------------- | -------------------------------- | ------------------------------- |
| `NEXT_PUBLIC_API_URL`                  | `https://your-backend.onrender.com/api` | Production, Preview, Development | Từ Backend Service URL          |
| `NEXT_PUBLIC_WS_URL`                   | `wss://your-backend.onrender.com`       | Production, Preview, Development | Từ Backend Service URL (wss://) |
| `NEXT_PUBLIC_API_TIMEOUT`              | `30000`                                 | Production, Preview, Development | -                               |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`    | Cloudinary name                         | Production, Preview, Development | Từ Cloudinary Dashboard         |
| `NEXT_PUBLIC_CLOUDINARY_API_KEY`       | Cloudinary key                          | Production, Preview, Development | Từ Cloudinary Dashboard         |
| `NEXT_PUBLIC_CLOUDINARY_API_SECRET`    | Cloudinary secret                       | Production, Preview, Development | Từ Cloudinary Dashboard         |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | `pbl6_CNPM_`                            | Production, Preview, Development | -                               |
| `NEXT_PUBLIC_CLOUDINARY_FOLDER`        | `pb6/`                                  | Production, Preview, Development | -                               |
| `NODE_ENV`                             | `production`                            | Production                       | -                               |

**Lưu ý:**

- Chọn **Environment** khi thêm biến (Production, Preview, Development)
- Có thể set khác nhau cho từng environment
- `NEXT_PUBLIC_*` variables sẽ được expose ra client-side

### User Web Project

| Biến                      | Giá Trị                                 | Environment                      | Cách Lấy                        |
| ------------------------- | --------------------------------------- | -------------------------------- | ------------------------------- |
| `NEXT_PUBLIC_API_URL`     | `https://your-backend.onrender.com/api` | Production, Preview, Development | Từ Backend Service URL          |
| `NEXT_PUBLIC_WS_URL`      | `wss://your-backend.onrender.com`       | Production, Preview, Development | Từ Backend Service URL (wss://) |
| `NEXT_PUBLIC_API_TIMEOUT` | `30000`                                 | Production, Preview, Development | -                               |
| `NODE_ENV`                | `production`                            | Production                       | -                               |

---

## 🔹 4. Tạo Services trên Render

### 4.1 Tạo Backend Service

1. Vào Render Dashboard
2. Click **New +** → **Web Service**
3. Connect GitHub repository
4. Chọn repository và branch (`main` hoặc `develop`)
5. Cấu hình:
   - **Name**: `restaurant-backend` (hoặc tên bạn muốn)
   - **Root Directory**: `be_restaurant`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Chọn plan phù hợp (Free tier available)
6. Click **Create Web Service**
7. Vào **Settings** → **Environment** và thêm tất cả biến như bảng trên
8. Vào **Settings** → **Service Details** để lấy Service ID

### 4.2 Tạo Chatbot Service

1. Tương tự như Backend Service
2. **Root Directory**: `chatbot`
3. **Environment**: `Docker`
4. **Dockerfile Path**: `chatbot/Dockerfile`
5. **Start Command**: (để trống, Dockerfile đã có CMD)
6. Thêm environment variables như bảng trên

---

## 🔹 5. Tạo Projects trên Vercel

### 5.1 Tạo Admin Web Project

1. Vào Vercel Dashboard
2. Click **Add New** → **Project**
3. Import Git Repository
4. Cấu hình:
   - **Root Directory**: `admin-web`
   - **Framework Preset**: `Next.js`
   - **Build Command**: `npm run build` (hoặc để mặc định)
   - **Output Directory**: `.next` (hoặc để mặc định)
   - **Install Command**: `npm install`
5. Click **Deploy**
6. Sau khi deploy, vào **Settings** → **Environment Variables** và thêm biến

### 5.2 Tạo User Web Project

- Tương tự Admin Web
- **Root Directory**: `user-web`

---

## 🔹 6. Docker Compose Environment Variables

File `docker-compose.yml` sử dụng các biến từ root `.env` file:

### Cần Tạo File `.env` ở Root:

```env
# Database (cho Docker Compose)
DB_ROOT_PASSWORD=rootpassword
DB_NAME=restaurant_db
DB_USER=restaurant_user
DB_PASSWORD=restaurant_password

# Backend
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
VNPAY_TMN_CODE=your-vnpay-code
VNPAY_HASH_SECRET=your-vnpay-secret

# Chatbot
GEMINI_API_KEY=your-gemini-key
```

**Lưu ý:**

- Docker Compose dùng các biến này cho local development
- Production deployment dùng Render/Vercel environment variables

---

## 🔹 7. Checklist Deploy

### Bước 1: Setup Render

- [ ] Tạo PostgreSQL Database trên Render
- [ ] Lấy Database credentials
- [ ] Tạo Backend Service trên Render
- [ ] Set tất cả environment variables cho Backend
- [ ] Deploy Backend và lấy Service URL
- [ ] Tạo Chatbot Service trên Render
- [ ] Set environment variables cho Chatbot
- [ ] Deploy Chatbot và lấy Service URL

### Bước 2: Setup Vercel

- [ ] Tạo Admin Web project trên Vercel
- [ ] Set environment variables cho Admin Web
- [ ] Deploy Admin Web và lấy URL
- [ ] Tạo User Web project trên Vercel
- [ ] Set environment variables cho User Web
- [ ] Deploy User Web và lấy URL

### Bước 3: Setup GitHub Secrets

- [ ] Thêm `VERCEL_TOKEN`
- [ ] Thêm `VERCEL_ORG_ID`
- [ ] Thêm `VERCEL_ADMIN_WEB_PROJECT_ID`
- [ ] Thêm `VERCEL_USER_WEB_PROJECT_ID`
- [ ] Thêm `RENDER_API_KEY`
- [ ] Thêm `RENDER_BACKEND_SERVICE_ID`
- [ ] Thêm `RENDER_CHATBOT_SERVICE_ID`
- [ ] Thêm `BACKEND_API_URL` (sau khi deploy backend)
- [ ] Thêm `BACKEND_WS_URL` (sau khi deploy backend)
- [ ] Thêm `CHATBOT_URL` (sau khi deploy chatbot)
- [ ] Thêm `GEMINI_API_KEY`

### Bước 4: Update Environment Variables

- [ ] Update `CLIENT_URL` trong Backend với User Web URL
- [ ] Update `CLIENT_ADMIN_URL` trong Backend với Admin Web URL
- [ ] Update `CLIENT_USER_URL` trong Backend với User Web URL
- [ ] Update `CHATBOT_URL` trong Backend với Chatbot URL
- [ ] Update `VNP_RETURN_URL` trong Backend với frontend URLs

### Bước 5: Test CI/CD

- [ ] Push code vào `main` branch
- [ ] Kiểm tra GitHub Actions workflows chạy
- [ ] Verify các service deploy thành công
- [ ] Test các service có thể gọi nhau

---

## 🔹 8. Thứ Tự Deploy (Quan Trọng!)

### Thứ tự đúng:

1. **Backend** → Deploy trước để có URL
2. **Chatbot** → Cần Backend URL
3. **Admin Web** → Cần Backend URL
4. **User Web** → Cần Backend URL

### Sau khi deploy xong:

1. Update `CLIENT_URL`, `CLIENT_ADMIN_URL`, `CLIENT_USER_URL` trong Backend
2. Update `CHATBOT_URL` trong Backend
3. Update `VNP_RETURN_URL` trong Backend
4. Redeploy Backend để apply các thay đổi

---

## 🔹 9. URLs Mapping Example

Sau khi deploy, bạn sẽ có URLs như sau:

```
Backend API:     https://restaurant-api.onrender.com
Backend WS:      wss://restaurant-api.onrender.com
Admin Web:       https://admin-restaurant.vercel.app
User Web:        https://restaurant.vercel.app
Chatbot:         https://restaurant-chatbot.onrender.com
```

### Cập nhật vào Environment Variables:

**Backend (Render):**

- `CLIENT_URL` = `https://restaurant.vercel.app`
- `CLIENT_ADMIN_URL` = `https://admin-restaurant.vercel.app`
- `CLIENT_USER_URL` = `https://restaurant.vercel.app`
- `CHATBOT_URL` = `https://restaurant-chatbot.onrender.com/api`
- `VNP_RETURN_URL` = `https://restaurant.vercel.app/api/payments/vnpay/return`

**Admin Web (Vercel):**

- `NEXT_PUBLIC_API_URL` = `https://restaurant-api.onrender.com/api`
- `NEXT_PUBLIC_WS_URL` = `wss://restaurant-api.onrender.com`

**User Web (Vercel):**

- `NEXT_PUBLIC_API_URL` = `https://restaurant-api.onrender.com/api`
- `NEXT_PUBLIC_WS_URL` = `wss://restaurant-api.onrender.com`

**Chatbot (Render):**

- `BE_URL` = `https://restaurant-api.onrender.com/api`

---

## 🔹 10. Troubleshooting

### Vercel Deployment Issues

**Lỗi:** `Vercel token is invalid`

- Kiểm tra token có đúng không
- Token có thể hết hạn, tạo token mới

**Lỗi:** `Project not found`

- Kiểm tra Project ID có đúng không
- Đảm bảo project đã được tạo trên Vercel

### Render Deployment Issues

**Lỗi:** `Render API key is invalid`

- Kiểm tra API key có đúng không
- Tạo API key mới nếu cần

**Lỗi:** Backend không kết nối được Database

- Kiểm tra Database credentials
- Kiểm tra Database có đang chạy không
- Kiểm tra `DB_HOST`, `DB_PORT` (5432 cho PostgreSQL)

**Lỗi:** Backend không kết nối được Chatbot

- Kiểm tra `CHATBOT_URL` có đúng không
- Kiểm tra Chatbot có đang chạy không

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cloudinary Setup](https://cloudinary.com/documentation)
- [VNPay Integration](https://sandbox.vnpayment.vn/apis/)

---

**Last Updated:** 2024-12-XX  
**Version:** 1.0.0
