# 🐳 Restaurant Management System - Complete Docker & CI/CD Setup

## 📋 1. TÓM TẮT PHÂN TÍCH NHANH TỪNG FOLDER

### 1.1 admin-app (React Native / Expo)

- **Công nghệ**: Expo ~51.0.0, React Native 0.74.5
- **Entrypoint**: `App.tsx` → `src/navigation/AppNavigator.tsx`
- **Lệnh dev**:
  - `npm start` hoặc `expo start`
  - `npm run android` - chạy trên Android emulator/device
  - `npm run ios` - chạy trên iOS simulator/device
  - `npm run web` - chạy trên web browser
- **Lệnh build**:
  - **Expo (Recommended)**: `eas build --platform android` hoặc `eas build --platform ios`
  - **Legacy**: `expo build:android` (deprecated)
- **Port**: Expo dev server: 19000 (Metro), 19001 (Expo), 19002 (Web)
- **Dockerfile**: `docker/RN-builder.Dockerfile` (hướng dẫn, khuyến nghị dùng EAS Build)
- **Ghi chú**: Sử dụng Expo, nên dùng EAS Build hoặc GitHub Actions với expo/actions

### 1.2 admin-web (Next.js)

- **Công nghệ**: Next.js 14.2.16, React 18, TypeScript
- **Entrypoint**: `src/app/` (App Router)
- **Lệnh dev**: `npm run dev` (port mặc định: 3000)
- **Lệnh build**: `npm run build` → `npm start` (production)
- **Port**:
  - Development: 3000
  - Docker: 3002 (để tránh conflict với user-web)
- **Dockerfile**: `admin-web/Dockerfile` (multi-stage build)
- **Dependencies**: Node.js 20+, npm hoặc pnpm

### 1.3 be_restaurant (Express/Node.js Backend)

- **Công nghệ**: Express 4.19.2, TypeScript, Sequelize ORM, MySQL
- **Entrypoint**: `src/server.ts` → `src/app.ts`
- **Lệnh dev**: `npm run dev` (ts-node-dev với hot reload)
- **Lệnh build**: `npm run build` (compile TypeScript) → `npm start` (chạy `dist/server.js`)
- **Port**: 3000 (mặc định, có thể đổi qua env `PORT`)
- **Database**: MySQL 8.0 (port 3306)
- **Dockerfile**: `be_restaurant/Dockerfile` (multi-stage build)
- **Dependencies**:
  - MySQL database
  - Environment variables: `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `CLOUDINARY_*`, `VNPAY_*`

### 1.4 chatbot (Python FastAPI)

- **Công nghệ**: FastAPI, uvicorn, Google Gemini API
- **Entrypoint**: `api_server.py`
- **Lệnh dev**:
  - `python api_server.py` (chạy với uvicorn)
  - `uvicorn api_server:app --reload --port 7860` (với hot reload)
- **Lệnh build**: Không cần build, chỉ cần install dependencies
- **Port**: 7860
- **Dockerfile**: `chatbot/Dockerfile` (multi-stage build)
- **Dependencies**:
  - Python 3.11+
  - `requirements.txt`: FastAPI, uvicorn, requests, google-generativeai, Pillow, python-magic, pydantic
  - Environment variables: `BE_URL`, `GEMINI_API_KEY`

### 1.5 user-app (Flutter)

- **Công nghệ**: Flutter SDK 3.0+
- **Entrypoint**: `lib/main.dart`
- **Lệnh dev**:
  - `flutter run` - chạy trên device/emulator
  - `flutter run -d chrome` - chạy trên web
- **Lệnh build**:
  - **Android APK**: `flutter build apk --release --split-per-abi`
  - **Android AAB**: `flutter build appbundle --release` (cho Play Store)
  - **iOS**: `flutter build ios --release` (cần macOS + Xcode)
- **Port**: N/A (mobile app)
- **Dockerfile**: `docker/Flutter-builder.Dockerfile` (build artifacts)
- **Dependencies**: Flutter SDK, Android SDK (cho Android), Xcode (cho iOS)

### 1.6 user-web (Next.js)

- **Công nghệ**: Next.js 14.2.16, React 18, TypeScript
- **Entrypoint**: `src/app/` (App Router)
- **Lệnh dev**: `npm run dev` (port mặc định: 3000, có thể cấu hình: 3001)
- **Lệnh build**: `npm run build` → `npm start`
- **Port**:
  - Development: 3000
  - Docker: 3001 (để tránh conflict với admin-web)
- **Dockerfile**: `user-web/Dockerfile` (multi-stage build)
- **Dependencies**: Node.js 20+, npm hoặc pnpm

---

## 🐳 2. DOCKERFILES

### 2.1 be_restaurant/Dockerfile

```dockerfile
# Backend Restaurant API - Express/Node.js
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy uploads directory if exists
COPY --from=builder /app/uploads ./uploads

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "dist/server.js"]
```

### 2.2 admin-web/Dockerfile

```dockerfile
# Admin Web - Next.js
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install dependencies
RUN npm ci

FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set Next.js to output standalone
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_OUTPUT=standalone

# Build Next.js app
# Note: Update next.config.mjs to include: output: 'standalone'
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### 2.3 user-web/Dockerfile

```dockerfile
# User Web - Next.js
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install dependencies
RUN npm ci

FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set Next.js to output standalone
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_OUTPUT=standalone

# Build Next.js app
# Note: Update next.config.mjs to include: output: 'standalone'
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### 2.4 chatbot/Dockerfile

```dockerfile
# Chatbot - Python FastAPI
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements if exists, otherwise create one
COPY requirements.txt* ./

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    if [ -f requirements.txt ]; then \
        pip install --no-cache-dir -r requirements.txt; \
    else \
        pip install --no-cache-dir \
            fastapi==0.115.0 \
            uvicorn[standard]==0.30.0 \
            requests==2.31.0 \
            google-generativeai==0.8.0 \
            Pillow==10.4.0 \
            python-magic==0.4.27 \
            pydantic==2.9.0; \
    fi

# Production stage
FROM python:3.11-slim

WORKDIR /app

# Copy installed packages
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs && \
    touch logs/chatbot.log

# Expose port
EXPOSE 7860

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:7860/api/health').raise_for_status()" || exit 1

# Run FastAPI server
CMD ["uvicorn", "api_server:app", "--host", "0.0.0.0", "--port", "7860"]
```

### 2.5 docker/Flutter-builder.Dockerfile

```dockerfile
# Flutter Builder - Multi-stage build for Android APK/AAB
FROM cirrusci/flutter:stable AS builder

WORKDIR /app

# Copy Flutter project
COPY user-app/restaurant_reservation_app/ ./restaurant_reservation_app/

WORKDIR /app/restaurant_reservation_app

# Get dependencies
RUN flutter pub get

# Build APK (debug)
RUN flutter build apk --debug --split-per-abi

# Build APK (release) - requires signing config
# RUN flutter build apk --release --split-per-abi

# Build AAB (release) - for Play Store
# RUN flutter build appbundle --release

# Export artifacts
FROM alpine:latest AS artifacts

WORKDIR /artifacts

# Copy built APKs
COPY --from=builder /app/restaurant_reservation_app/build/app/outputs/flutter-apk/*.apk ./

# Create artifact directory structure
RUN mkdir -p android/app/release && \
    mkdir -p android/app/debug && \
    mkdir -p ios/Release

# Note: iOS builds require macOS and Xcode, so they should be done via CI/CD
# or on a Mac machine with proper certificates and provisioning profiles
```

### 2.6 docker/RN-builder.Dockerfile

```dockerfile
# React Native / Expo Builder
# Note: Expo builds are typically done via EAS Build or GitHub Actions
# This Dockerfile is for bare React Native or custom Expo builds

FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies for React Native
RUN apk add --no-cache \
    git \
    curl \
    bash

# For Android builds, we need Android SDK
# For production, consider using a dedicated Android build image
FROM base AS android-builder

# Install Android SDK (simplified - for production use official Android image)
RUN apk add --no-cache \
    openjdk17 \
    && rm -rf /var/cache/apk/*

# Copy React Native project
COPY admin-app/ ./admin-app/

WORKDIR /app/admin-app

# Install dependencies
RUN npm ci

# Build Android (requires proper setup)
# For Expo projects, use EAS Build instead:
# RUN npx expo build:android

# For bare React Native:
# RUN cd android && ./gradlew assembleRelease

# Export artifacts
FROM alpine:latest AS artifacts

WORKDIR /artifacts

# Create directories for Android and iOS artifacts
RUN mkdir -p android/app/release && \
    mkdir -p android/app/debug && \
    mkdir -p ios/Release && \
    mkdir -p ios/Debug

# Copy built artifacts (if any)
# COPY --from=android-builder /app/admin-app/android/app/build/outputs/apk/*.apk ./android/app/release/

# Note:
# - Expo projects should use EAS Build (expo.dev) or GitHub Actions with expo/actions
# - iOS builds require macOS with Xcode
# - Android builds require proper keystore configuration
```

---

## 🐙 3. DOCKER COMPOSE

File `docker-compose.yml` ở root của repository:

```yaml
version: "3.8"

services:
  # MySQL Database
  mysql:
    image: mysql:8.0
    container_name: restaurant-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD:-rootpassword}
      MYSQL_DATABASE: ${DB_NAME:-restaurant_db}
      MYSQL_USER: ${DB_USER:-restaurant_user}
      MYSQL_PASSWORD: ${DB_PASSWORD:-restaurant_password}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./be_restaurant/data.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test:
        [
          "CMD",
          "mysqladmin",
          "ping",
          "-h",
          "localhost",
          "-u",
          "root",
          "-p${DB_ROOT_PASSWORD:-rootpassword}",
        ]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - restaurant-network

  # Redis (optional, for caching/sessions)
  redis:
    image: redis:7-alpine
    container_name: restaurant-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - restaurant-network

  # Backend API (Express/Node.js)
  backend:
    build:
      context: ./be_restaurant
      dockerfile: Dockerfile
    container_name: restaurant-backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: ${DB_NAME:-restaurant_db}
      DB_USER: ${DB_USER:-restaurant_user}
      DB_PASSWORD: ${DB_PASSWORD:-restaurant_password}
      JWT_SECRET: ${JWT_SECRET:-your-secret-key-change-in-production}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-7d}
      CLOUDINARY_CLOUD_NAME: ${CLOUDINARY_CLOUD_NAME:-}
      CLOUDINARY_API_KEY: ${CLOUDINARY_API_KEY:-}
      CLOUDINARY_API_SECRET: ${CLOUDINARY_API_SECRET:-}
      VNPAY_TMN_CODE: ${VNPAY_TMN_CODE:-}
      VNPAY_HASH_SECRET: ${VNPAY_HASH_SECRET:-}
    volumes:
      - ./be_restaurant/uploads:/app/uploads
      - ./be_restaurant/logs:/app/logs
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - restaurant-network
    healthcheck:
      test:
        [
          "CMD",
          "node",
          "-e",
          "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})",
        ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Chatbot API (Python FastAPI)
  chatbot:
    build:
      context: ./chatbot
      dockerfile: Dockerfile
    container_name: restaurant-chatbot
    restart: unless-stopped
    ports:
      - "7860:7860"
    environment:
      BE_URL: http://backend:3000/api
      GEMINI_API_KEY: ${GEMINI_API_KEY:-your-gemini-api-key}
      PYTHONUNBUFFERED: 1
    volumes:
      - ./chatbot/logs:/app/logs
      - ./chatbot/hiwell_chatbot.db:/app/hiwell_chatbot.db
      - ./model_recommend:/app/model_recommend
    depends_on:
      - backend
    networks:
      - restaurant-network
    healthcheck:
      test:
        [
          "CMD",
          "python",
          "-c",
          "import requests; requests.get('http://localhost:7860/api/health').raise_for_status()",
        ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Admin Web (Next.js)
  admin-web:
    build:
      context: ./admin-web
      dockerfile: Dockerfile
    container_name: restaurant-admin-web
    restart: unless-stopped
    ports:
      - "3002:3000"
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: http://localhost:3000/api
      NEXT_PUBLIC_WS_URL: ws://localhost:3000
    depends_on:
      - backend
    networks:
      - restaurant-network
    healthcheck:
      test:
        [
          "CMD",
          "wget",
          "--no-verbose",
          "--tries=1",
          "--spider",
          "http://localhost:3000/",
        ]
      interval: 30s
      timeout: 10s
      retries: 3

  # User Web (Next.js)
  user-web:
    build:
      context: ./user-web
      dockerfile: Dockerfile
    container_name: restaurant-user-web
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: http://localhost:3000/api
      NEXT_PUBLIC_WS_URL: ws://localhost:3000
    depends_on:
      - backend
    networks:
      - restaurant-network
    healthcheck:
      test:
        [
          "CMD",
          "wget",
          "--no-verbose",
          "--tries=1",
          "--spider",
          "http://localhost:3001/",
        ]
      interval: 30s
      timeout: 10s
      retries: 3

  # Flutter Builder (build artifacts only, not a runtime service)
  flutter-builder:
    build:
      context: .
      dockerfile: docker/Flutter-builder.Dockerfile
    container_name: flutter-builder
    volumes:
      - ./artifacts/flutter:/artifacts
    profiles:
      - build-only
    # This service only runs when explicitly called for building

  # React Native Builder (build artifacts only, not a runtime service)
  rn-builder:
    build:
      context: .
      dockerfile: docker/RN-builder.Dockerfile
    container_name: rn-builder
    volumes:
      - ./artifacts/react-native:/artifacts
    profiles:
      - build-only
    # This service only runs when explicitly called for building

networks:
  restaurant-network:
    driver: bridge

volumes:
  mysql_data:
    driver: local
  redis_data:
    driver: local
```

**Lệnh sử dụng:**

```bash
# Build và chạy tất cả services
docker compose up --build

# Chạy ở background
docker compose up -d --build

# Build mobile artifacts
docker compose --profile build-only build flutter-builder
docker compose --profile build-only run --rm flutter-builder

# Xem logs
docker compose logs -f

# Dừng services
docker compose down

# Dừng và xóa volumes
docker compose down -v
```

---

## 🔄 4. GITHUB ACTIONS WORKFLOWS

### 4.1 .github/workflows/ci-web-backend.yml

**Chức năng:**

- Lint và test code
- Build Docker images cho backend, admin-web, user-web, chatbot
- Push images lên registry (GitHub Container Registry, Docker Hub, GCR, ECR)
- Deploy lên VPS (Docker Compose) hoặc Kubernetes

**Cấu hình GitHub Secrets cần thiết:**

1. **Docker Registry:**

   - `GITHUB_TOKEN` (tự động có, cho GitHub Container Registry)
   - Hoặc `DOCKER_USERNAME` và `DOCKER_PASSWORD` (cho Docker Hub)

2. **VPS Deployment:**

   - `VPS_HOST`: IP hoặc domain của VPS
   - `VPS_USER`: SSH user (ví dụ: root, ubuntu)
   - `VPS_SSH_KEY`: Private SSH key (base64 encoded hoặc raw)
   - `VPS_PORT`: SSH port (mặc định: 22)

3. **Kubernetes Deployment:**
   - `KUBECONFIG`: Base64 encoded kubeconfig file

**Trigger:**

- Push vào `main` hoặc `develop` branch
- Pull request vào `main` hoặc `develop`
- Chỉ chạy khi có thay đổi trong: `admin-web/`, `user-web/`, `be_restaurant/`, `chatbot/`

### 4.2 .github/workflows/ci-mobile.yml

**Chức năng:**

- Build Flutter APK/AAB cho Android
- Build React Native/Expo app
- Build iOS apps (nếu có macOS runner)
- Upload artifacts
- Publish lên Firebase App Distribution (optional)

**Cấu hình GitHub Secrets cần thiết:**

1. **Android Signing:**

   - `ANDROID_KEYSTORE_PASSWORD`: Keystore password
   - `ANDROID_KEY_PASSWORD`: Key password
   - `ANDROID_KEY_ALIAS`: Key alias (ví dụ: my-key-alias)
   - `ANDROID_KEYSTORE_BASE64`: Base64 encoded keystore.jks file

2. **iOS Signing:**

   - `APPLE_CERTIFICATE_BASE64`: Base64 encoded .p12 certificate
   - `APPLE_CERTIFICATE_PASSWORD`: Certificate password
   - `APPLE_PROVISIONING_PROFILE_BASE64`: Base64 encoded .mobileprovision file

3. **Expo:**

   - `EXPO_TOKEN`: Expo access token (tạo tại expo.dev)

4. **Firebase App Distribution (optional):**
   - `FIREBASE_APP_ID`: Firebase app ID
   - `FIREBASE_SERVICE_ACCOUNT`: Firebase service account JSON

**Trigger:**

- Push vào `main` hoặc `develop` với commit message chứa `[flutter]`, `[rn]`, `[mobile]`
- Manual workflow dispatch với option chọn platform (android/ios/both)

---

## 📝 5. README HƯỚNG DẪN

### 5.1 Lệnh chạy dev từng project

**Backend:**

```bash
cd be_restaurant
npm install
npm run dev
# Chạy tại: http://localhost:3000
```

**Admin Web:**

```bash
cd admin-web
npm install
npm run dev
# Chạy tại: http://localhost:3000
```

**User Web:**

```bash
cd user-web
npm install
npm run dev -p 3001
# Chạy tại: http://localhost:3001
```

**Chatbot:**

```bash
cd chatbot
pip install -r requirements.txt
python api_server.py
# Chạy tại: http://localhost:7860
```

**Flutter App:**

```bash
cd user-app/restaurant_reservation_app
flutter pub get
flutter run
```

**React Native App (Expo):**

```bash
cd admin-app
npm install
npm start
# Scan QR code với Expo Go app
```

### 5.2 Lệnh Docker Compose

```bash
# Build và chạy tất cả services
docker compose up --build

# Chạy ở background
docker compose up -d --build

# Xem logs
docker compose logs -f

# Xem logs service cụ thể
docker compose logs -f backend

# Dừng services
docker compose down

# Dừng và xóa volumes
docker compose down -v
```

### 5.3 Nơi lưu artifact mobile

- **Flutter artifacts**: `./artifacts/flutter/`
- **React Native artifacts**: `./artifacts/react-native/`

**Build mobile artifacts:**

```bash
# Flutter
docker compose --profile build-only build flutter-builder
docker compose --profile build-only run --rm flutter-builder

# React Native (khuyến nghị dùng GitHub Actions hoặc EAS Build)
```

---

## 🏗️ 6. ĐỀ XUẤT CẤU TRÚC MONOREPO

### 6.1 Cấu trúc đề xuất

```
PBL6/
├── packages/
│   ├── shared-types/          # TypeScript types shared across projects
│   │   ├── src/
│   │   │   ├── api/
│   │   │   ├── models/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── api-client/             # Axios client, API definitions
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   ├── endpoints.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── ui-components/         # Shared UI components (optional)
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
│
├── admin-app/
├── admin-web/
├── be_restaurant/
├── chatbot/
├── user-app/
├── user-web/
├── docker-compose.yml
└── package.json (root - cho Turborepo)
```

### 6.2 Công cụ đề xuất

#### Option 1: Turborepo (Recommended)

**Ưu điểm:**

- Tốc độ build nhanh với caching
- Parallel execution
- Incremental builds
- Remote caching

**Setup:**

```bash
npm install -g turbo
cd PBL6
turbo init
```

**Cấu hình `turbo.json`:**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    }
  }
}
```

#### Option 2: Nx

**Ưu điểm:**

- Monorepo management mạnh mẽ
- Graph visualization
- Advanced caching
- Code generation

**Setup:**

```bash
npx create-nx-workspace@latest restaurant-monorepo
```

### 6.3 Cải tiến đề xuất

1. **Shared Packages**

   - Tạo `packages/shared-types` cho TypeScript types dùng chung
   - Tạo `packages/api-client` cho API client dùng chung giữa admin-web và user-web
   - Giảm duplicate code

2. **Build Caching**

   - Sử dụng Turborepo remote cache
   - Cache Docker layers
   - Cache npm/pip dependencies trong CI/CD

3. **Secret Management**

   - **Development**: GitHub Secrets
   - **Production**: Vault, AWS Secrets Manager, GCP Secret Manager
   - **Không** commit secrets vào git

4. **Versioning & Releases**

   - Semantic versioning (semver)
   - Git tags cho releases
   - Changelog tự động với conventional commits
   - GitHub Releases

5. **Testing**
   - Unit tests cho từng service
   - Integration tests
   - E2E tests cho web apps
   - Test coverage reports

---

## 🔐 7. MOBILE BUILD & CODE SIGNING

### 7.1 Android

**Tạo keystore:**

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore keystore.jks \
  -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**Flutter - Cấu hình signing:**

1. Tạo file `android/key.properties`:

```properties
storePassword=your-store-password
keyPassword=your-key-password
keyAlias=my-key-alias
storeFile=../keystore.jks
```

2. Cập nhật `android/app/build.gradle`:

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

**React Native - Cấu hình signing:**

- Tương tự Flutter, cấu hình trong `android/app/build.gradle`

### 7.2 iOS

**Certificates & Provisioning Profiles:**

1. Tạo certificates trên Apple Developer Portal
2. Tạo App ID và Provisioning Profiles
3. Download và import vào Keychain

**Flutter iOS:**

- Cấu hình trong Xcode
- Setup signing team và bundle identifier

**React Native/Expo:**

- **Expo**: Dùng EAS Build (recommended)
- **Bare RN**: Setup trong Xcode project

### 7.3 Khuyến nghị

- **Flutter**: Sử dụng Fastlane cho automation
- **Expo**: Sử dụng EAS Build (expo.dev/build)
- **Bare React Native**: Sử dụng Fastlane + GitHub Actions

---

## 🚀 8. PRODUCTION DEPLOYMENT

### 8.1 Option 1: VPS với Docker Compose

**Setup VPS:**

```bash
# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clone repository
git clone <your-repo> /opt/restaurant
cd /opt/restaurant
```

**Cấu hình Nginx (reverse proxy):**

```nginx
# /etc/nginx/sites-available/restaurant

# Backend API
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

# Admin Web
server {
    listen 80;
    server_name admin.yourdomain.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# User Web
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Deploy:**

```bash
docker compose pull
docker compose up -d --build
```

### 8.2 Option 2: Kubernetes

**Tạo manifests:**

- Deployment cho mỗi service
- Service để expose ports
- Ingress để route traffic
- ConfigMap và Secrets cho configuration

**Deploy:**

```bash
kubectl apply -f k8s/
```

**Khuyến nghị:**

- Sử dụng Helm charts
- Sử dụng Kustomize
- Setup Horizontal Pod Autoscaling
- Setup monitoring (Prometheus + Grafana)

### 8.3 Option 3: Serverless

- **Admin Web & User Web**: Deploy lên Vercel hoặc Netlify
- **Backend**: Deploy lên Railway, Render, hoặc Fly.io
- **Chatbot**: Deploy lên Railway, Render, hoặc Fly.io

---

## ⚠️ 9. NOTES & WARNINGS

### 9.1 Important Notes

1. **Next.js Standalone Output:**

   - ✅ Đã cập nhật `next.config.mjs` để thêm `output: 'standalone'` cho Docker builds
   - File `admin-web/next.config.mjs` và `user-web/next.config.mjs` đã được cập nhật

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
   - ✅ Đã cấu hình trong docker-compose: admin-web:3002, user-web:3001

### 9.2 Troubleshooting

1. **Docker build fails:**

   - Kiểm tra Docker version: `docker --version`
   - Kiểm tra disk space: `df -h`
   - Clear Docker cache: `docker system prune -a`

2. **Database connection fails:**

   - Kiểm tra MySQL container đã chạy: `docker compose ps`
   - Kiểm tra environment variables: `docker compose config`
   - Kiểm tra network: `docker network ls`

3. **Next.js build fails:**

   - ✅ Đã thêm `output: 'standalone'` vào `next.config.mjs`
   - Kiểm tra Node.js version: `node --version` (cần 20+)

4. **Mobile build fails:**
   - Kiểm tra SDK versions
   - Kiểm tra signing configuration
   - Xem logs trong GitHub Actions

---

## 📚 10. ADDITIONAL RESOURCES

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Flutter Build Documentation](https://docs.flutter.dev/deployment/android)
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Fastlane Documentation](https://docs.fastlane.tools/)

---

## 📞 11. SUPPORT

Nếu gặp vấn đề:

1. Kiểm tra logs: `docker compose logs -f`
2. Kiểm tra GitHub Actions logs
3. Tạo issue trên repository

---

**Last Updated**: 2024-01-XX  
**Version**: 1.0.0  
**Author**: AI Assistant
