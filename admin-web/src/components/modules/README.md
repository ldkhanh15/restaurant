# Chat Module - Admin Dashboard

## Tổng quan

Module chat dành cho admin dashboard cho phép quản lý và tư vấn khách hàng thông qua hệ thống chat real-time với hỗ trợ chatbot.

## Tính năng chính

### 🎯 **Quản lý phiên chat**

- Xem danh sách tất cả phiên chat
- Lọc theo trạng thái (active, closed)
- Tìm kiếm theo tên khách hàng hoặc tin nhắn
- Refresh danh sách real-time

### 💬 **Giao tiếp với khách hàng**

- Gửi tin nhắn text
- Phản hồi nhanh với các template có sẵn
- Gửi file đính kèm
- Xem lịch sử tin nhắn

### 🤖 **Quản lý Bot**

- Bật/tắt chatbot cho từng phiên
- Bot tự động phản hồi khi được bật
- Chuyển đổi giữa bot và nhân viên

### 📊 **Thống kê và báo cáo**

- Thống kê tổng quan về phiên chat
- Phân tích hiệu suất bot vs nhân viên
- Theo dõi tin nhắn chưa đọc
- Thống kê hoạt động theo ngày

### 👤 **Thông tin khách hàng**

- Xem thông tin chi tiết khách hàng
- Lịch sử mua hàng (nếu có)
- Thời gian phiên chat
- Trạng thái và kênh liên hệ

## Cấu trúc Components

### 1. **ChatSystem** (Main Component)

- Component chính quản lý toàn bộ hệ thống chat
- Tích hợp WebSocket cho real-time messaging
- Quản lý state và API calls

### 2. **ChatSessionDetails**

- Hiển thị thông tin chi tiết phiên chat
- Quản lý trạng thái phiên (đóng/mở)
- Điều khiển bot cho phiên

### 3. **ChatStats**

- Thống kê tổng quan
- Biểu đồ phân bố bot vs nhân viên
- Metrics hiệu suất

## API Integration

### Endpoints được sử dụng:

```typescript
// Sessions
GET /chat/sessions/all - Lấy tất cả phiên chat
GET /chat/sessions/{id} - Lấy chi tiết phiên
POST /chat/session - Tạo phiên mới
POST /chat/sessions/{id}/close - Đóng phiên
POST /chat/sessions/{id}/reopen - Mở lại phiên

// Messages
GET /chat/sessions/{id}/messages - Lấy tin nhắn
POST /chat/sessions/{id}/messages - Gửi tin nhắn
PATCH /chat/sessions/{id}/messages/read - Đánh dấu đã đọc

// Bot Management
POST /chat/sessions/{id}/enable-bot - Bật bot
POST /chat/sessions/{id}/disable-bot - Tắt bot
```

## WebSocket Events

### Kết nối:

```typescript
websocketService.connect(token);
```

### Events:

- `messageReceived` - Nhận tin nhắn mới
- `sessionUpdated` - Cập nhật phiên chat
- `typing` - Trạng thái đang gõ

## Cách sử dụng

### 1. **Khởi tạo**

```tsx
import { ChatSystem } from "@/components/modules/chat-system";

export default function ChatPage() {
  return <ChatSystem />;
}
```

### 2. **Cấu hình API**

Đảm bảo `chatService` được cấu hình đúng trong `services/chatService.ts`

### 3. **WebSocket Setup**

WebSocket sẽ tự động kết nối khi component mount với token từ localStorage

## Tính năng nâng cao

### 🔄 **Real-time Updates**

- Tự động cập nhật danh sách phiên chat
- Nhận tin nhắn mới ngay lập tức
- Đồng bộ trạng thái giữa các tab

### 🎨 **UI/UX**

- Responsive design
- Dark/Light mode support
- Loading states và error handling
- Intuitive navigation

### 🔒 **Security**

- JWT authentication
- Role-based access control
- Secure WebSocket connections

## Troubleshooting

### Lỗi thường gặp:

1. **WebSocket không kết nối**

   - Kiểm tra token trong localStorage
   - Đảm bảo server WebSocket đang chạy

2. **API calls thất bại**

   - Kiểm tra base URL trong apiClient
   - Verify authentication headers

3. **Real-time updates không hoạt động**
   - Kiểm tra WebSocket listeners
   - Verify event names match server

## Development

### Thêm tính năng mới:

1. **Thêm API endpoint mới** trong `chatService.ts`
2. **Cập nhật types** trong interfaces
3. **Thêm UI component** nếu cần
4. **Update WebSocket events** nếu có

### Testing:

```bash
# Run linting
npm run lint

# Run type checking
npm run type-check
```

## Dependencies

- React 18+
- TypeScript
- Tailwind CSS
- Radix UI Components
- Lucide React Icons
- Socket.IO Client
