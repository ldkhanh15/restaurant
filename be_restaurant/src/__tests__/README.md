# Unit Tests và Integration Tests

## 📋 Tổng quan

Thư mục này chứa các test cho toàn bộ các layer của ứng dụng:

### Repository Tests (`repositories/__tests__/`)

- `orderRepository.test.ts` - Test cho OrderRepository
- `reservationRepository.test.ts` - Test cho ReservationRepository
- `chatRepository.test.ts` - Test cho ChatRepository

### Service Tests (`services/__tests__/`)

- `orderService.test.ts` - Test cho OrderService
- `reservationService.test.ts` - Test cho ReservationService
- `chatService.test.ts` - Test cho ChatService

### Controller Tests (`controllers/__tests__/`)

- `authController.test.ts` - Test cho AuthController

### Integration Tests (`__tests__/integration/`)

- `orderFlow.test.ts` - Integration test cho flow Order (route -> controller -> service -> repository)
- `reservationFlow.test.ts` - Integration test cho flow Reservation
- `authFlow.test.ts` - Integration test cho flow Auth
- `chatFlow.test.ts` - Integration test cho flow Chat

## 🏗️ Kiến trúc Test

### 1. Repository Layer Tests

- **Mục đích**: Test các hàm truy cập database
- **Mock**: Sequelize Models (Order, User, Table, etc.)
- **Test**: CRUD operations, filters, queries

### 2. Service Layer Tests

- **Mục đích**: Test business logic
- **Mock**: Repository layer
- **Test**: Validation, business rules, error handling

### 3. Controller Layer Tests

- **Mục đích**: Test request/response handling
- **Mock**: Service layer
- **Test**: HTTP status codes, response format, error handling

### 4. Integration Tests

- **Mục đích**: Test flow đầy đủ từ route đến database
- **Mock**: Chỉ mock ở tầng thấp nhất (Models)
- **Test**: End-to-end flow, verify tất cả các layer hoạt động cùng nhau

## 🧪 Chạy Tests

### Chạy tất cả tests

```bash
npm test
```

### Chạy tests theo layer

```bash
# Repository tests only
npm test -- repositories

# Service tests only
npm test -- services

# Controller tests only
npm test -- controllers

# Integration tests only
npm test -- integration
```

### Chạy test cho một file cụ thể

```bash
npm test -- orderRepository.test.ts
```

### Chạy test với coverage

```bash
npm run test:coverage
```

## 📊 Coverage Goals

- **Repository Layer**: > 95%
- **Service Layer**: > 90%
- **Controller Layer**: > 85%
- **Integration Tests**: Cover tất cả các flow chính

## 🔍 Test Strategy

### Repository Tests

- Mock Sequelize models
- Test các query methods
- Test error handling
- Test filters và pagination

### Service Tests

- Mock repository layer
- Test business logic
- Test validation
- Test error handling và AppError

### Controller Tests

- Mock service layer
- Test HTTP responses
- Test status codes
- Test error handling

### Integration Tests

- Mock chỉ ở model level
- Test flow đầy đủ
- Verify data flow qua các layer
- Test real interactions giữa các components

## 📝 Best Practices

1. **Isolation**: Mỗi test phải độc lập, không phụ thuộc vào test khác
2. **Mocking**: Chỉ mock dependencies, không mock code đang test
3. **Coverage**: Đảm bảo test cả happy path và error cases
4. **Naming**: Tên test phải mô tả rõ ràng điều gì đang được test
5. **Setup/Teardown**: Sử dụng beforeEach/afterEach để cleanup

## 🐛 Troubleshooting

### Lỗi: Cannot find module

```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
```

### Lỗi: Mock không hoạt động

- Đảm bảo mock được đặt trước khi import module
- Kiểm tra path của mock có đúng không
- Sử dụng `jest.clearAllMocks()` trong beforeEach

### Test chạy chậm

- Đảm bảo đang mock database calls
- Kiểm tra timeout trong jest.config.js
- Tối ưu hóa số lượng tests chạy song song
