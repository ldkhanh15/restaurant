# Azure VM Deployment Guide

Hướng dẫn deploy Restaurant System lên Azure VM (Azure Student free account).

## 📋 Yêu cầu

- Azure Student free account
- SSH key pair
- GitHub repository với CI/CD đã setup

## 🆓 Azure Student Free Account

Azure Student free account bao gồm:

- **750 hours** của Standard B1, B2ATS, B2PTS Linux Virtual Machine
- **2 P6 (64GiB)** managed disks
- Cần chọn đúng image, VM size và disk size để được free

### VM Sizes phù hợp (Free tier):

- **Standard_B1s** (1 vCPU, 1GB RAM) - Phù hợp cho development
- **Standard_B2ats** (2 vCPU, 4GB RAM) - Phù hợp cho production nhỏ
- **Standard_B2pts** (2 vCPU, 4GB RAM) - Phù hợp cho production nhỏ

### Disk Size:

- Sử dụng **P6 (64GiB)** để được free
- Hoặc Standard HDD/SSD nhỏ hơn nếu cần

## 🚀 Bước 1: Tạo Azure VM

### 1.1. Tạo Resource Group

```bash
# Azure CLI
az group create --name restaurant-rg --location eastus

# Hoặc dùng Azure Portal
```

### 1.2. Tạo Virtual Network (nếu chưa có)

```bash
az network vnet create \
  --resource-group restaurant-rg \
  --name restaurant-vnet \
  --address-prefix 10.0.0.0/16 \
  --subnet-name restaurant-subnet \
  --subnet-prefix 10.0.1.0/24
```

### 1.3. Tạo Network Security Group (NSG)

```bash
az network nsg create \
  --resource-group restaurant-rg \
  --name restaurant-nsg

# Allow SSH
az network nsg rule create \
  --resource-group restaurant-rg \
  --nsg-name restaurant-nsg \
  --name AllowSSH \
  --priority 1000 \
  --protocol Tcp \
  --destination-port-ranges 22 \
  --access Allow

# Allow HTTP
az network nsg rule create \
  --resource-group restaurant-rg \
  --nsg-name restaurant-nsg \
  --name AllowHTTP \
  --priority 1001 \
  --protocol Tcp \
  --destination-port-ranges 80 \
  --access Allow

# Allow HTTPS
az network nsg rule create \
  --resource-group restaurant-rg \
  --nsg-name restaurant-nsg \
  --name AllowHTTPS \
  --priority 1002 \
  --protocol Tcp \
  --destination-port-ranges 443 \
  --access Allow

# Allow Backend API
az network nsg rule create \
  --resource-group restaurant-rg \
  --nsg-name restaurant-nsg \
  --name AllowBackend \
  --priority 1003 \
  --protocol Tcp \
  --destination-port-ranges 8000 \
  --access Allow

# Allow User Web
az network nsg rule create \
  --resource-group restaurant-rg \
  --nsg-name restaurant-nsg \
  --name AllowUserWeb \
  --priority 1004 \
  --protocol Tcp \
  --destination-port-ranges 3000 \
  --access Allow

# Allow Admin Web
az network nsg rule create \
  --resource-group restaurant-rg \
  --nsg-name restaurant-nsg \
  --name AllowAdminWeb \
  --priority 1005 \
  --protocol Tcp \
  --destination-port-ranges 3001 \
  --access Allow
```

### 1.4. Tạo Public IP

```bash
az network public-ip create \
  --resource-group restaurant-rg \
  --name restaurant-public-ip \
  --allocation-method Static \
  --sku Basic
```

### 1.5. Tạo Network Interface

```bash
az network nic create \
  --resource-group restaurant-rg \
  --name restaurant-nic \
  --vnet-name restaurant-vnet \
  --subnet restaurant-subnet \
  --public-ip-address restaurant-public-ip \
  --network-security-group restaurant-nsg
```

### 1.6. Tạo SSH Key (nếu chưa có)

```bash
# Tạo SSH key
ssh-keygen -t rsa -b 4096 -f ~/.ssh/azure_deploy_key -N ""

# Xem public key
cat ~/.ssh/azure_deploy_key.pub
```

### 1.7. Tạo VM

```bash
az vm create \
  --resource-group restaurant-rg \
  --name restaurant-vm \
  --image Ubuntu2204 \
  --size Standard_B1s \
  --admin-username azureuser \
  --ssh-key-values ~/.ssh/azure_deploy_key.pub \
  --nics restaurant-nic \
  --os-disk-size-gb 64 \
  --os-disk-name restaurant-os-disk \
  --storage-sku Premium_LRS
```

**Lưu ý quan trọng cho Azure Student free:**

- Image: `Ubuntu2204` hoặc `Ubuntu2004`
- Size: `Standard_B1s`, `Standard_B2ats`, hoặc `Standard_B2pts`
- Disk: `Premium_LRS` với size 64GB (P6) hoặc Standard HDD/SSD nhỏ hơn

### 1.8. Lấy Public IP

```bash
az vm show -d -g restaurant-rg -n restaurant-vm --query publicIps -o tsv
```

## 🔧 Bước 2: Setup Azure VM

### 2.1. SSH vào VM

```bash
ssh -i ~/.ssh/azure_deploy_key azureuser@<PUBLIC_IP>
```

### 2.2. Chạy setup script

```bash
# Clone repository (nếu chưa có)
cd ~
git clone <your-repo-url> restaurant
cd restaurant

# Chạy setup script
chmod +x scripts/setup-azure-vm.sh
./scripts/setup-azure-vm.sh
```

### 2.3. Logout và login lại

```bash
# Logout để Docker group changes có hiệu lực
exit

# Login lại
ssh -i ~/.ssh/azure_deploy_key azureuser@<PUBLIC_IP>
```

## 🔐 Bước 3: Setup GitHub Secrets

Vào GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Thêm các secrets sau:

### `AZURE_SSH_KEY`

- Copy **PRIVATE KEY** (không phải public key!)
- Format:
  ```
  -----BEGIN OPENSSH PRIVATE KEY-----
  b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAACFwAAAAdzc2gtcn
  ...
  -----END OPENSSH PRIVATE KEY-----
  ```

### `AZURE_VM_HOST`

- Public IP của Azure VM
- Ví dụ: `20.123.45.67`
- Hoặc có thể dùng domain nếu đã setup

### `AZURE_VM_USER`

- Username trên Azure VM
- Thường là `azureuser` (nếu tạo VM với `--admin-username azureuser`)

### `AZURE_DEPLOY_PATH` (optional)

- Đường dẫn deploy trên Azure VM
- Default: `/home/azureuser/restaurant`

### `AZURE_VM_SERVER_IP` (optional)

- Public IP của server (nếu khác với AZURE_VM_HOST)
- Nếu không set, sẽ tự động detect từ VM

## 🚀 Bước 4: Deploy

### 4.1. Manual Deploy

```bash
# SSH vào VM
ssh -i ~/.ssh/azure_deploy_key azureuser@<PUBLIC_IP>

# Clone repository (nếu chưa có)
cd ~
git clone <your-repo-url> restaurant
cd restaurant

# Deploy
COMPOSE_FILE=docker-compose.prod.yml ./scripts/deploy.sh
```

### 4.2. CI/CD Deploy

Push code lên branch `main`:

```bash
git push origin main
```

GitHub Actions sẽ tự động:

1. Build Docker images
2. SSH vào Azure VM
3. Pull latest code
4. Deploy services
5. Check health

## 🔍 Troubleshooting

### Lỗi: "SSH connection failed"

**Nguyên nhân**: Không thể kết nối SSH đến Azure VM.

**Giải pháp**:

1. Kiểm tra `AZURE_VM_HOST` có đúng không
2. Kiểm tra NSG đã mở port 22 chưa
3. Test SSH từ local:
   ```bash
   ssh -i ~/.ssh/azure_deploy_key azureuser@<PUBLIC_IP>
   ```
4. Kiểm tra Azure VM đang running

### Lỗi: "Permission denied (publickey)"

**Nguyên nhân**: Public key không match với private key trên Azure VM.

**Giải pháp**:

1. Đảm bảo đã copy public key khi tạo VM:
   ```bash
   az vm create ... --ssh-key-values ~/.ssh/azure_deploy_key.pub
   ```
2. Hoặc copy public key lên VM:
   ```bash
   ssh-copy-id -i ~/.ssh/azure_deploy_key.pub azureuser@<PUBLIC_IP>
   ```

### Lỗi: "Cannot connect to port 8000/3000/3001"

**Nguyên nhân**: NSG chưa mở ports.

**Giải pháp**:

1. Kiểm tra NSG rules đã có ports 8000, 3000, 3001 chưa
2. Kiểm tra local firewall trên VM (UFW hoặc firewalld)
3. Test từ VM:
   ```bash
   curl http://localhost:8000/health
   ```

### Lỗi: "Out of memory" hoặc "No space left on device"

**Nguyên nhân**: VM size quá nhỏ hoặc disk đầy.

**Giải pháp**:

1. Upgrade VM size (nếu không free tier):
   ```bash
   az vm resize --resource-group restaurant-rg --name restaurant-vm --size Standard_B2ats
   ```
2. Clean up Docker:
   ```bash
   docker system prune -af
   docker volume prune -f
   ```
3. Kiểm tra disk space:
   ```bash
   df -h
   ```

## 📊 Monitoring

### Check VM status

```bash
az vm show -d -g restaurant-rg -n restaurant-vm
```

### Check public IP

```bash
az vm show -d -g restaurant-rg -n restaurant-vm --query publicIps -o tsv
```

### Check NSG rules

```bash
az network nsg rule list --resource-group restaurant-rg --nsg-name restaurant-nsg -o table
```

### Check VM metrics

```bash
# CPU usage
az monitor metrics list \
  --resource /subscriptions/<subscription-id>/resourceGroups/restaurant-rg/providers/Microsoft.Compute/virtualMachines/restaurant-vm \
  --metric "Percentage CPU" \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z
```

## 💰 Cost Optimization

### Azure Student Free Tier Tips:

1. **VM Size**: Chỉ dùng Standard_B1s, Standard_B2ats, hoặc Standard_B2pts
2. **Disk**: Dùng P6 (64GB) hoặc Standard HDD/SSD nhỏ hơn
3. **Shutdown VM**: Khi không dùng, shutdown VM để tiết kiệm hours:
   ```bash
   az vm deallocate --resource-group restaurant-rg --name restaurant-vm
   ```
4. **Start VM**: Khi cần dùng:
   ```bash
   az vm start --resource-group restaurant-rg --name restaurant-vm
   ```

## 📝 Quick Reference

### Common Commands

```bash
# SSH vào VM
ssh -i ~/.ssh/azure_deploy_key azureuser@<PUBLIC_IP>

# Check VM status
az vm show -d -g restaurant-rg -n restaurant-vm

# Get public IP
az vm show -d -g restaurant-rg -n restaurant-vm --query publicIps -o tsv

# Start VM
az vm start --resource-group restaurant-rg --name restaurant-vm

# Stop VM (deallocate to save money)
az vm deallocate --resource-group restaurant-rg --name restaurant-vm

# Restart VM
az vm restart --resource-group restaurant-rg --name restaurant-vm

# Delete VM (careful!)
az vm delete --resource-group restaurant-rg --name restaurant-vm --yes
```

### Access URLs

Sau khi deploy thành công:

- **Backend API**: `https://<PUBLIC_IP>:8000`
- **User Web**: `https://<PUBLIC_IP>:3000`
- **Admin Web**: `https://<PUBLIC_IP>:3001`
- **Health Check**: `https://<PUBLIC_IP>:8000/health`

## 🔗 Resources

- [Azure Student Free Account](https://azure.microsoft.com/en-us/free/students/)
- [Azure VM Documentation](https://docs.microsoft.com/en-us/azure/virtual-machines/)
- [Azure NSG Documentation](https://docs.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview)
- [Azure CLI Documentation](https://docs.microsoft.com/en-us/cli/azure/)
