# API UserBehavior

## 1. Ghi nhận hành vi người dùng

```
POST /api/user-behavior
```

### Request Body
```json
{
  "user_id": "uuid-của-user",
  "item_id": "uuid-của-món-ăn",
  "action_type": "VIEW" // hoặc CLICK, ORDER, CANCEL, SEARCH
}
```

Khi action_type là SEARCH:
```json
{
  "user_id": "uuid-của-user",
  "action_type": "SEARCH",
  "search_query": "tên món ăn cần tìm"
}
```

## 2. Lấy danh sách món ăn được gợi ý

```
GET /api/dishes?user_id=uuid-của-user&page=1&limit=10
```

### Query Parameters
- `user_id`: ID của người dùng (bắt buộc)
- `page`: Số trang (mặc định: 1)
- `limit`: Số lượng kết quả mỗi trang (mặc định: 10)

## 3. Lấy tất cả hành vi người dùng

```
GET /api/user-behaviors?page=1&limit=20&action_type=VIEW
```

### Query Parameters
- `page`: Số trang (mặc định: 1)
- `limit`: Số lượng kết quả mỗi trang (mặc định: 20)
- `action_type`: Lọc theo loại hành động (không bắt buộc)

### Response
```json
{
  "success": true,
  "count": 100,
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 5
  },
  "data": [
    {
      "id": "uuid",
      "user_id": "user-uuid",
      "item_id": "dish-uuid",
      "action_type": "VIEW",
      "search_query": null,
      "timestamp": "2025-10-04T10:30:00.000Z"
    },
    // ...
  ]
}
```

## 4. Lấy hành vi của một người dùng cụ thể

```
GET /api/user-behaviors/:user_id?page=1&limit=20&action_type=VIEW
```

### Path Parameters
- `user_id`: ID của người dùng

### Query Parameters
- `page`: Số trang (mặc định: 1)
- `limit`: Số lượng kết quả mỗi trang (mặc định: 20)
- `action_type`: Lọc theo loại hành động (không bắt buộc)

### Response
```json
{
  "success": true,
  "count": 50,
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 3
  },
  "data": [
    {
      "id": "uuid",
      "user_id": "user-uuid-được-chỉ-định",
      "item_id": "dish-uuid",
      "action_type": "VIEW",
      "search_query": null,
      "timestamp": "2025-10-04T10:30:00.000Z"
    },
    // ...
  ]
}
```

## Loại hành vi (action_type)
- `VIEW`: Người dùng xem chi tiết món ăn (+1 điểm)
- `CLICK`: Người dùng click vào món ăn (+3 điểm)
- `ORDER`: Người dùng đặt món ăn (+10 điểm)
- `CANCEL`: Người dùng hủy đặt món ăn (-5 điểm)
- `SEARCH`: Người dùng tìm kiếm món ăn