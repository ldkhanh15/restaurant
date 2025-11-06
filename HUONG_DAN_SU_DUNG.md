# 📚 Hướng Dẫn Sử Dụng Hệ Thống Restaurant Management System

Hướng dẫn chi tiết để setup, build và deploy hệ thống Restaurant Management System.

## 📋 Mục Lục

1. [Yêu Cầu Hệ Thống](#1-yêu-cầu-hệ-thống)
2. [Cấu Trúc Dự Án](#2-cấu-trúc-dự-án)
3. [Setup Môi Trường Development](#3-setup-môi-trường-development)
4. [Build & Deploy với Docker](#4-build--deploy-với-docker)
5. [CI/CD - GitHub Actions](#5-cicd---github-actions)
6. [Deployment Production](#6-deployment-production)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Yêu Cầu Hệ Thống

### Phần mềm cần thiết:

- **Node.js** 20.x hoặc cao hơn
- **Docker** Desktop 20.10+ hoặc Docker Engine
- **Docker Compose** v2.0+
- **Git** 2.30+
- **MySQL** 8.0+ (hoặc dùng Docker)
- **Python** 3.11+ (cho chatbot, nếu chạy local)
- **Flutter SDK** 3.0+ (cho mobile app, nếu build local)

### Tài khoản cần thiết (cho CI/CD):

- **GitHub Account** (để sử dụng GitHub Actions)
- **Vercel Account** (để deploy web apps)
- **Render Account** (để deploy backend/chatbot)
- **Expo Account** (để build admin-app)

---

## 2. Cấu Trúc Dự Án

```
PBL6/
├── admin-app/              # React Native (Expo) - Admin mobile app
├── admin-web/              # Next.js - Admin web dashboard
├── be_restaurant/          # Express + TypeScript - Backend API
├── chatbot/                # FastAPI (Python) - Chatbot service
├── user-app/               # Flutter - User mobile app
├── user-web/               # Next.js - User web app
├── docker-compose.yml      # Docker Compose configuration
├── .github/
│   └── workflows/          # CI/CD workflows
│       ├── deploy-admin-web.yml
│       ├── deploy-user-web.yml
│       ├── deploy-backend.yml
│       ├── deploy-chatbot.yml
│       └── build-mobile.yml
└── docs/
    └── CI_CD_GUIDE.md      # Chi tiết về CI/CD
```

---

## 3. Setup Môi Trường Development

### 3.1 Clone Repository

```bash
git clone <your-repository-url>
cd PBL6
```

### 3.2 Setup Backend (be_restaurant)

```bash
cd be_restaurant

# Copy env template
cp env.template .env

# Chỉnh sửa .env với thông tin của bạn
# DB_HOST, DB_PASSWORD, JWT_SECRET, CLOUDINARY_*, VNPAY_*

# Install dependencies
npm install

# Run development server
npm run dev
```

Backend sẽ chạy tại: `http://localhost:3000`

**File `.env` cần có:**

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`

### 3.3 Setup Admin Web (admin-web)

```bash
cd admin-web

# Copy env template
cp env.template .env.local

# Chỉnh sửa .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Install dependencies
npm install

# Run development server
npm run dev
```

Admin web sẽ chạy tại: `http://localhost:3000`

### 3.4 Setup User Web (user-web)

```bash
cd user-web

# Copy env template
cp env.template .env.local

# Chỉnh sửa .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Install dependencies
npm install

# Run development server (port 3001 để tránh conflict)
npm run dev -p 3001
```

User web sẽ chạy tại: `http://localhost:3001`

### 3.5 Setup Chatbot (chatbot)

```bash
cd chatbot

# Copy env template
cp env.template .env

# Chỉnh sửa .env
# BE_URL=http://localhost:3000/api
# GEMINI_API_KEY=your-gemini-api-key

# Install dependencies
pip install -r requirements.txt

# Run chatbot server
python api_server.py
```

Chatbot sẽ chạy tại: `http://localhost:7860`

### 3.6 Setup Flutter App (user-app)

```bash
cd user-app/restaurant_reservation_app

# Get dependencies
flutter pub get

# Run on device/emulator
flutter run

# Run on web
flutter run -d chrome
```

### 3.7 Setup React Native App (admin-app)

```bash
cd admin-app

# Install dependencies
npm install

# Start Expo dev server
npm start

# Hoặc chạy trên platform cụ thể
npm run android
npm run ios
npm run web
```

---

## 4. Build & Deploy với Docker

### 4.1 Chuẩn bị Environment Variables

Tạo file `.env` ở root của project:

```bash
# Copy template
cp env.template .env

# Chỉnh sửa .env với giá trị thực tế
nano .env  # hoặc dùng editor bạn thích
```

**File `.env` cần có:**

```env
DB_ROOT_PASSWORD=rootpassword
DB_NAME=restaurant_db
DB_USER=restaurant_user
DB_PASSWORD=restaurant_password
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
VNPAY_TMN_CODE=your-vnpay-code
VNPAY_HASH_SECRET=your-vnpay-secret
GEMINI_API_KEY=your-gemini-api-key
BE_URL=http://backend:3000/api
```

### 4.2 Build và Chạy với Docker Compose

```bash
# Build và chạy tất cả services
docker compose up --build

# Chạy ở background (detached mode)
docker compose up -d --build

# Xem logs
docker compose logs -f

# Xem logs của service cụ thể
docker compose logs -f backend
docker compose logs -f chatbot

# Dừng services
docker compose down

# Dừng và xóa volumes (⚠️ xóa data)
docker compose down -v
```

### 4.3 Truy Cập Services

Sau khi chạy Docker Compose, các services sẽ có sẵn tại:

| Service     | URL                       | Port |
| ----------- | ------------------------- | ---- |
| Backend API | http://localhost:3000/api | 3000 |
| Admin Web   | http://localhost:3002     | 3002 |
| User Web    | http://localhost:3001     | 3001 |
| Chatbot API | http://localhost:7860/api | 7860 |
| MySQL       | localhost:3306            | 3306 |
| Redis       | localhost:6379            | 6379 |

### 4.4 Build Mobile Artifacts với Docker

```bash
# Build Flutter APK
docker compose --profile build-only build flutter-builder
docker compose --profile build-only run --rm flutter-builder

# Artifacts sẽ được lưu tại: ./artifacts/flutter/
```

---

## 5. CI/CD - GitHub Actions

### 5.1 Cấu Hình GitHub Secrets

Vào **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

#### Vercel Secrets (cho Admin Web & User Web)

| Secret Name                   | Giá trị                |
| ----------------------------- | ---------------------- |
| `VERCEL_TOKEN`                | Vercel API token       |
| `VERCEL_ORG_ID`               | Vercel Organization ID |
| `VERCEL_ADMIN_WEB_PROJECT_ID` | Admin Web Project ID   |
| `VERCEL_USER_WEB_PROJECT_ID`  | User Web Project ID    |

**Cách lấy:**

1. Vercel Dashboard → Settings → Tokens → Create Token
2. Vercel Dashboard → Project → Settings → General → Copy Project ID

#### Render Secrets (cho Backend & Chatbot)

| Secret Name                 | Giá trị            |
| --------------------------- | ------------------ |
| `RENDER_API_KEY`            | Render API key     |
| `RENDER_BACKEND_SERVICE_ID` | Backend Service ID |
| `RENDER_CHATBOT_SERVICE_ID` | Chatbot Service ID |

**Cách lấy:**

1. Render Dashboard → Account Settings → API Keys → Create API Key
2. Render Dashboard → Service → Settings → Copy Service ID

#### Expo Secrets (cho Admin App)

| Secret Name  | Giá trị           |
| ------------ | ----------------- |
| `EXPO_TOKEN` | Expo access token |

**Cách lấy:**

1. Expo Dashboard → Account Settings → Access Tokens → Create Token

#### Android Signing Secrets (cho Flutter App)

| Secret Name                 | Giá trị                     |
| --------------------------- | --------------------------- |
| `ANDROID_KEYSTORE_BASE64`   | Base64 encoded keystore.jks |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password           |
| `ANDROID_KEY_PASSWORD`      | Key password                |
| `ANDROID_KEY_ALIAS`         | Key alias                   |

**Cách tạo keystore:**

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore keystore.jks \
  -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Convert to base64
base64 -i keystore.jks  # Linux/Mac
# hoặc
[Convert]::ToBase64String([IO.File]::ReadAllBytes("keystore.jks"))  # Windows
```

### 5.2 Workflows Tự Động

#### Admin Web & User Web

- **Trigger:** Push vào `main`/`develop` với thay đổi trong `admin-web/**` hoặc `user-web/**`
- **Action:** Tự động build và deploy lên Vercel

#### Backend

- **Trigger:** Push vào `main`/`develop` với thay đổi trong `be_restaurant/**`
- **Action:**
  1. Build và test
  2. Build Docker image
  3. Push lên GitHub Container Registry
  4. Deploy lên Render

#### Chatbot

- **Trigger:** Push vào `main`/`develop` với thay đổi trong `chatbot/**`
- **Action:**
  1. Build Docker image
  2. Deploy lên Render hoặc EC2 (có thể chọn manual)

#### Mobile Apps

- **Trigger:** Khi tạo tag release `v*` (ví dụ: `v1.0.0`)
- **Action:**
  1. Build Flutter APK/AAB
  2. Build Expo app qua EAS
  3. Upload artifacts
  4. Tạo GitHub Release

### 5.3 Tạo Tag Release

```bash
# Tạo tag mới
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tag lên GitHub
git push origin v1.0.0
```

Sau khi push tag, workflow `build-mobile.yml` sẽ tự động chạy.

### 5.4 Manual Trigger

1. Vào **Actions** tab trên GitHub
2. Chọn workflow muốn chạy
3. Click **Run workflow**
4. Chọn branch và options
5. Click **Run workflow**

---

## 6. Deployment Production

### 6.1 Deploy Web Apps lên Vercel

#### Thiết lập ban đầu:

```bash
cd admin-web
npm install -g vercel
vercel login
vercel link
```

Workflow sẽ tự động deploy khi có push vào `main`.

### 6.2 Deploy Backend lên Render

#### Thiết lập ban đầu:

1. Vào Render Dashboard → New → Web Service
2. Connect GitHub repository
3. Chọn `be_restaurant` folder
4. Build command: `npm run build`
5. Start command: `npm start`
6. Environment: `Node`
7. Add environment variables từ `.env`

Workflow sẽ tự động deploy khi có push vào `main`.

### 6.3 Deploy Chatbot lên Render

Tương tự Backend, nhưng chọn `chatbot` folder và:

- Build command: `docker build -t chatbot .`
- Start command: `docker run chatbot`

### 6.4 Deploy Chatbot lên EC2 (Alternative)

#### Setup EC2:

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

#### Thêm EC2 Secrets vào GitHub:

- `EC2_SERVER_IP`
- `EC2_SERVER_USER` (thường là `ubuntu`)
- `EC2_SSH_KEY` (toàn bộ nội dung file .pem)
- `EC2_SSH_PORT` (optional, mặc định 22)

Workflow sẽ tự động deploy khi có push vào `main` hoặc khi manual trigger chọn EC2.

---

## 7. Troubleshooting

### 7.1 Docker Issues

**Lỗi:** `Cannot connect to Docker daemon`

**Giải pháp:**

```bash
# Kiểm tra Docker service
sudo systemctl status docker

# Start Docker service
sudo systemctl start docker

# Hoặc restart Docker Desktop
```

**Lỗi:** `Port already in use`

**Giải pháp:**

```bash
# Tìm process đang dùng port
lsof -i :3000  # Linux/Mac
netstat -ano | findstr :3000  # Windows

# Kill process hoặc đổi port trong docker-compose.yml
```

### 7.2 Database Connection Issues

**Lỗi:** `Unable to connect to database`

**Giải pháp:**

1. Kiểm tra MySQL container đã chạy: `docker compose ps`
2. Kiểm tra environment variables: `docker compose config`
3. Kiểm tra network: `docker network ls`
4. Test connection: `docker compose exec mysql mysql -u root -p`

### 7.3 Next.js Build Issues

**Lỗi:** `Module not found` hoặc build fails

**Giải pháp:**

```bash
# Clear cache và reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next
npm run build
```

**Lỗi:** `Standalone output not found`

**Giải pháp:**

- Đảm bảo `next.config.mjs` có `output: 'standalone'`
- Đã được cấu hình trong file config

### 7.4 CI/CD Issues

**Lỗi:** `Vercel token is invalid`

**Giải pháp:**

- Kiểm tra `VERCEL_TOKEN` trong GitHub Secrets
- Tạo token mới trên Vercel Dashboard

**Lỗi:** `Render deployment failed`

**Giải pháp:**

- Kiểm tra `RENDER_API_KEY` và `RENDER_SERVICE_ID`
- Kiểm tra logs trên Render Dashboard

**Lỗi:** `Flutter build failed`

**Giải pháp:**

- Kiểm tra Flutter version trong workflow
- Kiểm tra dependencies trong `pubspec.yaml`
- Xem logs trong GitHub Actions

### 7.5 Environment Variables Issues

**Lỗi:** `Environment variable not found`

**Giải pháp:**

1. Kiểm tra file `.env` đã được tạo chưa
2. Kiểm tra tên biến có đúng không
3. Restart service sau khi thay đổi `.env`

**Lưu ý:**

- File `.env` không được commit vào git
- Sử dụng `.env.example` hoặc `env.template` làm template
- Trong Docker, sử dụng file `.env` ở root

---

## 8. Best Practices

### 8.1 Development

- ✅ Luôn chạy linter trước khi commit: `npm run lint`
- ✅ Test code trước khi push
- ✅ Sử dụng feature branches
- ✅ Commit messages rõ ràng

### 8.2 Security

- ✅ **KHÔNG** commit secrets vào git
- ✅ Sử dụng GitHub Secrets cho CI/CD
- ✅ Rotate secrets định kỳ
- ✅ Sử dụng strong passwords cho JWT_SECRET

### 8.3 Performance

- ✅ Cache dependencies trong CI/CD
- ✅ Sử dụng Docker layer caching
- ✅ Optimize Docker images (multi-stage builds)
- ✅ Monitor deployment times

### 8.4 Monitoring

- ✅ Setup health checks
- ✅ Monitor logs thường xuyên
- ✅ Track build success rates
- ✅ Setup alerts cho failed deployments

---

## 9. Quick Reference

### Lệnh thường dùng

```bash
# Development
npm run dev          # Backend
npm run dev          # Admin Web (port 3000)
npm run dev -p 3001  # User Web (port 3001)
python api_server.py # Chatbot
flutter run          # Flutter app

# Docker
docker compose up --build              # Build và chạy
docker compose up -d --build           # Chạy background
docker compose logs -f                 # Xem logs
docker compose down                   # Dừng services
docker compose down -v                # Dừng và xóa volumes

# Git
git tag -a v1.0.0 -m "Release"        # Tạo tag release
git push origin v1.0.0                # Push tag

# Build
npm run build        # Build backend
npm run build        # Build Next.js apps
flutter build apk    # Build Flutter APK
```

### URLs

- Backend API: http://localhost:3000/api
- Admin Web: http://localhost:3002 (Docker) hoặc http://localhost:3000 (Local)
- User Web: http://localhost:3001
- Chatbot API: http://localhost:7860/api
- MySQL: localhost:3306

---

## 10. Support & Resources

### Documentation

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Flutter Documentation](https://docs.flutter.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

### Hỗ trợ

Nếu gặp vấn đề:

1. Kiểm tra logs: `docker compose logs -f`
2. Kiểm tra GitHub Actions logs
3. Xem file `docs/CI_CD_GUIDE.md` cho chi tiết về CI/CD
4. Tạo issue trên GitHub repository

---

**Last Updated:** 2024-01-XX  
**Version:** 1.0.0
