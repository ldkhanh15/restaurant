# 🚀 Quick Start Guide

## Phân tích nhanh các folder

| Folder            | Tech Stack     | Dev Command            | Build Command       | Port      | Database |
| ----------------- | -------------- | ---------------------- | ------------------- | --------- | -------- |
| **admin-app**     | Expo/RN        | `npm start`            | `eas build`         | 19000     | -        |
| **admin-web**     | Next.js        | `npm run dev`          | `npm run build`     | 3000/3002 | -        |
| **be_restaurant** | Express/TS     | `npm run dev`          | `npm run build`     | 3000      | MySQL    |
| **chatbot**       | FastAPI/Python | `python api_server.py` | -                   | 7860      | -        |
| **user-app**      | Flutter        | `flutter run`          | `flutter build apk` | -         | -        |
| **user-web**      | Next.js        | `npm run dev`          | `npm run build`     | 3000/3001 | -        |

## Docker Compose - Quick Start

### 1. Tạo file `.env`

```bash
cp .env.example .env  # Nếu có
# Hoặc tạo file .env với nội dung:
```

```env
DB_ROOT_PASSWORD=rootpassword
DB_NAME=restaurant_db
DB_USER=restaurant_user
DB_PASSWORD=restaurant_password
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-key
```

### 2. Chạy hệ thống

```bash
# Build và chạy tất cả
docker compose up --build

# Chạy ở background
docker compose up -d --build

# Xem logs
docker compose logs -f

# Dừng
docker compose down
```

### 3. Truy cập services

- Backend API: http://localhost:3000/api
- Admin Web: http://localhost:3002
- User Web: http://localhost:3001
- Chatbot API: http://localhost:7860/api
- MySQL: localhost:3306

## Development (Local)

### Backend

```bash
cd be_restaurant
npm install
npm run dev
```

### Admin Web

```bash
cd admin-web
npm install
npm run dev
```

### User Web

```bash
cd user-web
npm install
npm run dev -p 3001
```

### Chatbot

```bash
cd chatbot
pip install -r requirements.txt
python api_server.py
```

## Mobile Builds

### Flutter

```bash
cd user-app/restaurant_reservation_app
flutter pub get
flutter build apk --release
```

### React Native (Expo)

```bash
cd admin-app
npm install
eas build --platform android
```

## CI/CD

GitHub Actions workflows sẽ tự động:

- Build và test khi push code
- Build Docker images
- Deploy khi merge vào `main`

Xem chi tiết trong `.github/workflows/`

## Notes

⚠️ **Next.js**: Đã cập nhật `next.config.mjs` để hỗ trợ Docker standalone build

⚠️ **Database**: Đảm bảo MySQL đã chạy trước khi start backend

⚠️ **Ports**: Admin-web và User-web đã được cấu hình port khác nhau trong docker-compose

Xem chi tiết đầy đủ trong `DEPLOYMENT_GUIDE.md`
