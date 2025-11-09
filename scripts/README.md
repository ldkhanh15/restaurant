# Deployment Scripts

Scripts hỗ trợ deployment và setup hệ thống.

## 📁 Files

### `setup-ec2.sh`

Setup script chạy một lần trên EC2 instance mới. Script này sẽ:

- Cài đặt Docker và Docker Compose
- Cài đặt Git và các tools cần thiết
- Tạo swap file (quan trọng cho t3.micro)
- Cấu hình firewall
- Tạo deployment directory

**Usage:**

```bash
chmod +x scripts/setup-ec2.sh
./scripts/setup-ec2.sh
```

### `deploy.sh`

Deployment script để deploy/update hệ thống. Script này sẽ:

- Pull latest code từ Git
- Build Docker images
- Stop và start services
- Run health checks

**Usage:**

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

**Environment Variables:**

- `DEPLOY_PATH`: Đường dẫn deploy (default: auto-detect based on user - `/home/ec2-user/restaurant` for Amazon Linux, `/home/ubuntu/restaurant` for Ubuntu)
- `BRANCH`: Git branch để deploy (default: `main`)

**Example:**

```bash
DEPLOY_PATH=/opt/restaurant BRANCH=develop ./scripts/deploy.sh
```

## 🔧 Permissions

Trên Linux/Unix, scripts cần quyền execute:

```bash
chmod +x scripts/*.sh
```

## 📝 Notes

- Scripts sử dụng `set -e` để exit ngay khi có lỗi
- Tất cả commands đều có error handling
- Scripts tự động detect Docker Compose v1 hoặc v2
