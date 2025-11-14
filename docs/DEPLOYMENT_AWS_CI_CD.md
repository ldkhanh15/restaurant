# 🚀 Hướng Dẫn Deploy Restaurant System lên AWS EC2 với CI/CD

Tài liệu này hướng dẫn chi tiết cách chuẩn bị và deploy hệ thống Restaurant lên AWS EC2 sử dụng GitHub Actions CI/CD.

## 📋 Mục Lục

1. [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
2. [Chuẩn Bị AWS EC2](#chuẩn-bị-aws-ec2)
3. [Cấu Hình GitHub Secrets](#cấu-hình-github-secrets)
4. [Cấu Hình Environment Variables](#cấu-hình-environment-variables)
5. [Deploy Tự Động với CI/CD](#deploy-tự-động-với-cicd)
6. [Deploy Thủ Công](#deploy-thủ-công)
7. [Kiểm Tra và Troubleshooting](#kiểm-tra-và-troubleshooting)

---

## 🖥️ Yêu Cầu Hệ Thống

### AWS EC2 Requirements

- **Instance Type**: t3.micro (1 vCPU, 1GB RAM) - Free tier eligible hoặc lớn hơn
- **AMI**: Ubuntu 22.04 LTS hoặc Amazon Linux 2023
- **Storage**: Tối thiểu 20GB gp3 SSD
- **Security Group**: Mở các ports: 22, 3000, 3001, 8000

### Software Requirements trên EC2

- Docker Engine 20.10+
- Docker Compose v2.0+ (hoặc docker-compose v1.29+)
- Git (để clone repo nếu cần)

---

## ☁️ Chuẩn Bị AWS EC2

### 1. Tạo EC2 Instance

1. Đăng nhập vào [AWS Console](https://console.aws.amazon.com)
2. Vào **EC2** → **Instances** → **Launch Instance**
3. Cấu hình:

   - **Name**: `restaurant-server` (hoặc tên bạn muốn)
   - **AMI**: Ubuntu Server 22.04 LTS hoặc Amazon Linux 2023
   - **Instance Type**: t3.micro (Free tier) hoặc t3.small (khuyến nghị)
   - **Key Pair**: Tạo mới hoặc chọn existing key pair (lưu file `.pem`)
   - **Network Settings**:
     - Chọn hoặc tạo Security Group
     - Mở các ports:
       - **22** (SSH)
       - **3000** (User Web)
       - **3001** (Admin Web)
       - **8000** (Backend API)
   - **Storage**: 20GB gp3 (minimum)

4. Click **Launch Instance**

### 2. Cài Đặt Docker trên EC2

SSH vào EC2 và chạy setup script:

```bash
# SSH vào EC2 (thay your-key.pem và your-ec2-ip)
ssh -i your-key.pem ec2-user@your-ec2-ip
# hoặc cho Ubuntu
ssh -i your-key.pem ubuntu@your-ec2-ip

# Clone repository (nếu chưa có)
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git restaurant
cd restaurant

# Make scripts executable
chmod +x scripts/*.sh

# Run setup script
./scripts/setup-ec2.sh
```

**Lưu ý**: Sau khi chạy setup, logout và login lại để Docker group có hiệu lực:

```bash
exit
ssh -i your-key.pem ec2-user@your-ec2-ip
```

### 3. Tạo SSH Key Pair cho CI/CD

Nếu bạn đã có key pair từ EC2, sử dụng nó. Nếu không, tạo mới:

**Trên máy local của bạn:**

```bash
# Generate SSH key pair (nếu chưa có)
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/ec2_deploy_key

# Copy public key to EC2
ssh-copy-id -i ~/.ssh/ec2_deploy_key.pub ec2-user@YOUR_EC2_IP

# Test SSH connection
ssh -i ~/.ssh/ec2_deploy_key ec2-user@YOUR_EC2_IP
```

**Hoặc sử dụng EC2 Key Pair:**

Nếu bạn đã tạo key pair khi launch EC2, sử dụng file `.pem` đó làm `EC2_SSH_KEY`.

---

## 🔐 Cấu Hình GitHub Secrets

### 1. Truy Cập GitHub Repository Settings

1. Vào repository trên GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### 2. Thêm Các Secrets Sau

#### `EC2_HOST`

- **Value**: Public IP hoặc domain của EC2 instance
- **Ví dụ**: `54.123.45.67` hoặc `restaurant.example.com`
- **Cách lấy**: Vào EC2 Console → Instances → Copy Public IPv4 address

#### `EC2_USER`

- **Value**: Username để SSH vào EC2
- **Amazon Linux 2023**: `ec2-user`
- **Ubuntu**: `ubuntu`
- **Ví dụ**: `ec2-user` hoặc `ubuntu`

#### `EC2_SSH_KEY`

- **Value**: Nội dung của **private key** (file `.pem` từ EC2 hoặc `~/.ssh/ec2_deploy_key`)
- **Cách lấy**:
  ```bash
  cat your-key.pem
  # hoặc
  cat ~/.ssh/ec2_deploy_key
  ```
- **Lưu ý**: Copy toàn bộ nội dung, bao gồm:
  ```
  -----BEGIN RSA PRIVATE KEY-----
  ...
  -----END RSA PRIVATE KEY-----
  ```

#### `EC2_DEPLOY_PATH`

- **Value**: Đường dẫn deploy trên EC2
- **Amazon Linux**: `/home/ec2-user/restaurant`
- **Ubuntu**: `/home/ubuntu/restaurant`
- **Ví dụ**: `/home/ec2-user/restaurant`
- **Lưu ý**: Đảm bảo user có quyền write vào thư mục này

---

## ⚙️ Cấu Hình Environment Variables

### 1. Tạo Thư Mục Deploy trên EC2

```bash
# SSH vào EC2
ssh -i your-key.pem ec2-user@YOUR_EC2_IP

# Tạo thư mục deploy (nếu chưa có)
mkdir -p /home/ec2-user/restaurant
cd /home/ec2-user/restaurant
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

# API URLs (thay YOUR_EC2_IP bằng IP hoặc domain của bạn)
NEXT_PUBLIC_API_URL=http://YOUR_EC2_IP:8000
CLIENT_ADMIN_URL=http://YOUR_EC2_IP:3001
CLIENT_USER_URL=http://YOUR_EC2_IP:3000
VNP_RETURN_URL_ORDER=http://YOUR_EC2_IP:8000/api/payments/vnpay/return
VNP_RETURN_URL_RESERVATION=http://YOUR_EC2_IP:8000/api/payments/vnpay/return
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
VNP_RETURN_URL=http://YOUR_EC2_IP:8000/api/payments/vnpay/return
CLIENT_URL=http://YOUR_EC2_IP:3000

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
git commit -m "Prepare for AWS EC2 deployment"
git push origin main
```

### 2. GitHub Actions Sẽ Tự Động Chạy

1. Vào tab **Actions** trên GitHub repository
2. Workflow `Deploy Restaurant System to AWS EC2` sẽ tự động chạy
3. Xem logs để theo dõi quá trình deploy

### 3. Kiểm Tra Deployment

Sau khi workflow hoàn thành, kiểm tra:

```bash
# SSH vào EC2
ssh -i your-key.pem ec2-user@YOUR_EC2_IP

# Check containers
cd /home/ec2-user/restaurant
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs -f
```

### 4. Truy Cập Services

- **User Web**: `http://YOUR_EC2_IP:3000`
- **Admin Web**: `http://YOUR_EC2_IP:3001`
- **Backend API**: `http://YOUR_EC2_IP:8000`
- **Health Check**: `http://YOUR_EC2_IP:8000/health`

---

## 🔧 Deploy Thủ Công (Nếu CI/CD Không Hoạt Động)

### 1. Clone Repository trên EC2

```bash
cd /home/ec2-user/restaurant
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

#### Issue: Out of memory (t3.micro)

```bash
# Check memory usage
free -h
docker stats

# Check swap file
swapon --show

# Restart containers
docker compose -f docker-compose.prod.yml restart
```

#### Issue: Security Group không cho phép truy cập

1. Vào **EC2 Console** → **Security Groups**
2. Chọn Security Group của instance
3. **Inbound rules** → **Edit inbound rules**
4. Thêm rules:
   - Type: **Custom TCP**, Port: **3000**, Source: **0.0.0.0/0**
   - Type: **Custom TCP**, Port: **3001**, Source: **0.0.0.0/0**
   - Type: **Custom TCP**, Port: **8000**, Source: **0.0.0.0/0**

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

# Redeploy
./scripts/deploy.sh
# hoặc
docker compose -f docker-compose.prod.yml down
DOCKER_BUILDKIT=1 docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

---

## 📝 Checklist Trước Khi Deploy

- [ ] AWS EC2 instance đã được tạo và cấu hình
- [ ] Security Group đã mở các ports cần thiết (22, 3000, 3001, 8000)
- [ ] Docker và Docker Compose đã được cài đặt trên EC2
- [ ] Setup script đã được chạy (`./scripts/setup-ec2.sh`)
- [ ] SSH key đã được tạo và public key đã được thêm vào EC2
- [ ] GitHub Secrets đã được cấu hình đầy đủ
- [ ] Environment variables đã được cấu hình trên EC2
- [ ] File `.env` và `be_restaurant/.env` đã được tạo

---

## 🔒 Security Best Practices

1. **Sử dụng SSH keys thay vì password**
2. **Thay đổi default passwords** trong `.env` files
3. **Sử dụng strong JWT secret** (tối thiểu 32 ký tự)
4. **Giới hạn Security Group** chỉ mở ports cần thiết
5. **Sử dụng IAM roles** thay vì access keys khi có thể
6. **Regular updates**: `sudo yum update` hoặc `sudo apt-get update && sudo apt-get upgrade`
7. **Backup database** định kỳ
8. **Monitor CloudWatch logs** để phát hiện suspicious activities
9. **Enable VPC** và private subnets cho production
10. **Sử dụng HTTPS** với Application Load Balancer hoặc CloudFront

---

## 📞 Support

Nếu gặp vấn đề, hãy kiểm tra:

1. GitHub Actions logs trong tab **Actions**
2. Container logs trên EC2
3. Security Group rules trên AWS Console
4. EC2 instance status và resource usage (CPU, Memory, Disk)
5. CloudWatch logs (nếu đã enable)

---

## 🎉 Hoàn Thành!

Sau khi deploy thành công, bạn có thể:

- Truy cập **User Web** tại `http://YOUR_EC2_IP:3000`
- Truy cập **Admin Web** tại `http://YOUR_EC2_IP:3001`
- Sử dụng **Backend API** tại `http://YOUR_EC2_IP:8000`

Mọi thay đổi code push lên branch `main` sẽ tự động trigger deployment!

---

**Last Updated**: 2025-11-14
