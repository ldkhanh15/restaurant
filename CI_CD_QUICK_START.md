# 🚀 CI/CD Quick Start Guide

Hướng dẫn nhanh để setup CI/CD cho AWS EC2.

## ⚡ Quick Setup (5 phút)

### 1. Setup EC2 Instance

```bash
# SSH vào EC2 (Amazon Linux 2023 uses ec2-user)
ssh -i your-key.pem ec2-user@your-ec2-ip

# Clone repository
git clone https://github.com/your-username/restaurant.git
cd restaurant

# Run setup script
chmod +x scripts/setup-ec2.sh
./scripts/setup-ec2.sh

# Logout và login lại để Docker group có hiệu lực
exit
ssh -i your-key.pem ec2-user@your-ec2-ip
```

### 2. Configure Environment Variables

```bash
# For Amazon Linux 2023
cd /home/ec2-user/restaurant

# Copy và edit .env files
cp env.example .env
cp be_restaurant/env.example be_restaurant/.env

nano .env
nano be_restaurant/.env
```

**Minimum required variables:**

- `MYSQL_ROOT_PASSWORD`
- `MYSQL_PASSWORD`
- `NEXT_PUBLIC_API_URL` (use EC2 public IP)

### 3. Setup GitHub Secrets

Vào **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions**

Thêm các secrets sau:

| Secret Name             | Value                     | Example                                                                            |
| ----------------------- | ------------------------- | ---------------------------------------------------------------------------------- |
| `AWS_ACCESS_KEY_ID`     | AWS IAM access key        | `AKIAIOSFODNN7EXAMPLE`                                                             |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key        | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`                                         |
| `EC2_HOST`              | EC2 public IP hoặc domain | `54.123.45.67`                                                                     |
| `EC2_USER`              | SSH user                  | `ec2-user` (Amazon Linux) hoặc `ubuntu` (Ubuntu)                                   |
| `EC2_SSH_KEY`           | Private key content       | `-----BEGIN RSA PRIVATE KEY-----...`                                               |
| `EC2_DEPLOY_PATH`       | (Optional) Deploy path    | `/home/ec2-user/restaurant` (Amazon Linux) hoặc `/home/ubuntu/restaurant` (Ubuntu) |

**Lấy SSH Key:**

```bash
# Copy toàn bộ nội dung file .pem key
cat your-key.pem
# Copy output và paste vào EC2_SSH_KEY secret
```

### 4. Deploy!

**Option A: Manual Deploy (First Time)**

```bash
# For Amazon Linux 2023
cd /home/ec2-user/restaurant
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

**Option B: Automatic Deploy (via GitHub Actions)**

```bash
# Push code lên main hoặc develop branch
git push origin main

# GitHub Actions sẽ tự động deploy!
```

## ✅ Verify Deployment

```bash
# Check services
docker-compose ps

# Test endpoints
curl http://localhost:8000/health

# View logs
docker-compose logs -f
```

## 🔍 Troubleshooting

### GitHub Actions Fails

1. **Check secrets**: Đảm bảo tất cả secrets đã được set
2. **Check SSH key**: Format đúng (bao gồm `-----BEGIN` và `-----END`)
3. **Check EC2 security group**: Mở port 22 (SSH)

### Services Not Starting

```bash
# Check logs
docker-compose logs backend --tail 50

# Check resources
docker stats
free -h

# Restart services
docker-compose restart
```

### Out of Memory (t3.micro)

```bash
# Check swap
swapon --show

# If no swap, create one
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 📚 Full Documentation

Xem `DEPLOYMENT_AWS.md` để biết chi tiết đầy đủ.

## 🎯 Next Steps

1. ✅ Setup domain name (optional)
2. ✅ Configure HTTPS với Let's Encrypt
3. ✅ Setup database backups
4. ✅ Setup monitoring (CloudWatch, etc.)

---

**Need Help?** Check logs: `docker-compose logs -f`
