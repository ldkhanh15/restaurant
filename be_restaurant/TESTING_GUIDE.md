# 🧪 Hướng dẫn Testing

## 📋 Tổng quan

Dự án đã được thiết lập đầy đủ unit tests và integration tests cho 4 module chính:

- **Order** (Đơn hàng)
- **Reservation** (Đặt bàn)
- **Chat** (Chat)
- **Auth** (Xác thực)

## 📁 Cấu trúc Test

```
be_restaurant/
├── src/
│   ├── routes/
│   │   └── __tests__/
│   │       ├── authRoutes.test.ts          # Route tests cho Auth
│   │       ├── orderRoutes.test.ts          # Route tests cho Order
│   │       ├── reservationRoutes.test.ts   # Route tests cho Reservation
│   │       └── chatRoutes.test.ts          # Route tests cho Chat
│   ├── controllers/
│   │   └── __tests__/
│   │       ├── authController.test.ts      # Controller tests cho Auth
│   │       ├── orderController.test.ts     # Controller tests cho Order
│   │       ├── reservationController.test.ts # Controller tests cho Reservation
│   │       └── chatController.test.ts      # Controller tests cho Chat
│   ├── services/
│   │   └── __tests__/
│   │       ├── orderService.test.ts         # Service tests cho Order
│   │       ├── reservationService.test.ts  # Service tests cho Reservation
│   │       └── chatService.test.ts          # Service tests cho Chat
│   ├── repositories/
│   │   └── __tests__/
│   │       ├── orderRepository.test.ts      # Repository tests cho Order
│   │       ├── reservationRepository.test.ts # Repository tests cho Reservation
│   │       └── chatRepository.test.ts      # Repository tests cho Chat
│   └── __tests__/
│       ├── setup.ts                        # Jest setup file
│       └── integration/
│           ├── orderFlow.test.ts           # Integration test cho Order flow
│           ├── reservationFlow.test.ts    # Integration test cho Reservation flow
│           ├── authFlow.test.ts           # Integration test cho Auth flow
│           └── chatFlow.test.ts           # Integration test cho Chat flow
├── jest.config.js                          # Jest configuration
└── package.json                            # Test scripts
```

## 🚀 Cài đặt và Chạy Test

### 1. Cài đặt Dependencies

```bash
cd be_restaurant
npm install
```

### 2. Chạy Tất cả Tests

```bash
npm test
```

### 3. Chạy Test với Coverage

```bash
npm run test:coverage
```

Sau khi chạy, mở file `coverage/lcov-report/index.html` trong browser để xem coverage report chi tiết.

### 4. Chạy Test với Watch Mode

```bash
npm run test:watch
```

### 5. Chạy Test theo Module

```bash
# Chỉ test Auth
npm test -- auth

# Chỉ test Order
npm test -- order

# Chỉ test Reservation
npm test -- reservation

# Chỉ test Chat
npm test -- chat
```

### 6. Chạy Test theo Layer

```bash
# Chỉ test Routes
npm test -- routes

# Chỉ test Controllers
npm test -- controllers

# Chỉ test Services
npm test -- services

# Chỉ test Repositories
npm test -- repositories

# Chỉ test Integration
npm test -- integration
```

### 7. Chạy Test cho một File cụ thể

```bash
npm test -- orderRoutes.test.ts
```

## 📊 Test Coverage

### Mục tiêu Coverage

- **Routes**: > 90%
- **Controllers**: > 85%
- **Services**: > 90%
- **Repositories**: > 95%
- **Integration Tests**: Cover tất cả flow chính

### Xem Coverage Report

```bash
npm run test:coverage
```

Sau đó mở: `coverage/lcov-report/index.html`

## 🏗️ Kiến trúc Test

### 1. Route Tests (`routes/__tests__/`)

- **Mục đích**: Test HTTP endpoints
- **Mock**: Controllers, Middlewares
- **Test**: Status codes, Response format, Validation

### 2. Controller Tests (`controllers/__tests__/`)

- **Mục đích**: Test request/response handling
- **Mock**: Services
- **Test**: Business logic flow, Error handling

### 3. Service Tests (`services/__tests__/`)

- **Mục đích**: Test business logic
- **Mock**: Repositories
- **Test**: Validation, Business rules, Error handling

### 4. Repository Tests (`repositories/__tests__/`)

- **Mục đích**: Test database operations
- **Mock**: Sequelize Models
- **Test**: CRUD operations, Queries, Filters

### 5. Integration Tests (`__tests__/integration/`)

- **Mục đích**: Test flow đầy đủ từ route đến database
- **Mock**: Chỉ mock ở tầng thấp nhất (Models)
- **Test**: End-to-end flow, Verify tất cả layers hoạt động cùng nhau

## 📝 Test Examples

### Route Test Example

```typescript
it("Kiểm tra tạo đơn hàng thành công", async () => {
  const response = await request(app)
    .post("/api/orders/")
    .send({ table_id: "table-456" })
    .set("Authorization", "Bearer valid-token");

  expect(response.status).toBe(201);
  expect(response.body.status).toBe("success");
});
```

### Service Test Example

```typescript
it("Kiểm tra tạo đơn hàng thành công", async () => {
  MockOrderRepository.create = jest.fn().mockResolvedValue(mockOrder);

  const result = await orderService.createOrder(orderData);

  expect(MockOrderRepository.create).toHaveBeenCalled();
  expect(result).toBeDefined();
});
```

### Integration Test Example

```typescript
it("Kiểm tra flow tạo đơn hàng đầy đủ từ route đến repository", async () => {
  MockOrder.create = jest.fn().mockResolvedValue(mockOrder);

  const response = await request(app)
    .post("/api/orders/")
    .send({ table_id: "table-456" })
    .set("Authorization", "Bearer valid-token");

  expect(response.status).toBe(201);
  expect(MockOrder.create).toHaveBeenCalled();
});
```

## 🔍 Test Strategy

### Unit Tests

- **Isolation**: Mỗi test độc lập
- **Mocking**: Mock tất cả dependencies
- **Speed**: Chạy nhanh, không cần database thật

### Integration Tests

- **Real Flow**: Test flow thật từ route đến database
- **Minimal Mocking**: Chỉ mock ở model level
- **Coverage**: Test tất cả flow chính

## 🐛 Troubleshooting

### Lỗi: Cannot find module 'supertest'

```bash
npm install --save-dev supertest @types/supertest
```

### Lỗi: Jest types không được nhận diện

```bash
npm install --save-dev @types/jest
```

### Lỗi: Mock không hoạt động

- Đảm bảo `jest.mock()` được đặt trước khi import
- Kiểm tra path của mock có đúng không
- Sử dụng `jest.clearAllMocks()` trong `beforeEach`

### Test chạy chậm

- Đảm bảo đang mock database calls
- Kiểm tra timeout trong `jest.config.js` (hiện tại 10000ms)
- Giảm số lượng tests chạy song song

## 📈 Best Practices

1. **Test Naming**: Sử dụng tiếng Việt mô tả rõ ràng
2. **Arrange-Act-Assert**: Cấu trúc test rõ ràng
3. **Mock Strategy**: Mock dependencies, không mock code đang test
4. **Coverage**: Test cả happy path và error cases
5. **Isolation**: Mỗi test phải độc lập
6. **Cleanup**: Sử dụng `beforeEach`/`afterEach` để cleanup

## 🎯 Test Checklist

### Route Tests

- [x] Test tất cả HTTP methods (GET, POST, PUT, PATCH, DELETE)
- [x] Test validation errors
- [x] Test authentication/authorization
- [x] Test status codes
- [x] Test response format

### Controller Tests

- [x] Test request handling
- [x] Test response formatting
- [x] Test error handling
- [x] Test business logic flow

### Service Tests

- [x] Test business logic
- [x] Test validation
- [x] Test error handling
- [x] Test data transformation

### Repository Tests

- [x] Test CRUD operations
- [x] Test queries và filters
- [x] Test pagination
- [x] Test error handling

### Integration Tests

- [x] Test flow đầy đủ từ route đến database
- [x] Test tất cả flow chính
- [x] Verify data flow qua các layers

## 📚 Tài liệu tham khảo

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
