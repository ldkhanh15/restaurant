# 🚀 Hướng Dẫn Deploy Restaurant System lên Azure VM với CI/CD

Tài liệu này hướng dẫn chi tiết cách chuẩn bị và deploy hệ thống Restaurant lên Azure VM sử dụng GitHub Actions CI/CD.

## 📋 Mục Lục

1. [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
2. [Chuẩn Bị Azure VM](#chuẩn-bị-azure-vm)
3. [Cấu Hình GitHub Secrets](#cấu-hình-github-secrets)
4. [Cấu Hình Environment Variables](#cấu-hình-environment-variables)
5. [Deploy Tự Động với CI/CD](#deploy-tự-động-với-cicd)
6. [Deploy Thủ Công](#deploy-thủ-công)
7. [Kiểm Tra và Troubleshooting](#kiểm-tra-và-troubleshooting)

---

## 🖥️ Yêu Cầu Hệ Thống

### Azure VM Requirements

- **OS**: Ubuntu 20.04 LTS hoặc 22.04 LTS (khuyến nghị)
- **Size**: Tối thiểu Standard_B1s (1 vCPU, 1GB RAM) hoặc tốt hơn
- **Disk**: Tối thiểu 20GB SSD
- **Network**: Public IP với ports mở: 22, 3000, 3001, 8000

### Software Requirements trên VM

- Docker Engine 20.10+
- Docker Compose v2.0+ (hoặc docker-compose v1.29+)
- Git (để clone repo nếu cần)

---

## ☁️ Chuẩn Bị Azure VM

### 1. Tạo Azure VM

1. Đăng nhập vào [Azure Portal](https://portal.azure.com)
2. Tạo Virtual Machine mới:

   - **Subscription**: Chọn subscription của bạn
   - **Resource Group**: Tạo mới hoặc chọn existing
   - **VM Name**: `restaurant-vm` (hoặc tên bạn muốn)
   - **Region**: Chọn region gần nhất
   - **Image**: Ubuntu Server 20.04 LTS hoặc 22.04 LTS
   - **Size**: Standard_B1s (1 vCPU, 1GB RAM) - tối thiểu
   - **Authentication**: SSH public key (khuyến nghị) hoặc Password
   - **Public inbound ports**: Chọn "Allow selected ports" và chọn SSH (22)

3. **Network Security Group (NSG)**:
   - Mở các ports sau:
     - **22** (SSH)
     - **3000** (User Web)
     - **3001** (Admin Web)
     - **8000** (Backend API)

### 2. Cài Đặt Docker trên Azure VM

SSH vào VM và chạy các lệnh sau:

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (thay 'azureuser' bằng username của bạn)
sudo usermod -aG docker azureuser

# Install Docker Compose v2
sudo apt-get install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version

# Logout and login again để áp dụng group changes
exit
```

### 3. Tạo SSH Key Pair cho CI/CD

Trên máy local của bạn:

```bash
# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/azure_deploy_key

# Copy public key to Azure VM
ssh-copy-id -i ~/.ssh/azure_deploy_key.pub azureuser@YOUR_VM_IP

# Test SSH connection
ssh -i ~/.ssh/azure_deploy_key azureuser@YOUR_VM_IP
```

**Lưu ý**: Lưu private key (`azure_deploy_key`) an toàn, bạn sẽ cần nó cho GitHub Secrets.

---

## 🔐 Cấu Hình GitHub Secrets

### 1. Truy Cập GitHub Repository Settings

1. Vào repository trên GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### 2. Thêm Các Secrets Sau

#### `AZURE_VM_HOST`

- **Value**: Public IP hoặc domain của Azure VM
- **Ví dụ**: `20.123.45.67` hoặc `restaurant.example.com`

#### `AZURE_VM_USER`

- **Value**: Username để SSH vào VM
- **Ví dụ**: `azureuser` (default cho Ubuntu trên Azure)

#### `AZURE_SSH_KEY`

- **Value**: Nội dung của **private key** (`~/.ssh/azure_deploy_key`)
- **Cách lấy**:
  ```bash
  cat ~/.ssh/azure_deploy_key
  ```
- **Lưu ý**: Copy toàn bộ nội dung, bao gồm:
  ```
  -----BEGIN RSA PRIVATE KEY-----
  ...
  -----END RSA PRIVATE KEY-----
  ```

#### `AZURE_DEPLOY_PATH`

- **Value**: Đường dẫn deploy trên VM
- **Ví dụ**: `/home/azureuser/restaurant` hoặc `/opt/restaurant`
- **Lưu ý**: Đảm bảo user có quyền write vào thư mục này

---

## ⚙️ Cấu Hình Environment Variables

### 1. Tạo Thư Mục Deploy trên VM

```bash
# SSH vào VM
ssh -i ~/.ssh/azure_deploy_key azureuser@YOUR_VM_IP

# Tạo thư mục deploy
mkdir -p /home/azureuser/restaurant
cd /home/azureuser/restaurant
```

### 2. Tạo File `.env` ở Root

```bash
nano .env
```

Nội dung:

```env
# Database Configuration
MYSQL_ROOT_PASSWORD=your_secure_root_password_here
MYSQL_DATABASE=restaurant_db
MYSQL_USER=restaurant_user
MYSQL_PASSWORD=your_secure_db_password_here
MYSQL_PORT=3306

# Ports
PORT=8000
ADMIN_WEB_PORT=3001
USER_WEB_PORT=3000

# API URLs (thay YOUR_VM_IP bằng IP hoặc domain của bạn)
NEXT_PUBLIC_API_URL=http://YOUR_VM_IP:8000
CLIENT_ADMIN_URL=http://YOUR_VM_IP:3001
CLIENT_USER_URL=http://YOUR_VM_IP:3000
VNP_RETURN_URL_ORDER=http://YOUR_VM_IP:8000/api/payments/vnpay/return
VNP_RETURN_URL_RESERVATION=http://YOUR_VM_IP:8000/api/payments/vnpay/return
```

### 3. Tạo File `be_restaurant/.env`

```bash
mkdir -p be_restaurant
nano be_restaurant/.env
```

Nội dung:

```env
# Application Configuration
NODE_ENV=production
PORT=8000

# Database Configuration (sẽ được override bởi docker-compose)
DB_HOST=mysql
DB_PORT=3306
DB_NAME=restaurant_db
DB_USER=restaurant_user
DB_PASSWORD=your_secure_db_password_here

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_key_min_32_characters_long
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=*

# VNPay Configuration (nếu sử dụng)
VNP_TMN_CODE=your_vnpay_tmn_code
VNP_HASH_SECRET=your_vnpay_hash_secret
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://YOUR_VM_IP:8000/api/payments/vnpay/return
CLIENT_URL=http://YOUR_VM_IP:3000

# Chatbot URL (sẽ được override bởi docker-compose)
CHATBOT_URL=http://chatbot:7860/api

# Debug
DEBUG_SQL=false
```

### 4. Set Permissions

```bash
# Đảm bảo user có quyền
chmod 600 .env
chmod 600 be_restaurant/.env
```

---

## 🚀 Deploy Tự Động với CI/CD

### 1. Push Code lên GitHub

```bash
# Commit và push code
git add .
git commit -m "Prepare for Azure deployment"
git push origin main
```

### 2. GitHub Actions Sẽ Tự Động Chạy

1. Vào tab **Actions** trên GitHub repository
2. Workflow `Deploy Restaurant System to Azure VM` sẽ tự động chạy
3. Xem logs để theo dõi quá trình deploy

### 3. Kiểm Tra Deployment

Sau khi workflow hoàn thành, kiểm tra:

```bash
# SSH vào VM
ssh -i ~/.ssh/azure_deploy_key azureuser@YOUR_VM_IP

# Check containers
cd /home/azureuser/restaurant
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs -f
```

### 4. Truy Cập Services

- **User Web**: `http://YOUR_VM_IP:3000`
- **Admin Web**: `http://YOUR_VM_IP:3001`
- **Backend API**: `http://YOUR_VM_IP:8000`
- **Health Check**: `http://YOUR_VM_IP:8000/health`

---

## 🔧 Deploy Thủ Công (Nếu CI/CD Không Hoạt Động)

### 1. Clone Repository trên VM

```bash
cd /home/azureuser/restaurant
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .
# hoặc
git pull origin main
```

### 2. Copy Environment Files

```bash
# Copy .env files nếu chưa có
cp .env.example .env
cp be_restaurant/env.example be_restaurant/.env

# Edit các file .env với thông tin của bạn
nano .env
nano be_restaurant/.env
```

### 3. Build và Start Services

```bash
# Stop old containers
docker compose -f docker-compose.prod.yml down

# Build images
DOCKER_BUILDKIT=1 docker compose -f docker-compose.prod.yml build

# Start services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## 🔍 Kiểm Tra và Troubleshooting

### 1. Kiểm Tra Containers

```bash
# List all containers
docker compose -f docker-compose.prod.yml ps

# Check container logs
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs admin-web
docker compose -f docker-compose.prod.yml logs user-web
docker compose -f docker-compose.prod.yml logs mysql
docker compose -f docker-compose.prod.yml logs chatbot
```

### 2. Kiểm Tra Health

```bash
# Backend health
curl http://localhost:8000/health

# Admin Web
curl http://localhost:3001

# User Web
curl http://localhost:3000
```

### 3. Common Issues và Solutions

#### Issue: Containers không start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Check disk space
df -h

# Check Docker
docker info
```

#### Issue: Database connection failed

```bash
# Check MySQL container
docker compose -f docker-compose.prod.yml logs mysql

# Check MySQL is running
docker exec restaurant_mysql mysqladmin ping -h localhost

# Verify environment variables
docker compose -f docker-compose.prod.yml config
```

#### Issue: Port already in use

```bash
# Check what's using the port
sudo netstat -tulpn | grep :8000
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :3001

# Stop conflicting services
sudo systemctl stop <service-name>
```

#### Issue: Out of memory

```bash
# Check memory usage
free -h
docker stats

# Restart containers
docker compose -f docker-compose.prod.yml restart
```

### 4. Restart Services

```bash
# Restart all services
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend

# Stop all services
docker compose -f docker-compose.prod.yml down

# Start all services
docker compose -f docker-compose.prod.yml up -d
```

### 5. Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml down
DOCKER_BUILDKIT=1 docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

---

## 📝 Checklist Trước Khi Deploy

- [ ] Azure VM đã được tạo và cấu hình
- [ ] Docker và Docker Compose đã được cài đặt trên VM
- [ ] SSH key đã được tạo và public key đã được thêm vào VM
- [ ] GitHub Secrets đã được cấu hình đầy đủ
- [ ] Environment variables đã được cấu hình trên VM
- [ ] Network Security Group đã mở các ports cần thiết
- [ ] Firewall trên VM đã được cấu hình (nếu có)
- [ ] Domain/DNS đã được cấu hình (nếu sử dụng)

---

## 🔒 Security Best Practices

1. **Sử dụng SSH keys thay vì password**
2. **Thay đổi default passwords** trong `.env` files
3. **Sử dụng strong JWT secret** (tối thiểu 32 ký tự)
4. **Giới hạn SSH access** bằng IP whitelist trong NSG
5. **Enable firewall** trên VM (UFW hoặc iptables)
6. **Regular updates**: `sudo apt-get update && sudo apt-get upgrade`
7. **Backup database** định kỳ
8. **Monitor logs** để phát hiện suspicious activities

---

## 📞 Support

Nếu gặp vấn đề, hãy kiểm tra:

1. GitHub Actions logs trong tab **Actions**
2. Container logs trên VM
3. Network Security Group rules trên Azure Portal
4. VM resource usage (CPU, Memory, Disk)

---

## 🎉 Hoàn Thành!

Sau khi deploy thành công, bạn có thể:

- Truy cập **User Web** tại `http://YOUR_VM_IP:3000`
- Truy cập **Admin Web** tại `http://YOUR_VM_IP:3001`
- Sử dụng **Backend API** tại `http://YOUR_VM_IP:8000`

Mọi thay đổi code push lên branch `main` sẽ tự động trigger deployment!
