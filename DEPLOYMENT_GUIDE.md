# 🚀 Restaurant Management System - Deployment Guide

## 📋 Tóm tắt phân tích nhanh từng folder

### 1. **admin-app** (React Native / Expo)

- **Công nghệ**: Expo ~51.0.0, React Native 0.74.5
- **Entrypoint**: `App.tsx`
- **Lệnh dev**:
  - `npm start` hoặc `expo start`
  - `npm run android` - chạy trên Android
  - `npm run ios` - chạy trên iOS
  - `npm run web` - chạy trên web
- **Lệnh build**:
  - Expo: `eas build --platform android` hoặc `eas build --platform ios`
  - APK: `expo build:android` (deprecated, dùng EAS)
- **Port**: Expo dev server mặc định 19000, 19001, 19002
- **Ghi chú**: Sử dụng Expo, khuyến nghị dùng EAS Build hoặc GitHub Actions với expo/actions

### 2. **admin-web** (Next.js)

- **Công nghệ**: Next.js 14.2.16, React 18
- **Entrypoint**: `src/app/` (App Router)
- **Lệnh dev**: `npm run dev` (port mặc định: 3000)
- **Lệnh build**: `npm run build` → `npm start` (production)
- **Port**: 3000 (dev), có thể cấu hình trong docker-compose: 3002
- **Dependencies**: Node.js 20+

### 3. **be_restaurant** (Express/Node.js Backend)

- **Công nghệ**: Express 4.19.2, TypeScript, Sequelize (MySQL)
- **Entrypoint**: `src/server.ts`
- **Lệnh dev**: `npm run dev` (ts-node-dev với hot reload)
- **Lệnh build**: `npm run build` (compile TypeScript) → `npm start`
- **Port**: 3000 (mặc định, có thể đổi qua env PORT)
- **Database**: MySQL 8.0
- **Dependencies**:
  - MySQL trên port 3306
  - JWT secret, Cloudinary config, VNPay config

### 4. **chatbot** (Python FastAPI)

- **Công nghệ**: FastAPI, uvicorn, Google Gemini API
- **Entrypoint**: `api_server.py`
- **Lệnh dev**: `python api_server.py` hoặc `uvicorn api_server:app --reload --port 7860`
- **Lệnh build**: Không cần build, chỉ cần install dependencies
- **Port**: 7860
- **Dependencies**:
  - Python 3.11+
  - `requirements.txt` (FastAPI, uvicorn, requests, google-generativeai, etc.)
  - Backend API URL (BE_URL env)

### 5. **user-app** (Flutter)

- **Công nghệ**: Flutter SDK 3.0+
- **Entrypoint**: `lib/main.dart`
- **Lệnh dev**:
  - `flutter run` - chạy trên device/emulator
  - `flutter run -d chrome` - chạy trên web
- **Lệnh build**:
  - Android APK: `flutter build apk --release --split-per-abi`
  - Android AAB: `flutter build appbundle --release`
  - iOS: `flutter build ios --release` (cần macOS + Xcode)
- **Port**: N/A (mobile app)
- **Dependencies**: Flutter SDK, Android SDK (cho Android), Xcode (cho iOS)

### 6. **user-web** (Next.js)

- **Công nghệ**: Next.js 14.2.16, React 18
- **Entrypoint**: `src/app/` (App Router)
- **Lệnh dev**: `npm run dev` (port mặc định: 3000, có thể cấu hình: 3001)
- **Lệnh build**: `npm run build` → `npm start`
- **Port**: 3001 (trong docker-compose để tránh conflict với admin-web)
- **Dependencies**: Node.js 20+

---

## 🐳 Docker Setup

### Prerequisites

- Docker Desktop hoặc Docker Engine 20.10+
- Docker Compose v2.0+

### Cấu trúc Dockerfile

1. **be_restaurant/Dockerfile**: Multi-stage build cho Express backend
2. **admin-web/Dockerfile**: Multi-stage build cho Next.js admin web
3. **user-web/Dockerfile**: Multi-stage build cho Next.js user web
4. **chatbot/Dockerfile**: Multi-stage build cho Python FastAPI
5. **docker/Flutter-builder.Dockerfile**: Builder cho Flutter APK/AAB
6. **docker/RN-builder.Dockerfile**: Builder cho React Native/Expo (hướng dẫn)

### Chạy hệ thống với Docker Compose

#### 1. Chuẩn bị file môi trường

Tạo file `.env` ở root của project:

```env
# Database
DB_ROOT_PASSWORD=rootpassword
DB_NAME=restaurant_db
DB_USER=restaurant_user
DB_PASSWORD=restaurant_password

# Backend
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
VNPAY_TMN_CODE=your-vnpay-code
VNPAY_HASH_SECRET=your-vnpay-secret

# Chatbot
GEMINI_API_KEY=your-gemini-api-key
```

#### 2. Build và chạy services

```bash
# Build và chạy tất cả services
docker compose up --build

# Chạy ở background
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

#### 3. Build mobile artifacts

```bash
# Build Flutter APK
docker compose --profile build-only build flutter-builder
docker compose --profile build-only run --rm flutter-builder

# Build React Native (hướng dẫn, không khuyến nghị dùng Docker)
# Thay vào đó dùng GitHub Actions hoặc EAS Build
```

Artifacts sẽ được lưu tại: `./artifacts/flutter/` và `./artifacts/react-native/`

#### 4. Services và Ports

| Service     | Port | URL                       |
| ----------- | ---- | ------------------------- |
| Backend API | 3000 | http://localhost:3000/api |
| Admin Web   | 3002 | http://localhost:3002     |
| User Web    | 3001 | http://localhost:3001     |
| Chatbot API | 7860 | http://localhost:7860/api |
| MySQL       | 3306 | localhost:3306            |
| Redis       | 6379 | localhost:6379            |

---

## 🛠️ Development Setup (Local)

### Backend (be_restaurant)

```bash
cd be_restaurant
npm install
npm run dev
```

Backend sẽ chạy tại: http://localhost:3000

### Admin Web

```bash
cd admin-web
npm install
npm run dev
```

Admin web sẽ chạy tại: http://localhost:3000

### User Web

```bash
cd user-web
npm install
npm run dev -p 3001  # hoặc đổi port trong package.json
```

User web sẽ chạy tại: http://localhost:3001

### Chatbot

```bash
cd chatbot
pip install -r requirements.txt
python api_server.py
```

Chatbot sẽ chạy tại: http://localhost:7860

### Flutter App

```bash
cd user-app/restaurant_reservation_app
flutter pub get
flutter run
```

### React Native App (Expo)

```bash
cd admin-app
npm install
npm start
# Sau đó scan QR code với Expo Go app hoặc chạy trên emulator
```

---

## 🚢 CI/CD với GitHub Actions

### Workflow 1: `ci-web-backend.yml`

**Chức năng:**

- Lint và test code (nếu có)
- Build Docker images cho backend, admin-web, user-web, chatbot
- Push images lên registry (GitHub Container Registry, Docker Hub, GCR, ECR)
- Deploy lên VPS (Docker Compose) hoặc Kubernetes

**Cấu hình cần thiết:**

1. **GitHub Secrets** cho Docker registry:

   - `GITHUB_TOKEN` (tự động có)
   - Hoặc `DOCKER_USERNAME` và `DOCKER_PASSWORD` (cho Docker Hub)

2. **VPS Deployment** (nếu dùng):

   - `VPS_HOST`: IP hoặc domain của VPS
   - `VPS_USER`: SSH user
   - `VPS_SSH_KEY`: Private SSH key
   - `VPS_PORT`: SSH port (mặc định 22)

3. **Kubernetes Deployment** (nếu dùng):
   - `KUBECONFIG`: Base64 encoded kubeconfig file

**Trigger:**

- Push vào `main` hoặc `develop` branch
- Pull request vào `main` hoặc `develop`
- Chỉ chạy khi có thay đổi trong các folder: `admin-web/`, `user-web/`, `be_restaurant/`, `chatbot/`

### Workflow 2: `ci-mobile.yml`

**Chức năng:**

- Build Flutter APK/AAB cho Android
- Build React Native/Expo app
- Build iOS apps (nếu có macOS runner)
- Upload artifacts
- Publish lên Firebase App Distribution (optional)

**Cấu hình cần thiết:**

1. **Android Signing**:

   - `ANDROID_KEYSTORE_PASSWORD`: Keystore password
   - `ANDROID_KEY_PASSWORD`: Key password
   - `ANDROID_KEY_ALIAS`: Key alias
   - `ANDROID_KEYSTORE_BASE64`: Base64 encoded keystore.jks file

2. **iOS Signing** (nếu build iOS):

   - `APPLE_CERTIFICATE_BASE64`: Base64 encoded .p12 certificate
   - `APPLE_CERTIFICATE_PASSWORD`: Certificate password
   - `APPLE_PROVISIONING_PROFILE_BASE64`: Base64 encoded .mobileprovision file

3. **Expo** (nếu dùng Expo):

   - `EXPO_TOKEN`: Expo access token

4. **Firebase App Distribution** (optional):
   - `FIREBASE_APP_ID`: Firebase app ID
   - `FIREBASE_SERVICE_ACCOUNT`: Firebase service account JSON

**Trigger:**

- Push vào `main` hoặc `develop` với message chứa `[flutter]`, `[rn]`, `[mobile]`
- Manual workflow dispatch với option chọn platform

---

## 📦 Monorepo Structure & Recommendations

### Đề xuất cấu trúc monorepo

```
PBL6/
├── packages/
│   ├── shared-types/          # TypeScript types shared across projects
│   ├── api-client/             # Axios client, API definitions
│   └── ui-components/         # Shared UI components (nếu cần)
├── admin-app/
├── admin-web/
├── be_restaurant/
├── chatbot/
├── user-app/
└── user-web/
```

### Công cụ đề xuất

1. **Turborepo** (recommended)

   - Tốc độ build nhanh với caching
   - Parallel execution
   - Incremental builds

   ```bash
   npm install -g turbo
   turbo init
   ```

2. **Nx** (alternative)

   - Monorepo management mạnh mẽ
   - Graph visualization
   - Advanced caching

3. **Lerna** (legacy)
   - Đơn giản nhưng ít tính năng hơn

### Cải tiến đề xuất

1. **Shared Packages**

   - Tạo `packages/shared-types` cho TypeScript types
   - Tạo `packages/api-client` cho API client dùng chung
   - Giảm duplicate code giữa admin-web và user-web

2. **Build Caching**

   - Sử dụng Turborepo remote cache
   - Cache Docker layers
   - Cache npm/pip dependencies trong CI/CD

3. **Secret Management**

   - Sử dụng GitHub Secrets cho development
   - Sử dụng Vault, AWS Secrets Manager, hoặc GCP Secret Manager cho production
   - Không commit secrets vào git

4. **Versioning & Releases**
   - Semantic versioning (semver)
   - Git tags cho releases
   - Changelog tự động với conventional commits
   - GitHub Releases

---

## 🔐 Mobile Build & Code Signing

### Android

1. **Tạo keystore:**

   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore keystore.jks \
     -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Cấu hình Flutter:**

   - Tạo file `android/key.properties`
   - Cập nhật `android/app/build.gradle` để sử dụng keystore

3. **Cấu hình React Native:**
   - Tương tự Flutter, cấu hình trong `android/app/build.gradle`

### iOS

1. **Certificates & Provisioning Profiles:**

   - Tạo certificates trên Apple Developer Portal
   - Tạo App ID và Provisioning Profiles
   - Download và import vào Keychain

2. **Flutter iOS:**

   - Cấu hình trong Xcode
   - Setup signing team và bundle identifier

3. **React Native/Expo:**
   - Expo: Dùng EAS Build (recommended)
   - Bare RN: Setup trong Xcode project

### Khuyến nghị

- **Flutter**: Sử dụng Fastlane cho automation
- **Expo**: Sử dụng EAS Build (expo.dev/build)
- **Bare React Native**: Sử dụng Fastlane + GitHub Actions

---

## 🚀 Production Deployment

### Option 1: VPS với Docker Compose

1. **Setup VPS:**

   ```bash
   # Install Docker & Docker Compose
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh

   # Clone repository
   git clone <your-repo> /opt/restaurant
   cd /opt/restaurant
   ```

2. **Cấu hình:**

   - Tạo file `.env` với production values
   - Cấu hình reverse proxy (Nginx) để expose services

3. **Nginx configuration:**

   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Deploy:**
   ```bash
   docker compose pull
   docker compose up -d --build
   ```

### Option 2: Kubernetes

1. **Tạo manifests:**

   - Deployment cho mỗi service
   - Service để expose ports
   - Ingress để route traffic
   - ConfigMap và Secrets cho configuration

2. **Deploy:**

   ```bash
   kubectl apply -f k8s/
   ```

3. **Khuyến nghị:**
   - Sử dụng Helm charts
   - Sử dụng Kustomize
   - Setup Horizontal Pod Autoscaling
   - Setup monitoring (Prometheus + Grafana)

### Option 3: Serverless (Vercel/Netlify)

- **Admin Web & User Web**: Deploy lên Vercel hoặc Netlify
- **Backend**: Deploy lên Railway, Render, hoặc Fly.io
- **Chatbot**: Deploy lên Railway, Render, hoặc Fly.io

---

## 📝 Notes & Warnings

### ⚠️ Important Notes

1. **Next.js Standalone Output:**

   - Cần cập nhật `next.config.mjs` để thêm `output: 'standalone'` cho Docker builds
   - File hiện tại chưa có config này, cần thêm vào

2. **Mobile Builds:**

   - iOS builds **bắt buộc** chạy trên macOS
   - Android builds có thể chạy trên Linux/Windows
   - Expo builds nên dùng EAS Build thay vì Docker

3. **Database:**

   - MySQL 8.0 được sử dụng
   - Cần backup database định kỳ
   - Migration scripts trong `be_restaurant/migrations/`

4. **Secrets:**

   - **KHÔNG** commit secrets vào git
   - Sử dụng `.env` files (đã có trong .gitignore)
   - Sử dụng secret management tools cho production

5. **Port Conflicts:**
   - Admin-web và User-web cùng mặc định port 3000
   - Đã cấu hình trong docker-compose: admin-web:3002, user-web:3001

### 🔧 Troubleshooting

1. **Docker build fails:**

   - Kiểm tra Docker version
   - Kiểm tra disk space
   - Clear Docker cache: `docker system prune -a`

2. **Database connection fails:**

   - Kiểm tra MySQL container đã chạy: `docker compose ps`
   - Kiểm tra environment variables
   - Kiểm tra network: `docker network ls`

3. **Next.js build fails:**

   - Thêm `output: 'standalone'` vào `next.config.mjs`
   - Kiểm tra Node.js version (cần 20+)

4. **Mobile build fails:**
   - Kiểm tra SDK versions
   - Kiểm tra signing configuration
   - Xem logs trong GitHub Actions

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Flutter Build Documentation](https://docs.flutter.dev/deployment/android)
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Turborepo Documentation](https://turbo.build/repo/docs)

---

## 📞 Support

Nếu gặp vấn đề, vui lòng:

1. Kiểm tra logs: `docker compose logs -f`
2. Kiểm tra GitHub Actions logs
3. Tạo issue trên repository

---

**Last Updated**: 2024-01-XX
**Version**: 1.0.0
