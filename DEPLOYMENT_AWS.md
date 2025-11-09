# 🚀 AWS EC2 Deployment Guide

Hướng dẫn deploy Restaurant Management System lên AWS EC2 (t3.micro).

## 📋 Prerequisites

- AWS Account
- EC2 Instance (t3.micro hoặc lớn hơn)
- GitHub Repository
- SSH access to EC2

## 🔧 Step 1: Setup EC2 Instance

### 1.1 Launch EC2 Instance

1. **Instance Type**: t3.micro (1 vCPU, 1GB RAM) - **Free tier eligible**
2. **AMI**: Ubuntu 22.04 LTS
3. **Storage**: 20GB gp3 (minimum)
4. **Security Group**: Mở các ports:
   - 22 (SSH)
   - 80 (HTTP)
   - 443 (HTTPS)
   - 8000 (Backend API)
   - 3000 (User Web)
   - 3001 (Admin Web)

### 1.2 Connect to EC2

```bash
# For Amazon Linux 2023
ssh -i your-key.pem ec2-user@your-ec2-ip

# For Ubuntu
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 1.3 Run Setup Script

```bash
# Clone repository (if not already)
git clone https://github.com/your-username/restaurant.git
cd restaurant

# Make scripts executable
chmod +x scripts/*.sh

# Run setup script
./scripts/setup-ec2.sh
```

**Note**: Sau khi chạy setup, bạn có thể cần logout và login lại để Docker group có hiệu lực.

## 🔐 Step 2: Configure GitHub Secrets

Vào GitHub Repository → Settings → Secrets and variables → Actions, thêm các secrets sau:

### Required Secrets

1. **`AWS_ACCESS_KEY_ID`**

   - AWS IAM user access key ID
   - User cần quyền EC2 (hoặc full access cho testing)

2. **`AWS_SECRET_ACCESS_KEY`**

   - AWS IAM user secret access key

3. **`EC2_HOST`**

   - EC2 public IP hoặc domain name
   - Ví dụ: `54.123.45.67` hoặc `api.yourdomain.com`

4. **`EC2_USER`**

   - SSH user
   - Amazon Linux 2023: `ec2-user`
   - Ubuntu: `ubuntu`
   - Ví dụ: `ec2-user` hoặc `ubuntu`

5. **`EC2_SSH_KEY`**

   - Private key content để SSH vào EC2
   - Copy toàn bộ nội dung file `.pem` key
   - Ví dụ:
     ```
     -----BEGIN RSA PRIVATE KEY-----
     MIIEpAIBAAKCAQEA...
     -----END RSA PRIVATE KEY-----
     ```

6. **`EC2_DEPLOY_PATH`** (Optional)
   - Đường dẫn deploy trên EC2
   - Default: `/home/ec2-user/restaurant` (Amazon Linux) hoặc `/home/ubuntu/restaurant` (Ubuntu)

## 📝 Step 3: Configure Environment Variables

### 3.1 On EC2 Instance

```bash
# For Amazon Linux 2023, use ec2-user home
cd /home/ec2-user/restaurant

# Copy example files
cp env.example .env
cp be_restaurant/env.example be_restaurant/.env

# Edit configuration
nano .env
nano be_restaurant/.env
```

### 3.2 Important Environment Variables

**`.env` (root):**

```env
# Database
MYSQL_ROOT_PASSWORD=your_secure_password
MYSQL_DATABASE=restaurant_db
MYSQL_USER=restaurant_user
MYSQL_PASSWORD=your_secure_password

# Ports
PORT=8000
ADMIN_WEB_PORT=3001
USER_WEB_PORT=3000

# API URLs (use EC2 public IP or domain)
NEXT_PUBLIC_API_URL=http://your-ec2-ip:8000
CLIENT_ADMIN_URL=http://your-ec2-ip:3001
CLIENT_USER_URL=http://your-ec2-ip:3000
```

**`be_restaurant/.env`:**

```env
# Database
DB_HOST=mysql
DB_PORT=3306
DB_NAME=restaurant_db
DB_USER=restaurant_user
DB_PASSWORD=your_secure_password

# Chatbot
CHATBOT_URL=http://chatbot:7860/api

# JWT
JWT_SECRET=your_jwt_secret_key

# Cloudinary (if using)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# VNPay (if using)
VNP_TMN_CODE=your_tmn_code
VNP_HASH_SECRET=your_hash_secret
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL_ORDER=http://your-ec2-ip:8000/api/payments/vnpay/return
VNP_RETURN_URL_RESERVATION=http://your-ec2-ip:8000/api/payments/vnpay/return
```

## 🚀 Step 4: Deploy

### 4.1 Manual Deployment

```bash
# For Amazon Linux 2023
cd /home/ec2-user/restaurant
./scripts/deploy.sh

# For Ubuntu
cd /home/ubuntu/restaurant
./scripts/deploy.sh
```

### 4.2 Automatic Deployment via GitHub Actions

1. Push code lên branch `main` hoặc `develop`
2. GitHub Actions sẽ tự động:
   - Build Docker images
   - Deploy lên EC2
   - Run health checks

Workflow file: `.github/workflows/deploy.yml`

## 📊 Step 5: Verify Deployment

### 5.1 Check Service Status

```bash
# For Amazon Linux 2023
cd /home/ec2-user/restaurant
docker-compose ps

# For Ubuntu
cd /home/ubuntu/restaurant
docker-compose ps
```

Tất cả services phải hiển thị `(healthy)`.

### 5.2 Test Endpoints

```bash
# Backend health
curl http://localhost:8000/health

# From your local machine
curl http://your-ec2-ip:8000/health
```

### 5.3 Access Web Interfaces

- **User Web**: http://your-ec2-ip:3000
- **Admin Web**: http://your-ec2-ip:3001
- **Backend API**: http://your-ec2-ip:8000

## 🔍 Monitoring & Maintenance

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f admin-web
docker-compose logs -f user-web
```

### Check Resource Usage

```bash
# Docker stats
docker stats

# System resources
htop
df -h  # Disk usage
free -h  # Memory usage
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Update Deployment

```bash
# Pull latest code
git pull origin main

# Redeploy
./scripts/deploy.sh
```

## 🛠️ Troubleshooting

### Out of Memory (t3.micro)

**Problem**: Services crash due to low memory

**Solution**:

1. Check swap file is active: `swapon --show`
2. Increase swap if needed (see `setup-ec2.sh`)
3. Restart services: `docker-compose restart`

### Port Already in Use

**Problem**: Port conflict

**Solution**:

```bash
# Find process using port
sudo lsof -i :8000

# Kill process
sudo kill -9 <PID>
```

### Docker Build Fails

**Problem**: Build timeout or out of space

**Solution**:

```bash
# Clean up Docker
docker system prune -af

# Check disk space
df -h
```

### Health Check Fails

**Problem**: Services show unhealthy

**Solution**:

```bash
# Check logs
docker-compose logs backend --tail 100

# Check if services are actually running
docker-compose ps
curl http://localhost:8000/health
```

## 🔒 Security Best Practices

1. **Change default passwords** trong `.env` files
2. **Use strong JWT secrets**
3. **Enable HTTPS** với reverse proxy (nginx/caddy)
4. **Restrict security group** chỉ mở ports cần thiết
5. **Regular updates**: `sudo apt-get update && sudo apt-get upgrade`
6. **Backup database** regularly
7. **Monitor logs** for suspicious activity

## 📈 Scaling (Future)

Khi cần scale:

1. **Upgrade instance**: t3.micro → t3.small → t3.medium
2. **Add load balancer**: AWS Application Load Balancer
3. **Use RDS**: Separate database service
4. **Add caching**: Redis for session/data cache
5. **CDN**: CloudFront for static assets

## 📞 Support

Nếu gặp vấn đề:

1. Check logs: `docker-compose logs`
2. Check system resources: `htop`, `df -h`
3. Verify environment variables
4. Check GitHub Actions workflow logs

---

**Last Updated**: 2025-11-09
