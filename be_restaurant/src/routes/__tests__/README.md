# Unit Tests cho Routes

## 📋 Tổng quan

Thư mục này chứa các unit test cho 4 module routes chính:

- `authRoutes.test.ts` - Test cho authentication routes
- `orderRoutes.test.ts` - Test cho order management routes
- `reservationRoutes.test.ts` - Test cho reservation routes
- `chatRoutes.test.ts` - Test cho chat routes

## 🚀 Cài đặt

Trước khi chạy test, cần cài đặt các dependencies:

```bash
npm install
```

## 🧪 Chạy Test

### Chạy tất cả test

```bash
npm test
```

### Chạy test với watch mode (tự động chạy lại khi có thay đổi)

```bash
npm run test:watch
```

### Chạy test với coverage report

```bash
npm run test:coverage
```

### Chạy test cho một file cụ thể

```bash
npm test -- authRoutes.test.ts
```

### Chạy test với pattern

```bash
npm test -- --testNamePattern="Kiểm tra đăng nhập"
```

## 📊 Coverage

Mục tiêu coverage: **> 90%** cho 4 module routes.

Để xem coverage report chi tiết:

```bash
npm run test:coverage
```

Sau đó mở file `coverage/lcov-report/index.html` trong browser.

## 🏗️ Cấu trúc Test

Mỗi file test bao gồm:

1. **Setup**: Mock các dependencies (controllers, middlewares, services)
2. **Test Cases**:
   - Test các trường hợp thành công
   - Test các trường hợp thất bại (validation errors, unauthorized, not found)
   - Test các edge cases

## 📝 Ghi chú

- Tất cả test đều mock các dependencies để đảm bảo test độc lập
- Sử dụng `supertest` để test HTTP endpoints
- Mock `authenticate` và `authorize` middlewares để test authorization logic
- Mock các services và models để tránh phụ thuộc vào database

## 🔧 Troubleshooting

### Lỗi: Cannot find module

```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
```

### Lỗi: TypeScript compilation

```bash
# Kiểm tra tsconfig.json và đảm bảo jest.config.js đúng cấu hình
```

### Test chạy chậm

- Đảm bảo đang mock tất cả database calls
- Kiểm tra timeout trong jest.config.js (hiện tại là 10000ms)
