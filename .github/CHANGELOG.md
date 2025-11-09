# 📋 CI/CD Configuration - Changelog

## 🎯 Tổng quan

Đã hoàn thiện và tối ưu hệ thống CI/CD cho dự án Restaurant Management System với các cải tiến về quản lý environment variables, error handling, và documentation.

## ✨ Các thay đổi chính

### 1. Cập nhật Workflows (`.github/workflows/`)

#### ✅ `deploy-admin-web.yml` & `deploy-user-web.yml`

- **Thêm:** Tự động set environment variables cho Vercel từ GitHub Secrets
  - `NEXT_PUBLIC_API_URL` từ `BACKEND_API_URL` secret
  - `NEXT_PUBLIC_WS_URL` từ `BACKEND_WS_URL` secret
- **Cải thiện:** Error handling với `continue-on-error: true`
- **Cải thiện:** Better logging và deployment status

#### ✅ `deploy-backend.yml`

- **Thêm:** Hiển thị danh sách environment variables cần set trong Render Dashboard
- **Cải thiện:** Dynamic environment URL từ secrets
- **Cải thiện:** Better deployment status messages

#### ✅ `deploy-chatbot.yml`

- **Thêm:** Tự động tạo `.env` file khi deploy lên EC2
- **Thêm:** Hiển thị danh sách environment variables cần set cho Render
- **Cải thiện:** Dynamic service URLs từ secrets
- **Cải thiện:** Better error handling cho EC2 deployment

### 2. Cập nhật Environment Templates

#### ✅ `be_restaurant/env.template`

- **Thêm:** Comments chi tiết về từng variable
- **Thêm:** Hướng dẫn cho production deployment
- **Thêm:** Examples cho Render PostgreSQL
- **Cải thiện:** Better organization với sections

#### ✅ `admin-web/env.template` & `user-web/env.template`

- **Thêm:** `NEXT_PUBLIC_WS_URL` variable (trước đây thiếu)
- **Thêm:** Comments về production URLs
- **Thêm:** Hướng dẫn set trong Vercel Dashboard
- **Cải thiện:** Better documentation

#### ✅ `chatbot/env.template`

- **Thêm:** Comments về production deployment
- **Thêm:** Hướng dẫn cho Render và EC2
- **Cải thiện:** Better organization

### 3. Documentation

#### ✅ `.github/CI_CD_ENV_SETUP.md` (MỚI)

File hướng dẫn chi tiết về:

- Tất cả GitHub Secrets cần thiết
- Environment variables cho từng service (Vercel, Render, EC2)
- Service URLs mapping và dependencies
- Quick setup checklist
- Troubleshooting guide
- Cách lấy các credentials từ các platforms

#### ✅ `.github/README.md` (MỚI)

- Tổng quan về CI/CD configuration
- Quick start guide
- Workflow improvements summary
- Links đến các resources

### 4. Helper Scripts

#### ✅ `scripts/generate-env.js` (MỚI)

Script Node.js để generate `.env` files từ templates:

- Support interactive mode
- Generate cho tất cả services hoặc service cụ thể
- Preserve comments và structure
- Check existing files

#### ✅ `scripts/setup-env.sh` (MỚI)

Script bash đơn giản để copy templates:

- Copy tất cả templates sang `.env` files
- Skip nếu file đã tồn tại
- Quick setup cho development

#### ✅ `package.json`

- **Thêm:** Scripts `generate-env` và `generate-env:interactive`

## 🔑 GitHub Secrets Cần Thêm

### Bắt buộc:

1. `VERCEL_TOKEN` - Vercel API token
2. `VERCEL_ORG_ID` - Vercel Organization ID
3. `VERCEL_ADMIN_WEB_PROJECT_ID` - Admin Web project ID
4. `VERCEL_USER_WEB_PROJECT_ID` - User Web project ID
5. `RENDER_API_KEY` - Render API key
6. `RENDER_BACKEND_SERVICE_ID` - Backend service ID
7. `RENDER_CHATBOT_SERVICE_ID` - Chatbot service ID
8. `BACKEND_API_URL` - Backend production URL (e.g., `https://your-backend.onrender.com`)
9. `BACKEND_WS_URL` - Backend WebSocket URL (e.g., `wss://your-backend.onrender.com`)
10. `CHATBOT_URL` - Chatbot production URL (e.g., `https://your-chatbot.onrender.com`)
11. `GEMINI_API_KEY` - Google Gemini API key

### Tùy chọn (cho EC2):

- `EC2_SERVER_IP`
- `EC2_SERVER_USER`
- `EC2_SSH_KEY`
- `EC2_SSH_PORT`

## 📝 Environment Variables Cần Set

### Vercel (Admin Web & User Web)

- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_WS_URL` - Backend WebSocket URL
- `NODE_ENV=production`

### Render (Backend)

- Database: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- JWT: `JWT_SECRET`, `JWT_EXPIRES_IN`
- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- VNPay: `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNP_URL`
- URLs: `CLIENT_URL`, `CHATBOT_URL`

### Render (Chatbot)

- `BE_URL` - Backend API URL
- `GEMINI_API_KEY` - Gemini API key

## 🚀 Cách Sử Dụng

### 1. Setup Secrets

```bash
# Vào GitHub Repository → Settings → Secrets and variables → Actions
# Thêm tất cả secrets theo danh sách ở trên
```

### 2. Setup Environment Files (Development)

```bash
# Option 1: Dùng script helper
npm run generate-env

# Option 2: Copy thủ công
cp be_restaurant/env.template be_restaurant/.env
cp admin-web/env.template admin-web/.env.local
cp user-web/env.template user-web/.env.local
cp chatbot/env.template chatbot/.env
```

### 3. Setup Production Environment Variables

- **Vercel:** Vào Dashboard → Project → Settings → Environment Variables
- **Render:** Vào Dashboard → Service → Environment

### 4. Deploy

```bash
# Push code vào main hoặc develop branch
git push origin main

# Workflows sẽ tự động chạy
# Hoặc trigger manual từ GitHub Actions tab
```

## 📚 Tài liệu Tham Khảo

- [CI_CD_ENV_SETUP.md](./CI_CD_ENV_SETUP.md) - Hướng dẫn chi tiết về secrets và env variables
- [README.md](./README.md) - Tổng quan về CI/CD configuration
- [../docs/CI_CD_GUIDE.md](../docs/CI_CD_GUIDE.md) - Hướng dẫn CI/CD tổng quan

## ⚠️ Lưu Ý

1. **Không commit `.env` files** - Chỉ commit `env.template` files
2. **Rotate secrets định kỳ** - Đổi passwords và API keys định kỳ
3. **Kiểm tra URLs** - Đảm bảo các service URLs đúng và accessible
4. **Test sau khi deploy** - Verify các service có thể gọi nhau
5. **Monitor logs** - Kiểm tra logs trong GitHub Actions, Vercel, và Render

## 🔄 Next Steps

1. ✅ Thêm tất cả GitHub Secrets
2. ✅ Setup Vercel projects và environment variables
3. ✅ Setup Render services và environment variables
4. ✅ Test deployment workflow
5. ✅ Monitor và optimize

---

**Date:** 2024-12-XX  
**Version:** 1.0.0
