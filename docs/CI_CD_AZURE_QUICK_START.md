# CI/CD Quick Start - Azure VM

Hướng dẫn nhanh để setup CI/CD cho Azure VM.

## 📋 Prerequisites

- Azure VM đã được tạo và setup (xem [DEPLOYMENT_AZURE.md](./DEPLOYMENT_AZURE.md))
- SSH key pair đã được tạo
- GitHub repository

## 🔐 Step 1: Setup GitHub Secrets

Vào GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Thêm các secrets sau:

| Secret Name         | Description                                              | Example                                  |
| ------------------- | -------------------------------------------------------- | ---------------------------------------- |
| `AZURE_SSH_KEY`     | Private SSH key (toàn bộ từ `-----BEGIN` đến `-----END`) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `AZURE_VM_HOST`     | Public IP của Azure VM                                   | `20.123.45.67`                           |
| `AZURE_VM_USER`     | Username trên Azure VM                                   | `azureuser`                              |
| `AZURE_DEPLOY_PATH` | (Optional) Đường dẫn deploy                              | `/home/azureuser/restaurant`             |

## 🚀 Step 2: Test SSH Connection

Test SSH connection từ local:

```bash
ssh -i ~/.ssh/azure_deploy_key azureuser@<PUBLIC_IP>
```

Nếu thành công, bạn sẽ vào được Azure VM.

## 📝 Step 3: Verify Workflow

Workflow sẽ tự động chạy khi:

- Push code lên branch `main`
- Manual trigger từ GitHub Actions tab

## 🔍 Step 4: Check Deployment

Sau khi workflow chạy xong:

1. **Check GitHub Actions logs**:

   - Vào **Actions** tab
   - Click vào workflow run mới nhất
   - Xem logs để debug nếu có lỗi

2. **Check services trên Azure VM**:

   ```bash
   ssh -i ~/.ssh/azure_deploy_key azureuser@<PUBLIC_IP>
   cd ~/restaurant
   docker compose -f docker-compose.prod.yml ps
   ```

3. **Test endpoints**:
   - Backend: `https://<PUBLIC_IP>:8000/health`
   - User Web: `https://<PUBLIC_IP>:3000`
   - Admin Web: `https://<PUBLIC_IP>:3001`

## 🐛 Troubleshooting

### Lỗi: "Invalid SSH key format"

**Giải pháp**:

- Đảm bảo copy **PRIVATE KEY** (không phải public key)
- Copy toàn bộ từ `-----BEGIN` đến `-----END`
- Không có thêm ký tự hoặc dòng trống thừa

### Lỗi: "SSH connection failed"

**Giải pháp**:

1. Kiểm tra `AZURE_VM_HOST` có đúng không
2. Kiểm tra NSG đã mở port 22 chưa
3. Test SSH từ local
4. Kiểm tra Azure VM đang running

### Lỗi: "Permission denied (publickey)"

**Giải pháp**:

1. Đảm bảo public key đã được thêm vào VM khi tạo
2. Hoặc copy public key lên VM:
   ```bash
   ssh-copy-id -i ~/.ssh/azure_deploy_key.pub azureuser@<PUBLIC_IP>
   ```

### Lỗi: "Deployment script failed"

**Giải pháp**:

1. SSH vào VM và check logs:
   ```bash
   ssh -i ~/.ssh/azure_deploy_key azureuser@<PUBLIC_IP>
   cd ~/restaurant
   docker compose -f docker-compose.prod.yml logs
   ```
2. Check disk space:
   ```bash
   df -h
   ```
3. Check Docker:
   ```bash
   docker system df
   ```

## 📊 Workflow Steps

Workflow sẽ thực hiện các bước sau:

1. ✅ **Checkout code** - Lấy code từ repository
2. ✅ **Set up Docker Buildx** - Setup Docker build environment
3. ✅ **Setup SSH** - Validate SSH key và add VM to known_hosts
4. ✅ **Validate secrets** - Kiểm tra tất cả secrets cần thiết
5. ✅ **Deploy to Azure VM**:
   - Test SSH connection
   - Get server IP
   - Copy deployment script
   - Execute deployment script:
     - Pull latest code
     - Build Docker images
     - Start services
     - Health checks

## 🔄 Manual Deployment

Nếu muốn deploy manual (không qua CI/CD):

```bash
# SSH vào VM
ssh -i ~/.ssh/azure_deploy_key azureuser@<PUBLIC_IP>

# Clone repository (nếu chưa có)
cd ~
git clone <your-repo-url> restaurant
cd restaurant

# Deploy
COMPOSE_FILE=docker-compose.prod.yml SERVER_IP=<PUBLIC_IP> PROTOCOL=https ./scripts/deploy.sh
```

## 📝 Notes

- Workflow sử dụng `docker-compose.prod.yml` cho production
- Default deploy path: `/home/azureuser/restaurant`
- Default protocol: `https`
- Server IP sẽ tự động detect từ Azure VM nếu không được set

## 🔗 Related Documentation

- [DEPLOYMENT_AZURE.md](./DEPLOYMENT_AZURE.md) - Chi tiết về Azure VM setup
- [CI_CD_SSH_SETUP.md](./CI_CD_SSH_SETUP.md) - Chi tiết về SSH setup
