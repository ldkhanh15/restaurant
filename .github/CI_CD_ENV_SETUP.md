# 🔐 CI/CD Environment Variables & Secrets Setup Guide

Hướng dẫn chi tiết về cách cấu hình tất cả secrets và environment variables cho hệ thống CI/CD.

## 📋 Mục lục

1. [GitHub Secrets](#github-secrets)
2. [Vercel Environment Variables](#vercel-environment-variables)
3. [Render Environment Variables](#render-environment-variables)
4. [EC2 Environment Variables](#ec2-environment-variables)
5. [Service URLs Mapping](#service-urls-mapping)
6. [Quick Setup Checklist](#quick-setup-checklist)

---

## 🔑 GitHub Secrets

Các secrets này cần được thêm vào **GitHub Repository Settings → Secrets and variables → Actions**.

### Vercel Secrets (cho Admin Web & User Web)

| Secret Name                   | Mô tả                    | Cách lấy                                                               | Required |
| ----------------------------- | ------------------------ | ---------------------------------------------------------------------- | -------- |
| `VERCEL_TOKEN`                | Vercel API token         | Vercel Dashboard → Settings → Tokens → Create Token                    | ✅       |
| `VERCEL_ORG_ID`               | Vercel Organization ID   | Vercel Dashboard → Settings → General → Organization ID                | ✅       |
| `VERCEL_ADMIN_WEB_PROJECT_ID` | Project ID của Admin Web | Vercel Dashboard → Admin Web Project → Settings → General → Project ID | ✅       |
| `VERCEL_USER_WEB_PROJECT_ID`  | Project ID của User Web  | Vercel Dashboard → User Web Project → Settings → General → Project ID  | ✅       |
| `BACKEND_API_URL`             | Backend API URL          | URL của backend đã deploy (e.g., `https://your-backend.onrender.com`)  | ✅       |
| `BACKEND_WS_URL`              | Backend WebSocket URL    | WebSocket URL của backend (e.g., `wss://your-backend.onrender.com`)    | ✅       |

**Cách lấy Vercel Token:**

1. Đăng nhập Vercel Dashboard: https://vercel.com/dashboard
2. Vào Settings → Tokens
3. Click "Create Token"
4. Đặt tên token (ví dụ: "GitHub Actions")
5. Copy token và paste vào GitHub Secret

**Cách lấy Project ID:**

1. Vào project trên Vercel Dashboard
2. Vào Settings → General
3. Copy "Project ID" (format: `prj_xxxxxxxxxxxxx`)

### Render Secrets (cho Backend & Chatbot)

| Secret Name                 | Mô tả                  | Cách lấy                                                              | Required |
| --------------------------- | ---------------------- | --------------------------------------------------------------------- | -------- |
| `RENDER_API_KEY`            | Render API key         | Render Dashboard → Account Settings → API Keys → Create API Key       | ✅       |
| `RENDER_BACKEND_SERVICE_ID` | Service ID của Backend | Render Dashboard → Backend Service → Settings → Service ID            | ✅       |
| `RENDER_CHATBOT_SERVICE_ID` | Service ID của Chatbot | Render Dashboard → Chatbot Service → Settings → Service ID            | ✅       |
| `CHATBOT_URL`               | Chatbot API URL        | URL của chatbot đã deploy (e.g., `https://your-chatbot.onrender.com`) | ✅       |
| `GEMINI_API_KEY`            | Google Gemini API Key  | https://makersuite.google.com/app/apikey                              | ✅       |

**Cách lấy Render API Key:**

1. Đăng nhập Render Dashboard: https://dashboard.render.com
2. Vào Account Settings → API Keys
3. Click "Create API Key"
4. Copy API key và paste vào GitHub Secret

**Cách lấy Service ID:**

1. Vào service trên Render Dashboard
2. Vào Settings
3. Copy "Service ID" (format: `srv-xxxxxxxxxxxxx`)

### EC2 Secrets (cho Chatbot EC2 deployment - Optional)

| Secret Name       | Mô tả                       | Cách lấy                                       | Required |
| ----------------- | --------------------------- | ---------------------------------------------- | -------- |
| `EC2_SERVER_IP`   | IP address của EC2 instance | AWS EC2 Dashboard → Instances → Copy Public IP | ⚠️       |
| `EC2_SERVER_USER` | SSH username                | Thường là `ubuntu`, `ec2-user`, hoặc `admin`   | ⚠️       |
| `EC2_SSH_KEY`     | SSH private key             | Private key file (.pem) từ AWS EC2             | ⚠️       |
| `EC2_SSH_PORT`    | SSH port (optional)         | Mặc định: 22                                   | ❌       |

**Cách lấy SSH Key:**

1. Tải .pem file từ AWS EC2 khi tạo instance
2. Copy toàn bộ nội dung file .pem (bao gồm `-----BEGIN RSA PRIVATE KEY-----` và `-----END RSA PRIVATE KEY-----`)
3. Paste vào GitHub Secret `EC2_SSH_KEY`

---

## 🌐 Vercel Environment Variables

Các biến môi trường này cần được set trong **Vercel Dashboard** cho mỗi project.

### Admin Web (Vercel)

Vào **Admin Web Project → Settings → Environment Variables**

| Variable Name         | Value Example                           | Environment | Required |
| --------------------- | --------------------------------------- | ----------- | -------- |
| `NEXT_PUBLIC_API_URL` | `https://your-backend.onrender.com/api` | Production  | ✅       |
| `NEXT_PUBLIC_WS_URL`  | `wss://your-backend.onrender.com`       | Production  | ✅       |
| `NODE_ENV`            | `production`                            | Production  | ✅       |

### User Web (Vercel)

Vào **User Web Project → Settings → Environment Variables**

| Variable Name         | Value Example                           | Environment | Required |
| --------------------- | --------------------------------------- | ----------- | -------- |
| `NEXT_PUBLIC_API_URL` | `https://your-backend.onrender.com/api` | Production  | ✅       |
| `NEXT_PUBLIC_WS_URL`  | `wss://your-backend.onrender.com`       | Production  | ✅       |
| `NODE_ENV`            | `production`                            | Production  | ✅       |

**Lưu ý:**

- Các biến `NEXT_PUBLIC_*` sẽ được expose ra client-side
- Đảm bảo không đặt sensitive data vào `NEXT_PUBLIC_*` variables

---

## 🖥️ Render Environment Variables

Các biến môi trường này cần được set trong **Render Dashboard** cho mỗi service.

### Backend (Render)

Vào **Backend Service → Environment**

| Variable Name           | Value Example                                    | Required | Notes                                          |
| ----------------------- | ------------------------------------------------ | -------- | ---------------------------------------------- |
| `NODE_ENV`              | `production`                                     | ✅       |                                                |
| `PORT`                  | `8080` hoặc port Render cung cấp                 | ✅       | Render tự động set PORT, nhưng có thể override |
| `DB_HOST`               | `your-db-host.onrender.com`                      | ✅       | Render PostgreSQL host                         |
| `DB_PORT`               | `5432`                                           | ✅       | PostgreSQL port                                |
| `DB_NAME`               | `restaurant_db`                                  | ✅       |                                                |
| `DB_USER`               | `restaurant_user`                                | ✅       |                                                |
| `DB_PASSWORD`           | `your-secure-password`                           | ✅       | Strong password                                |
| `JWT_SECRET`            | `your-super-secret-jwt-key`                      | ✅       | Generate với: `openssl rand -base64 32`        |
| `JWT_EXPIRES_IN`        | `7d`                                             | ✅       |                                                |
| `CLOUDINARY_CLOUD_NAME` | `your-cloudinary-name`                           | ✅       | Từ Cloudinary Dashboard                        |
| `CLOUDINARY_API_KEY`    | `your-cloudinary-key`                            | ✅       | Từ Cloudinary Dashboard                        |
| `CLOUDINARY_API_SECRET` | `your-cloudinary-secret`                         | ✅       | Từ Cloudinary Dashboard                        |
| `VNPAY_TMN_CODE`        | `your-vnpay-tmn-code`                            | ✅       | Từ VNPay Dashboard                             |
| `VNPAY_HASH_SECRET`     | `your-vnpay-hash-secret`                         | ✅       | Từ VNPay Dashboard                             |
| `VNP_URL`               | `https://www.vnpayment.vn/paymentv2/vpcpay.html` | ✅       | Production URL                                 |
| `CLIENT_URL`            | `https://your-user-web.vercel.app`               | ✅       | Frontend URL cho CORS                          |
| `CHATBOT_URL`           | `https://your-chatbot.onrender.com/api`          | ✅       | Chatbot API URL                                |

**Lưu ý về Database:**

- Render cung cấp PostgreSQL miễn phí
- Nếu dùng MySQL, cần external MySQL service (e.g., PlanetScale, AWS RDS)
- Update `DB_PORT` thành `3306` nếu dùng MySQL

### Chatbot (Render)

Vào **Chatbot Service → Environment**

| Variable Name      | Value Example                           | Required | Notes                    |
| ------------------ | --------------------------------------- | -------- | ------------------------ |
| `BE_URL`           | `https://your-backend.onrender.com/api` | ✅       | Backend API URL          |
| `GEMINI_API_KEY`   | `your-gemini-api-key`                   | ✅       | Từ Google Gemini Console |
| `PYTHONUNBUFFERED` | `1`                                     | ✅       | Cho Docker logging       |

---

## 🖥️ EC2 Environment Variables

Nếu deploy chatbot lên EC2, tạo file `.env` trong thư mục `chatbot/` trên EC2 server:

```bash
BE_URL=https://your-backend.onrender.com/api
GEMINI_API_KEY=your-gemini-api-key
PYTHONUNBUFFERED=1
```

Workflow sẽ tự động tạo file này khi deploy.

---

## 🔗 Service URLs Mapping

Sau khi deploy, các service sẽ có URLs như sau. Cập nhật các URLs này vào environment variables của các service khác.

### Ví dụ Service URLs

```
Backend API:     https://restaurant-api.onrender.com
Backend WS:      wss://restaurant-api.onrender.com
Admin Web:       https://admin-restaurant.vercel.app
User Web:        https://restaurant.vercel.app
Chatbot:         https://restaurant-chatbot.onrender.com
```

### Mapping Dependencies

```
┌─────────────┐
│  Admin Web  │ ──→ Backend API (NEXT_PUBLIC_API_URL)
│  (Vercel)   │ ──→ Backend WS (NEXT_PUBLIC_WS_URL)
└─────────────┘

┌─────────────┐
│  User Web   │ ──→ Backend API (NEXT_PUBLIC_API_URL)
│  (Vercel)   │ ──→ Backend WS (NEXT_PUBLIC_WS_URL)
└─────────────┘

┌─────────────┐
│   Backend   │ ──→ Database (DB_HOST, DB_PORT, etc.)
│  (Render)   │ ──→ Chatbot (CHATBOT_URL)
│             │ ──→ Cloudinary (CLOUDINARY_*)
│             │ ──→ VNPay (VNPAY_*)
└─────────────┘

┌─────────────┐
│  Chatbot    │ ──→ Backend API (BE_URL)
│ (Render/EC2)│ ──→ Gemini API (GEMINI_API_KEY)
└─────────────┘
```

---

## ✅ Quick Setup Checklist

### Bước 1: Deploy Backend trước

- [ ] Tạo Backend service trên Render
- [ ] Tạo Database trên Render (PostgreSQL)
- [ ] Set tất cả environment variables cho Backend trên Render
- [ ] Deploy Backend và lấy URL (e.g., `https://your-backend.onrender.com`)
- [ ] Test Backend API hoạt động

### Bước 2: Deploy Chatbot

- [ ] Tạo Chatbot service trên Render (hoặc setup EC2)
- [ ] Set `BE_URL` = Backend API URL
- [ ] Set `GEMINI_API_KEY`
- [ ] Deploy Chatbot và lấy URL
- [ ] Update `CHATBOT_URL` trong Backend environment variables

### Bước 3: Deploy Frontend (Admin Web & User Web)

- [ ] Tạo Admin Web project trên Vercel
- [ ] Set `NEXT_PUBLIC_API_URL` = Backend API URL
- [ ] Set `NEXT_PUBLIC_WS_URL` = Backend WebSocket URL
- [ ] Deploy Admin Web

- [ ] Tạo User Web project trên Vercel
- [ ] Set `NEXT_PUBLIC_API_URL` = Backend API URL
- [ ] Set `NEXT_PUBLIC_WS_URL` = Backend WebSocket URL
- [ ] Deploy User Web

### Bước 4: Cấu hình GitHub Secrets

- [ ] Thêm `VERCEL_TOKEN`
- [ ] Thêm `VERCEL_ORG_ID`
- [ ] Thêm `VERCEL_ADMIN_WEB_PROJECT_ID`
- [ ] Thêm `VERCEL_USER_WEB_PROJECT_ID`
- [ ] Thêm `RENDER_API_KEY`
- [ ] Thêm `RENDER_BACKEND_SERVICE_ID`
- [ ] Thêm `RENDER_CHATBOT_SERVICE_ID`
- [ ] Thêm `BACKEND_API_URL` (URL của Backend đã deploy)
- [ ] Thêm `BACKEND_WS_URL` (WebSocket URL của Backend)
- [ ] Thêm `CHATBOT_URL` (URL của Chatbot đã deploy)
- [ ] Thêm `GEMINI_API_KEY` (nếu cần cho workflow)

### Bước 5: Test CI/CD

- [ ] Push code vào `main` hoặc `develop` branch
- [ ] Kiểm tra GitHub Actions workflows chạy thành công
- [ ] Verify các service deploy đúng
- [ ] Test các service có thể gọi nhau

---

## 🔍 Troubleshooting

### Vercel Deployment Issues

**Lỗi:** `Vercel token is invalid`

- Kiểm tra `VERCEL_TOKEN` có đúng không
- Token có thể hết hạn, tạo token mới

**Lỗi:** `Project not found`

- Kiểm tra `VERCEL_PROJECT_ID` có đúng không
- Đảm bảo project đã được tạo trên Vercel

**Lỗi:** Frontend không kết nối được Backend

- Kiểm tra `NEXT_PUBLIC_API_URL` có đúng không
- Kiểm tra Backend có CORS cho phép frontend domain không
- Kiểm tra Backend có đang chạy không

### Render Deployment Issues

**Lỗi:** `Render API key is invalid`

- Kiểm tra `RENDER_API_KEY` có đúng không
- Tạo API key mới nếu cần

**Lỗi:** `Service not found`

- Kiểm tra `RENDER_SERVICE_ID` có đúng không
- Đảm bảo service đã được tạo trên Render

**Lỗi:** Backend không kết nối được Database

- Kiểm tra Database credentials trong Render Dashboard
- Kiểm tra Database có đang chạy không
- Kiểm tra `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

**Lỗi:** Backend không kết nối được Chatbot

- Kiểm tra `CHATBOT_URL` có đúng không
- Kiểm tra Chatbot có đang chạy không
- Kiểm tra Chatbot có thể truy cập được từ internet không

### EC2 Deployment Issues

**Lỗi:** `SSH connection failed`

- Kiểm tra `EC2_SSH_KEY` format (phải có newlines)
- Kiểm tra Security Group cho phép SSH (port 22)
- Kiểm tra `EC2_SERVER_IP` và `EC2_SERVER_USER`
- Kiểm tra EC2 instance có đang chạy không

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Render Environment Variables](https://render.com/docs/environment-variables)
- [VNPay Integration Guide](https://sandbox.vnpayment.vn/apis/)
- [Cloudinary Setup](https://cloudinary.com/documentation)

---

**Last Updated:** 2024-12-XX  
**Version:** 1.0.0
