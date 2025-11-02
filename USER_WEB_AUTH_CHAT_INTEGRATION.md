# 🔐 User-Web Authentication & Chat Integration

## ✅ Đã Hoàn Thành

### 1. **Backend - Thêm API Route cho Active User Session**

**File:** `be_restaurant/src/routes/chatRoutes.ts`

- ✅ Thêm route: `GET /chat/user/session/active`
- ✅ Controller: `getActiveUserSession` trong `chatController.ts`
- ✅ Logic: Lấy active session hoặc tạo mới nếu chưa có

**File:** `be_restaurant/src/controllers/chatController.ts`

- ✅ Thêm function `getActiveUserSession`:
  - Lấy active session từ `getActiveSession(userId)`
  - Nếu không có, tạo mới bằng `getUserSession(userId)`

### 2. **Frontend - Auth Service & API Client**

**File:** `user-web/services/authService.ts` (NEW)

- ✅ `login(email, password)` - Gọi API `/auth/login`
- ✅ `getCurrentUser()` - Gọi API `/auth/me`
- ✅ `validateToken()` - Validate token

**File:** `user-web/lib/apiClient.ts` (NEW)

- ✅ API client với fetch wrapper
- ✅ Auto-inject Bearer token từ localStorage
- ✅ Error handling với response data

### 3. **Frontend - Auth Context Update**

**File:** `user-web/lib/auth.tsx`

- ✅ **Thêm token state:**

  - `token: string | null` - Lưu JWT token
  - Lưu vào `localStorage.getItem("auth_token")`

- ✅ **Update login function:**

  - Gọi `authService.login()` thực sự với backend
  - Lưu token vào localStorage
  - Gọi `/auth/me` để lấy full user info
  - Auto-save token và user data

- ✅ **Update logout function:**

  - Xóa cả token và user data

- ✅ **Thêm refreshUser function:**

  - Refresh user info từ `/auth/me`

- ✅ **Auto-validate token on mount:**
  - Load token từ localStorage
  - Validate với `/auth/me`
  - Clear nếu token invalid

### 4. **Frontend - Chat Test Page Update**

**File:** `user-web/app/chat-test/page.tsx`

- ✅ **Authentication Required:**

  - Redirect to `/login` nếu chưa đăng nhập
  - Check `token` và `user` từ `useAuth()`

- ✅ **WebSocket với Token:**

  - Pass token vào WebSocket `auth` object
  - Connect to `/customer` namespace

- ✅ **Session Management:**

  - Gọi `/chat/user/session/active` để lấy active session
  - Tạo mới nếu chưa có
  - Load messages khi có session

- ✅ **UI Improvements:**
  - Hiển thị username badge
  - Error alerts
  - Loading states

### 5. **Chat Service Types**

**File:** `user-web/services/chatService.ts`

- ✅ Thêm `ApiResponse<T>` interface
- ✅ Type-safe methods với proper return types
- ✅ Fix tất cả TypeScript errors

---

## 📋 API Routes Sử Dụng

### **Authentication:**

- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại
- `GET /api/auth/validate` - Validate token

### **Chat:**

- `GET /api/chat/user/session/active` - Lấy active session (NEW)
- `POST /api/chat/session` - Tạo session mới
- `GET /api/chat/sessions/:id/messages` - Lấy tin nhắn
- `POST /api/chat/sessions/:id/messages` - Gửi tin nhắn

---

## 🔧 WebSocket Connection

### **Connection Flow:**

1. User đăng nhập → Nhận token
2. Lưu token vào `localStorage.getItem("auth_token")`
3. Connect WebSocket với:
   ```typescript
   io.default(`${API_URL}/customer`, {
     auth: { token: token },
   });
   ```
4. Backend validate token và connect user

---

## 🚀 Cách Sử Dụng

### **1. Đăng nhập:**

1. Vào `/login`
2. Nhập email/password
3. Submit → Token được lưu tự động
4. Redirect về trang chủ hoặc `/chat-test`

### **2. Test Chat:**

1. Truy cập `/chat-test`
2. Nếu chưa đăng nhập → Redirect to `/login`
3. Nếu đã đăng nhập:
   - Auto-connect WebSocket với token
   - Load active session
   - Hiển thị chat interface

### **3. WebSocket Status:**

- ✅ Connection status hiển thị real-time
- ✅ Auto-reconnect nếu disconnect
- ✅ Token được gửi trong mỗi connection

---

## 📝 Files Created/Updated

### **Backend:**

1. ✅ `be_restaurant/src/routes/chatRoutes.ts` - Thêm route
2. ✅ `be_restaurant/src/controllers/chatController.ts` - Thêm controller

### **Frontend:**

1. ✅ `user-web/services/authService.ts` - NEW
2. ✅ `user-web/lib/apiClient.ts` - NEW
3. ✅ `user-web/lib/auth.tsx` - Updated
4. ✅ `user-web/app/chat-test/page.tsx` - Updated
5. ✅ `user-web/services/chatService.ts` - Updated types

---

## ⚠️ Lưu Ý

1. **Token Storage:**

   - Token được lưu trong `localStorage.getItem("auth_token")`
   - Auto-inject vào mọi API request
   - Auto-inject vào WebSocket auth

2. **Error Handling:**

   - API errors được catch và hiển thị
   - Token invalid → Auto logout
   - WebSocket errors → Show status

3. **Session Management:**
   - Mỗi user chỉ có 1 active session
   - Auto-create nếu chưa có
   - Session được lưu theo `user_id`

---

## ✅ Testing Checklist

- [x] Login với backend API
- [x] Token được lưu và inject
- [x] Get current user info từ `/auth/me`
- [x] WebSocket connect với token
- [x] Get active session từ `/chat/user/session/active`
- [x] Load messages từ session
- [x] Send message qua API
- [x] Receive real-time messages qua WebSocket
- [x] Error handling cho unauthorized
- [x] Auto-redirect khi chưa đăng nhập

---

**🎉 Hoàn thành tích hợp authentication và chat cho user-web!**
