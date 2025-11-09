# 🚀 CI/CD Configuration

Thư mục này chứa các cấu hình CI/CD cho dự án Restaurant Management System.

## 📁 Cấu trúc

```
.github/
├── workflows/              # GitHub Actions workflows
│   ├── deploy-admin-web.yml
│   ├── deploy-user-web.yml
│   ├── deploy-backend.yml
│   └── deploy-chatbot.yml
├── CI_CD_ENV_SETUP.md      # Hướng dẫn chi tiết về secrets và env variables
└── README.md               # File này
```

## 🔧 Workflows

### 1. Deploy Admin Web (`deploy-admin-web.yml`)

**Platform:** Vercel  
**Trigger:** Push vào `main`/`develop` với thay đổi trong `admin-web/**`

**Tính năng:**

- Tự động build và deploy lên Vercel
- Set environment variables từ GitHub Secrets
- Comment deployment URL trên PR

### 2. Deploy User Web (`deploy-user-web.yml`)

**Platform:** Vercel  
**Trigger:** Push vào `main`/`develop` với thay đổi trong `user-web/**`

**Tính năng:**

- Tự động build và deploy lên Vercel
- Set environment variables từ GitHub Secrets
- Comment deployment URL trên PR

### 3. Deploy Backend (`deploy-backend.yml`)

**Platform:** Render  
**Trigger:** Push vào `main`/`develop` với thay đổi trong `be_restaurant/**`

**Tính năng:**

- Build và test TypeScript
- Build Docker image
- Push image lên GitHub Container Registry
- Deploy lên Render
- Hiển thị danh sách environment variables cần set

### 4. Deploy Chatbot (`deploy-chatbot.yml`)

**Platform:** Render hoặc EC2  
**Trigger:** Push vào `main`/`develop` với thay đổi trong `chatbot/**`

**Tính năng:**

- Build Docker image
- Deploy lên Render (mặc định) hoặc EC2 (manual trigger)
- Tự động tạo `.env` file khi deploy lên EC2
- Hỗ trợ chọn deployment target qua manual trigger

## 🔐 Secrets & Environment Variables

Xem file [CI_CD_ENV_SETUP.md](./CI_CD_ENV_SETUP.md) để biết chi tiết về:

- Tất cả GitHub Secrets cần thiết
- Environment variables cho từng service
- Cách lấy và cấu hình các secrets
- Service URLs mapping
- Troubleshooting guide

## 🚀 Quick Start

### 1. Setup GitHub Secrets

Vào **GitHub Repository → Settings → Secrets and variables → Actions** và thêm:

**Bắt buộc:**

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_ADMIN_WEB_PROJECT_ID`
- `VERCEL_USER_WEB_PROJECT_ID`
- `RENDER_API_KEY`
- `RENDER_BACKEND_SERVICE_ID`
- `RENDER_CHATBOT_SERVICE_ID`
- `BACKEND_API_URL`
- `BACKEND_WS_URL`
- `CHATBOT_URL`
- `GEMINI_API_KEY`

**Tùy chọn (cho EC2):**

- `EC2_SERVER_IP`
- `EC2_SERVER_USER`
- `EC2_SSH_KEY`
- `EC2_SSH_PORT`

### 2. Setup Vercel Projects

1. Tạo project cho Admin Web và User Web trên Vercel
2. Set environment variables trong Vercel Dashboard:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_WS_URL`
   - `NODE_ENV=production`

### 3. Setup Render Services

1. Tạo Backend service trên Render
2. Tạo Chatbot service trên Render
3. Set tất cả environment variables trong Render Dashboard (xem [CI_CD_ENV_SETUP.md](./CI_CD_ENV_SETUP.md))

### 4. Test Deployment

1. Push code vào `main` hoặc `develop` branch
2. Kiểm tra GitHub Actions workflows
3. Verify các service deploy thành công

## 📝 Environment Files

Mỗi service có file `env.template` chứa:

- Tất cả environment variables cần thiết
- Comments giải thích từng variable
- Production URLs examples

**Sử dụng:**

```bash
# Copy template to .env (development)
cp be_restaurant/env.template be_restaurant/.env
cp admin-web/env.template admin-web/.env.local
cp user-web/env.template user-web/.env.local
cp chatbot/env.template chatbot/.env

# Hoặc dùng script helper
npm run generate-env
# hoặc
./scripts/setup-env.sh
```

## 🔄 Workflow Improvements

### Tối ưu đã thực hiện:

1. ✅ **Environment Variables Management**

   - Tự động set env vars cho Vercel từ GitHub Secrets
   - Hiển thị danh sách env vars cần set cho Render
   - Tự động tạo `.env` file cho EC2 deployment

2. ✅ **Error Handling**

   - `continue-on-error: true` cho các bước optional
   - Better error messages và troubleshooting hints

3. ✅ **Documentation**

   - Comprehensive guide trong `CI_CD_ENV_SETUP.md`
   - Comments trong workflows
   - Service URLs mapping

4. ✅ **Flexibility**
   - Manual trigger cho tất cả workflows
   - Chọn deployment target cho chatbot (Render/EC2)
   - Support cả `main` và `develop` branches

## 🐛 Troubleshooting

Xem phần [Troubleshooting](./CI_CD_ENV_SETUP.md#-troubleshooting) trong `CI_CD_ENV_SETUP.md` để biết cách xử lý các lỗi thường gặp.

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Render API Documentation](https://render.com/docs/api)
- [CI_CD_GUIDE.md](../docs/CI_CD_GUIDE.md) - Hướng dẫn CI/CD tổng quan

---

**Last Updated:** 2024-12-XX  
**Maintained by:** Development Team
