# 🚀 CI/CD Guide - Restaurant Management System

Hướng dẫn chi tiết về hệ thống CI/CD hybrid cho dự án Restaurant Management System.

## 📋 Tổng quan

Hệ thống CI/CD của chúng ta sử dụng **GitHub Actions** để tự động hóa build và deployment cho các service:

| Service     | Platform       | Workflow File          | Trigger                     |
| ----------- | -------------- | ---------------------- | --------------------------- |
| Admin Web   | Vercel         | `deploy-admin-web.yml` | Push vào `admin-web/**`     |
| User Web    | Vercel         | `deploy-user-web.yml`  | Push vào `user-web/**`      |
| Backend     | Render         | `deploy-backend.yml`   | Push vào `be_restaurant/**` |
| Chatbot     | Render/EC2     | `deploy-chatbot.yml`   | Push vào `chatbot/**`       |
| Mobile Apps | GitHub Actions | `build-mobile.yml`     | Tag release `v*`            |

---

## 🔐 1. Cấu hình Secrets trên GitHub

### Bước 1: Truy cập GitHub Secrets

1. Vào repository trên GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Bước 2: Thêm các Secrets cần thiết

#### 🔵 Vercel Secrets (cho Admin Web & User Web)

| Secret Name                   | Mô tả                    | Cách lấy                                                               |
| ----------------------------- | ------------------------ | ---------------------------------------------------------------------- |
| `VERCEL_TOKEN`                | Vercel API token         | Vercel Dashboard → Settings → Tokens → Create Token                    |
| `VERCEL_ORG_ID`               | Vercel Organization ID   | Vercel Dashboard → Settings → General → Organization ID                |
| `VERCEL_ADMIN_WEB_PROJECT_ID` | Project ID của Admin Web | Vercel Dashboard → Admin Web Project → Settings → General → Project ID |
| `VERCEL_USER_WEB_PROJECT_ID`  | Project ID của User Web  | Vercel Dashboard → User Web Project → Settings → General → Project ID  |

**Cách lấy Vercel Token:**

```
1. Đăng nhập Vercel Dashboard: https://vercel.com/dashboard
2. Vào Settings → Tokens
3. Click "Create Token"
4. Đặt tên token (ví dụ: "GitHub Actions")
5. Copy token và paste vào GitHub Secret
```

**Cách lấy Project ID:**

```
1. Vào project trên Vercel Dashboard
2. Vào Settings → General
3. Copy "Project ID" (format: prj_xxxxxxxxxxxxx)
```

#### 🟣 Render Secrets (cho Backend & Chatbot)

| Secret Name                 | Mô tả                  | Cách lấy                                                        |
| --------------------------- | ---------------------- | --------------------------------------------------------------- |
| `RENDER_API_KEY`            | Render API key         | Render Dashboard → Account Settings → API Keys → Create API Key |
| `RENDER_BACKEND_SERVICE_ID` | Service ID của Backend | Render Dashboard → Backend Service → Settings → Service ID      |
| `RENDER_CHATBOT_SERVICE_ID` | Service ID của Chatbot | Render Dashboard → Chatbot Service → Settings → Service ID      |

**Cách lấy Render API Key:**

```
1. Đăng nhập Render Dashboard: https://dashboard.render.com
2. Vào Account Settings → API Keys
3. Click "Create API Key"
4. Copy API key và paste vào GitHub Secret
```

**Cách lấy Service ID:**

```
1. Vào service trên Render Dashboard
2. Vào Settings
3. Copy "Service ID" (format: srv-xxxxxxxxxxxxx)
```

#### 🟡 Expo Secrets (cho Admin App)

| Secret Name  | Mô tả             | Cách lấy                                                         |
| ------------ | ----------------- | ---------------------------------------------------------------- |
| `EXPO_TOKEN` | Expo access token | Expo Dashboard → Account Settings → Access Tokens → Create Token |

**Cách lấy Expo Token:**

```
1. Đăng nhập Expo Dashboard: https://expo.dev
2. Vào Account Settings → Access Tokens
3. Click "Create Token"
4. Copy token và paste vào GitHub Secret
```

#### 🟢 Android Signing Secrets (cho Flutter App)

| Secret Name                 | Mô tả                       | Cách tạo                          |
| --------------------------- | --------------------------- | --------------------------------- |
| `ANDROID_KEYSTORE_BASE64`   | Base64 encoded keystore.jks | Xem hướng dẫn bên dưới            |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password           | Password bạn đặt khi tạo keystore |
| `ANDROID_KEY_PASSWORD`      | Key password                | Password bạn đặt khi tạo key      |
| `ANDROID_KEY_ALIAS`         | Key alias                   | Alias bạn đặt khi tạo keystore    |

**Cách tạo Android Keystore:**

```bash
# Tạo keystore
keytool -genkeypair -v -storetype PKCS12 -keystore keystore.jks \
  -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Convert keystore to base64 (Linux/Mac)
base64 -i keystore.jks | pbcopy

# Convert keystore to base64 (Windows PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("keystore.jks"))
```

**Lưu ý:**

- Không commit keystore.jks vào git
- Lưu trữ keystore ở nơi an toàn
- Ghi nhớ passwords và alias

#### 🔴 EC2 Secrets (cho Chatbot EC2 deployment)

| Secret Name       | Mô tả                       | Cách lấy                                       |
| ----------------- | --------------------------- | ---------------------------------------------- |
| `EC2_SERVER_IP`   | IP address của EC2 instance | AWS EC2 Dashboard → Instances → Copy Public IP |
| `EC2_SERVER_USER` | SSH username                | Thường là `ubuntu`, `ec2-user`, hoặc `admin`   |
| `EC2_SSH_KEY`     | SSH private key             | Private key file (.pem) từ AWS EC2             |
| `EC2_SSH_PORT`    | SSH port (optional)         | Mặc định: 22                                   |

**Cách lấy SSH Key:**

```
1. Tải .pem file từ AWS EC2 khi tạo instance
2. Copy toàn bộ nội dung file .pem
3. Paste vào GitHub Secret EC2_SSH_KEY
```

---

## 🚀 2. Cấu hình từng Service

### 2.1 Admin Web (Vercel)

#### Thiết lập ban đầu trên Vercel:

1. **Tạo project trên Vercel:**

   ```bash
   cd admin-web
   npm install -g vercel
   vercel login
   vercel link
   ```

2. **Lấy Project ID:**

   - Vào Vercel Dashboard → Project → Settings → General
   - Copy Project ID

3. **Thêm Secrets vào GitHub:**
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_ADMIN_WEB_PROJECT_ID`

#### Workflow tự động:

- **Trigger:** Push vào `main` hoặc `develop` với thay đổi trong `admin-web/**`
- **Actions:**
  1. Checkout code
  2. Setup Node.js 20
  3. Install Vercel CLI
  4. Build và deploy lên Vercel

### 2.2 User Web (Vercel)

Tương tự Admin Web, nhưng dùng:

- `VERCEL_USER_WEB_PROJECT_ID` thay vì `VERCEL_ADMIN_WEB_PROJECT_ID`
- Trigger khi có thay đổi trong `user-web/**`

### 2.3 Backend (Render)

#### Thiết lập ban đầu trên Render:

1. **Tạo Web Service trên Render:**

   - Vào Render Dashboard → New → Web Service
   - Connect GitHub repository
   - Chọn `be_restaurant` folder
   - Build command: `npm run build`
   - Start command: `npm start`
   - Environment: `Node`

2. **Lấy Service ID:**

   - Vào Service → Settings
   - Copy Service ID

3. **Thêm Secrets vào GitHub:**
   - `RENDER_API_KEY`
   - `RENDER_BACKEND_SERVICE_ID`

#### Workflow tự động:

- **Trigger:** Push vào `main` hoặc `develop` với thay đổi trong `be_restaurant/**`
- **Actions:**
  1. Build và test (nếu có)
  2. Build Docker image
  3. Push image lên GitHub Container Registry
  4. Deploy lên Render

### 2.4 Chatbot (Render/EC2)

#### Option 1: Deploy lên Render

1. **Tạo Web Service trên Render:**

   - Tương tự Backend
   - Chọn `chatbot` folder
   - Build command: `docker build -t chatbot .`
   - Start command: `docker run chatbot`

2. **Thêm Secrets:**
   - `RENDER_API_KEY`
   - `RENDER_CHATBOT_SERVICE_ID`

#### Option 2: Deploy lên EC2

1. **Setup EC2 instance:**

   ```bash
   # SSH vào EC2
   ssh -i your-key.pem ubuntu@your-ec2-ip

   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh

   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose

   # Create project directory
   mkdir -p /opt/restaurant
   ```

2. **Thêm Secrets:**
   - `EC2_SERVER_IP`
   - `EC2_SERVER_USER`
   - `EC2_SSH_KEY`
   - `EC2_SSH_PORT` (optional)

#### Workflow tự động:

- **Trigger:** Push vào `main` hoặc `develop` với thay đổi trong `chatbot/**`
- **Manual trigger:** Có thể chọn deploy Render hoặc EC2
- **Actions:**
  1. Build Docker image
  2. Push image lên registry
  3. Deploy lên Render (hoặc EC2 qua SSH)

### 2.5 Mobile Apps

#### Flutter App (user-app)

**Thêm Secrets:**

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_PASSWORD`
- `ANDROID_KEY_ALIAS`

**Workflow tự động:**

- **Trigger:** Khi tạo tag release `v*` (ví dụ: `v1.0.0`)
- **Actions:**
  1. Build Flutter APK (release)
  2. Build Flutter AAB (cho Play Store)
  3. Upload artifacts lên GitHub
  4. Tạo GitHub Release

#### Expo App (admin-app)

**Thêm Secrets:**

- `EXPO_TOKEN`

**Thiết lập EAS Build:**

1. **Cài đặt EAS CLI:**

   ```bash
   cd admin-app
   npm install -g eas-cli
   eas login
   ```

2. **Cấu hình EAS:**

   ```bash
   eas build:configure
   ```

3. **Tạo file `eas.json` (nếu chưa có):**
   ```json
   {
     "cli": {
       "version": ">= 3.0.0"
     },
     "build": {
       "production": {
         "android": {
           "buildType": "apk"
         }
       }
     }
   }
   ```

**Workflow tự động:**

- **Trigger:** Khi tạo tag release `v*`
- **Actions:**
  1. Build Android APK với EAS
  2. Build iOS với EAS (nếu được enable)
  3. Tạo GitHub Release

---

## 🎯 3. Trigger Workflows

### 3.1 Tự động (Automatic)

- **Push vào main/develop:** Workflows tự động chạy khi có thay đổi trong thư mục tương ứng
- **Tag release:** Workflow `build-mobile.yml` tự động chạy khi tạo tag `v*`

### 3.2 Thủ công (Manual)

1. Vào **Actions** tab trên GitHub
2. Chọn workflow muốn chạy
3. Click **Run workflow**
4. Chọn branch và options (nếu có)
5. Click **Run workflow**

### 3.3 Tạo Tag Release

```bash
# Tạo tag mới
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tag lên GitHub
git push origin v1.0.0
```

Sau khi push tag, workflow `build-mobile.yml` sẽ tự động chạy.

---

## 📊 4. Monitoring & Debugging

### 4.1 Xem Logs

1. Vào **Actions** tab trên GitHub
2. Click vào workflow run muốn xem
3. Click vào job để xem chi tiết logs

### 4.2 Common Issues

#### Vercel Deployment Fails

**Lỗi:** `Vercel token is invalid`

**Giải pháp:**

- Kiểm tra `VERCEL_TOKEN` có đúng không
- Token có thể hết hạn, tạo token mới

**Lỗi:** `Project not found`

**Giải pháp:**

- Kiểm tra `VERCEL_PROJECT_ID` có đúng không
- Đảm bảo project đã được tạo trên Vercel

#### Render Deployment Fails

**Lỗi:** `Render API key is invalid`

**Giải pháp:**

- Kiểm tra `RENDER_API_KEY` có đúng không
- Tạo API key mới nếu cần

**Lỗi:** `Service not found`

**Giải pháp:**

- Kiểm tra `RENDER_SERVICE_ID` có đúng không
- Đảm bảo service đã được tạo trên Render

#### Mobile Build Fails

**Lỗi:** `Flutter build failed`

**Giải pháp:**

- Kiểm tra Flutter version trong workflow
- Kiểm tra dependencies trong `pubspec.yaml`

**Lỗi:** `EAS build failed`

**Giải pháp:**

- Kiểm tra `EXPO_TOKEN` có hợp lệ không
- Kiểm tra `eas.json` configuration
- Xem logs trên EAS Dashboard

#### EC2 Deployment Fails

**Lỗi:** `SSH connection failed`

**Giải pháp:**

- Kiểm tra `EC2_SSH_KEY` format (phải có newlines)
- Kiểm tra Security Group cho phép SSH (port 22)
- Kiểm tra `EC2_SERVER_IP` và `EC2_SERVER_USER`

---

## 🔔 5. Badges & Status

### Thêm Badges vào README

Thêm các badges sau vào README.md:

```markdown
## 🚀 CI/CD Status

[![Deploy Admin Web](https://github.com/your-username/your-repo/actions/workflows/deploy-admin-web.yml/badge.svg)](https://github.com/your-username/your-repo/actions/workflows/deploy-admin-web.yml)
[![Deploy User Web](https://github.com/your-username/your-repo/actions/workflows/deploy-user-web.yml/badge.svg)](https://github.com/your-username/your-repo/actions/workflows/deploy-user-web.yml)
[![Deploy Backend](https://github.com/your-username/your-repo/actions/workflows/deploy-backend.yml/badge.svg)](https://github.com/your-username/your-repo/actions/workflows/deploy-backend.yml)
[![Deploy Chatbot](https://github.com/your-username/your-repo/actions/workflows/deploy-chatbot.yml/badge.svg)](https://github.com/your-username/your-repo/actions/workflows/deploy-chatbot.yml)
[![Build Mobile](https://github.com/your-username/your-repo/actions/workflows/build-mobile.yml/badge.svg)](https://github.com/your-username/your-repo/actions/workflows/build-mobile.yml)
```

Thay `your-username` và `your-repo` bằng thông tin repository của bạn.

---

## 📝 6. Best Practices

### 6.1 Security

- ✅ **Không commit secrets vào git**
- ✅ Sử dụng GitHub Secrets cho tất cả sensitive data
- ✅ Rotate secrets định kỳ
- ✅ Sử dụng least privilege principle cho API keys

### 6.2 Performance

- ✅ Cache dependencies (npm, pip, Flutter)
- ✅ Sử dụng Docker layer caching
- ✅ Parallel jobs khi có thể

### 6.3 Monitoring

- ✅ Setup notifications cho failed builds
- ✅ Monitor deployment times
- ✅ Track build success rates

### 6.4 Testing

- ✅ Chạy tests trước khi deploy
- ✅ Lint code trước khi deploy
- ✅ Test deployment trên staging trước production

---

## 🆘 7. Support

Nếu gặp vấn đề:

1. **Kiểm tra logs** trong GitHub Actions
2. **Kiểm tra secrets** có đúng không
3. **Kiểm tra permissions** của API keys/tokens
4. **Tạo issue** trên GitHub repository

---

## 📚 8. Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Render API Documentation](https://render.com/docs/api)
- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Flutter CI/CD Best Practices](https://docs.flutter.dev/deployment/ci-cd)

---

**Last Updated:** 2024-01-XX  
**Version:** 1.0.0
