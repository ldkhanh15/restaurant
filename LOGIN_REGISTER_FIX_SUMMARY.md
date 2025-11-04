# 🔧 Fix Login/Register Routes & API Integration

## ✅ Đã Hoàn Thành

### 1. **Tạo Next.js Routes**

**Files Created:**

- ✅ `user-web/app/login/page.tsx` - Next.js route cho `/login`
- ✅ `user-web/app/register/page.tsx` - Next.js route cho `/register`

**Features:**

- Auto-redirect nếu user đã đăng nhập
- Wrap LoginPage/RegisterPage components
- Sử dụng Next.js routing thay vì custom router

### 2. **Update Auth Service**

**File:** `user-web/services/authService.ts`

- ✅ Thêm `signup(data)` method:
  ```typescript
  signup: async (data: SignupRequest): Promise<SignupResponse>
  ```
- ✅ Interface `SignupRequest` và `SignupResponse`
- ✅ Body structure khớp với backend:
  ```typescript
  {
    username: string;
    email: string;
    password: string;
    full_name?: string;
    phone?: string;
    role?: "customer" | "employee" | "admin";
  }
  ```

### 3. **Update Auth Context**

**File:** `user-web/lib/auth.tsx`

- ✅ **Update `register` function:**
  - Gọi `authService.signup()` với API thực
  - Body khớp với backend: `username`, `email`, `password`, `full_name`, `phone`, `role`
  - Lưu token sau khi signup thành công
  - Gọi `/auth/me` để lấy full user info
  - Auto-save token và user data

### 4. **Update Login/Register Components**

**File:** `user-web/components/login-page.tsx`

- ✅ Gọi API thực qua `authService.login()`
- ✅ Error handling với try/catch
- ✅ Redirect về `/` sau khi login thành công
- ✅ Display error messages từ API

**File:** `user-web/components/register-page.tsx`

- ✅ Gọi API thực qua `authService.signup()`
- ✅ Error handling với try/catch
- ✅ Redirect về `/` sau khi register thành công
- ✅ Display error messages từ API

### 5. **Update Chat Test Page**

**File:** `user-web/app/chat-test/page.tsx`

- ✅ Fix redirect sử dụng `window.location.href = "/login"`
- ✅ Remove dependency on Next.js router cho redirect

---

## 📋 API Body Structures

### **Login API** (`POST /api/auth/login`)

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "username": "username",
      "email": "user@example.com",
      "role": "customer"
    },
    "token": "jwt_token_here"
  }
}
```

### **Signup API** (`POST /api/auth/signup`)

```json
{
  "username": "username",
  "email": "user@example.com",
  "password": "password123",
  "full_name": "Full Name",
  "phone": "0901234567",
  "role": "customer"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "username": "username",
      "email": "user@example.com",
      "role": "customer"
    },
    "token": "jwt_token_here"
  }
}
```

### **Get Current User** (`GET /api/auth/me`)

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "username": "username",
    "email": "user@example.com",
    "phone": "0901234567",
    "role": "customer",
    "full_name": "Full Name",
    "ranking": "Thành Viên",
    "points": 0
  }
}
```

---

## 🔧 Routing Structure

### **Next.js App Router:**

```
user-web/app/
├── login/
│   └── page.tsx (✅ NEW - Route /login)
├── register/
│   └── page.tsx (✅ NEW - Route /register)
├── chat-test/
│   └── page.tsx (Route /chat-test)
└── page.tsx (Route /)
```

### **Custom Router (lib/router.tsx):**

- Vẫn hoạt động cho navigation trong SPA
- Routes được map:
  - `"login"` → `/login`
  - `"register"` → `/register`
  - `"home"` → `/`

---

## 🚀 Flow Hoàn Chỉnh

### **1. User truy cập `/login`:**

1. Next.js route `/login/page.tsx` được load
2. Render `LoginPage` component
3. User nhập email/password
4. Submit → Gọi `authService.login()`
5. Nhận token → Lưu vào localStorage
6. Gọi `/auth/me` để lấy full user info
7. Redirect về `/`

### **2. User truy cập `/register`:**

1. Next.js route `/register/page.tsx` được load
2. Render `RegisterPage` component
3. User điền form (username, email, password, full_name, phone)
4. Submit → Gọi `authService.signup()`
5. Nhận token → Lưu vào localStorage
6. Gọi `/auth/me` để lấy full user info
7. Redirect về `/`

### **3. User truy cập `/chat-test`:**

1. Check authentication (token & user)
2. Nếu chưa có → Redirect to `/login`
3. Nếu đã có:
   - Load active session
   - Connect WebSocket với token
   - Hiển thị chat interface

---

## 📝 Files Created/Updated

### **New Files:**

1. ✅ `user-web/app/login/page.tsx`
2. ✅ `user-web/app/register/page.tsx`

### **Updated Files:**

1. ✅ `user-web/services/authService.ts` - Thêm signup method
2. ✅ `user-web/lib/auth.tsx` - Update register function
3. ✅ `user-web/components/login-page.tsx` - Error handling
4. ✅ `user-web/components/register-page.tsx` - Error handling
5. ✅ `user-web/app/chat-test/page.tsx` - Fix redirect

---

## ✅ Testing Checklist

- [x] Route `/login` hoạt động
- [x] Route `/register` hoạt động
- [x] Login gọi API `/auth/login` đúng body
- [x] Register gọi API `/auth/signup` đúng body
- [x] Token được lưu sau login/register
- [x] User info được lấy từ `/auth/me`
- [x] Redirect về `/` sau khi đăng nhập/đăng ký
- [x] Error messages hiển thị đúng
- [x] Auto-redirect nếu đã đăng nhập
- [x] Chat test page redirect nếu chưa đăng nhập

---

**🎉 Hoàn thành fix login/register routes và API integration!**
