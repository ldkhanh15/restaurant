# CI/CD SSH Setup Guide

## Vấn đề thường gặp

Nếu GitHub Actions báo lỗi ở bước "Setup SSH", có thể do:

1. **SSH key format không đúng**
2. **EC2_HOST không đúng**
3. **Security Group chưa mở port 22**
4. **SSH key không match với public key trên EC2**

## Cách setup SSH key đúng

### Bước 1: Tạo SSH key pair (nếu chưa có)

```bash
# Tạo SSH key mới
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github_deploy_key -N ""

# Hoặc tạo với ed25519 (nhẹ hơn, bảo mật hơn)
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy_key -N ""
```

### Bước 2: Copy public key lên EC2

```bash
# Copy public key lên EC2 (thay đổi user và IP)
ssh-copy-id -i ~/.ssh/github_deploy_key.pub ec2-user@98.91.23.236

# Hoặc manual:
cat ~/.ssh/github_deploy_key.pub | ssh ec2-user@98.91.23.236 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### Bước 3: Test SSH connection

```bash
# Test kết nối
ssh -i ~/.ssh/github_deploy_key ec2-user@98.91.23.236

# Nếu thành công, bạn sẽ vào được EC2
```

### Bước 4: Thêm SSH key vào GitHub Secrets

1. Vào GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Thêm các secrets sau:

#### `EC2_SSH_KEY`

- Copy **PRIVATE KEY** (không phải public key!)
- Format:
  ```
  -----BEGIN OPENSSH PRIVATE KEY-----
  b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAACFwAAAAdzc2gtcn
  ...
  -----END OPENSSH PRIVATE KEY-----
  ```
- Hoặc:
  ```
  -----BEGIN RSA PRIVATE KEY-----
  MIIEpAIBAAKCAQEA...
  -----END RSA PRIVATE KEY-----
  ```

#### `EC2_HOST`

- IP hoặc domain của EC2 instance
- Ví dụ: `98.91.23.236` hoặc `ec2-xx-xx-xx-xx.ap-southeast-2.compute.amazonaws.com`

#### `EC2_USER`

- User trên EC2
- Với Amazon Linux 2023: `ec2-user`
- Với Ubuntu: `ubuntu`

#### `EC2_DEPLOY_PATH` (optional)

- Đường dẫn deploy trên EC2
- Default: `/home/ec2-user/restaurant`

### Bước 5: Kiểm tra Security Group

EC2 Security Group phải cho phép SSH từ GitHub Actions:

1. Vào **EC2 Console** → **Security Groups**
2. Chọn Security Group của instance
3. **Inbound rules** → **Edit inbound rules**
4. Thêm rule:
   - **Type**: SSH
   - **Port**: 22
   - **Source**: `0.0.0.0/0` (hoặc GitHub Actions IP ranges nếu muốn bảo mật hơn)

> **Lưu ý**: GitHub Actions IP ranges thay đổi thường xuyên. Nếu muốn bảo mật hơn, có thể dùng GitHub Actions IP ranges API hoặc cho phép từ mọi nơi (0.0.0.0/0) nếu chỉ dùng SSH key authentication.

## Troubleshooting

### Lỗi: "Invalid SSH key format"

**Nguyên nhân**: SSH key trong GitHub Secrets không đúng format.

**Giải pháp**:

1. Đảm bảo copy **PRIVATE KEY** (file không có `.pub`)
2. Copy toàn bộ từ `-----BEGIN` đến `-----END`
3. Không có thêm ký tự hoặc dòng trống thừa

### Lỗi: "SSH connection failed"

**Nguyên nhân**: Không thể kết nối SSH đến EC2.

**Giải pháp**:

1. Kiểm tra `EC2_HOST` có đúng không
2. Kiểm tra Security Group đã mở port 22 chưa
3. Test SSH từ local:
   ```bash
   ssh -i ~/.ssh/github_deploy_key ec2-user@98.91.23.236
   ```
4. Kiểm tra EC2 instance đang running

### Lỗi: "Permission denied (publickey)"

**Nguyên nhân**: Public key không match với private key trên EC2.

**Giải pháp**:

1. Đảm bảo đã copy public key lên EC2:
   ```bash
   ssh-copy-id -i ~/.ssh/github_deploy_key.pub ec2-user@98.91.23.236
   ```
2. Kiểm tra `~/.ssh/authorized_keys` trên EC2 có chứa public key
3. Kiểm tra permissions:
   ```bash
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   ```

### Lỗi: "Could not add to known_hosts"

**Nguyên nhân**: `ssh-keyscan` không thể kết nối được.

**Giải pháp**:

- Workflow sẽ tự động bỏ qua và dùng `StrictHostKeyChecking=no`
- Nếu vẫn lỗi, kiểm tra EC2_HOST và Security Group

## Test manual từ local

```bash
# Test SSH
ssh -i ~/.ssh/github_deploy_key ec2-user@98.91.23.236

# Test với các options giống GitHub Actions
ssh -i ~/.ssh/github_deploy_key \
  -o StrictHostKeyChecking=no \
  -o ConnectTimeout=10 \
  -o BatchMode=yes \
  ec2-user@98.91.23.236 \
  "echo 'SSH connection successful'"
```

## GitHub Actions IP Ranges (nếu muốn bảo mật hơn)

GitHub Actions IP ranges thay đổi thường xuyên. Có thể lấy từ:

- API: `https://api.github.com/meta`
- Hoặc cho phép từ mọi nơi (0.0.0.0/0) nếu chỉ dùng SSH key authentication

## Quick Checklist

- [ ] SSH key pair đã được tạo
- [ ] Public key đã được copy lên EC2 (`~/.ssh/authorized_keys`)
- [ ] Private key đã được thêm vào GitHub Secrets (`EC2_SSH_KEY`)
- [ ] `EC2_HOST` đã được set trong GitHub Secrets
- [ ] `EC2_USER` đã được set trong GitHub Secrets (ví dụ: `ec2-user`)
- [ ] Security Group đã mở port 22
- [ ] EC2 instance đang running
- [ ] Test SSH từ local thành công
