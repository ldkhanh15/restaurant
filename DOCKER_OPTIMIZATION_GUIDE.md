# 🚀 Docker Optimization Guide for t3.micro (1GB RAM)

Hướng dẫn tối ưu Docker và Docker Compose để chạy hiệu quả trên AWS EC2 t3.micro (1GB RAM).

## 📊 Resource Allocation Summary

| Service       | Memory Limit | CPU Limit   | Memory Reservation | CPU Reservation |
| ------------- | ------------ | ----------- | ------------------ | --------------- |
| **MySQL**     | 256MB        | 0.5 CPU     | 128MB              | 0.25 CPU        |
| **Backend**   | 384MB        | 0.5 CPU     | 256MB              | 0.25 CPU        |
| **Chatbot**   | 256MB        | 0.3 CPU     | 128MB              | 0.1 CPU         |
| **Admin Web** | 128MB        | 0.2 CPU     | 64MB               | 0.1 CPU         |
| **User Web**  | 128MB        | 0.2 CPU     | 64MB               | 0.1 CPU         |
| **Total**     | **~1.15GB**  | **1.7 CPU** | **640MB**          | **0.8 CPU**     |

**Note**: Limits tổng > 1GB vì Docker overhead và swap file hỗ trợ.

## 🔧 Optimizations Applied

### 1. Dockerfile Optimizations

#### Backend (`be_restaurant/Dockerfile`)

- ✅ **Multi-stage build** - Loại bỏ dev dependencies khỏi production image
- ✅ **BuildKit cache mounts** - Cache npm packages giữa các lần build
- ✅ **Node.js memory limits**:
  - Build: 512MB (`NODE_OPTIONS="--max-old-space-size=512"`)
  - Production: 256MB (`NODE_OPTIONS="--max-old-space-size=256"`)
- ✅ **npm optimizations**: `--prefer-offline --no-audit` để giảm network và memory

#### Frontend (`admin-web/Dockerfile`, `user-web/Dockerfile`)

- ✅ **Multi-stage build** với 3 stages (deps, builder, runner)
- ✅ **BuildKit cache mounts**:
  - npm cache: `/root/.npm`
  - Next.js cache: `/app/.next/cache`
- ✅ **Node.js memory limits**:
  - Build: 512MB
  - Production: 96MB (frontend cần ít memory hơn)
- ✅ **Next.js telemetry disabled**: `NEXT_TELEMETRY_DISABLED=1`

#### Chatbot (`chatbot/Dockerfile`)

- ✅ **Multi-stage build** - Loại bỏ gcc và build dependencies
- ✅ **pip cache mount** - Cache Python packages
- ✅ **Python optimizations**:
  - `PYTHONDONTWRITEBYTECODE=1` - Không tạo .pyc files
  - `PYTHONHASHSEED=random` - Tối ưu hash

### 2. Docker Compose Optimizations

#### MySQL Memory Optimization

```yaml
command:
  - --innodb-buffer-pool-size=128M # Giảm từ default 128MB
  - --innodb-log-file-size=32M # Giảm log file size
  - --max-connections=50 # Giảm từ default 151
  - --table-open-cache=200 # Giảm cache
  - --thread-cache-size=8 # Giảm thread cache
  - --query-cache-size=0 # Tắt query cache (deprecated)
  - --tmp-table-size=16M # Giảm temp table size
  - --max-heap-table-size=16M
  - --sort-buffer-size=2M # Giảm sort buffer
  - --read-buffer-size=1M
  - --read-rnd-buffer-size=1M
  - --join-buffer-size=2M
  - --key-buffer-size=8M
```

#### Resource Limits

Tất cả services đều có:

- **Memory limits** - Ngăn container sử dụng quá nhiều RAM
- **CPU limits** - Đảm bảo fair CPU sharing
- **Reservations** - Đảm bảo minimum resources

#### Build Optimizations

- ✅ **BuildKit inline cache**: `BUILDKIT_INLINE_CACHE: 1`
- ✅ **Cache mounts** trong Dockerfiles
- ✅ **Parallel builds** với Docker Compose

## 📈 Build Performance

### Before Optimization

- Build time: ~10-15 phút
- Build memory: ~2-3GB peak
- Image sizes: Large (bao gồm dev dependencies)

### After Optimization

- Build time: ~8-12 phút (với cache)
- Build memory: ~1-1.5GB peak
- Image sizes: Reduced 30-40%

## 🎯 Runtime Memory Usage

### Expected Memory Usage (t3.micro)

```
MySQL:        ~180-220MB (peak: 256MB)
Backend:      ~280-320MB (peak: 384MB)
Chatbot:      ~150-200MB (peak: 256MB)
Admin Web:    ~80-100MB  (peak: 128MB)
User Web:     ~80-100MB  (peak: 128MB)
Docker:       ~50-100MB
System:       ~100-150MB
----------------------------------------
Total:        ~920MB - 1.2GB
```

**With 2GB swap file**: System có thể handle peak loads tốt hơn.

## 🛠️ Build Commands

### Enable BuildKit (Required for cache mounts)

```bash
# Set environment variable
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Or in docker-compose
DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 docker-compose build
```

### Build with Cache

```bash
# Build all services with cache
docker-compose build

# Build specific service
docker-compose build backend

# Build without cache (clean build)
docker-compose build --no-cache
```

### Build Optimization Tips

1. **Use BuildKit**: Always enable BuildKit for cache mounts
2. **Layer ordering**: Dependencies copied before source code
3. **Multi-stage builds**: Separate build and runtime environments
4. **Cache mounts**: npm, pip, and Next.js caches persist between builds

## 🔍 Monitoring Resource Usage

### Check Container Resources

```bash
# Real-time stats
docker stats

# Specific container
docker stats restaurant_backend

# Memory usage details
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.MemPerc}}"
```

### Check System Resources

```bash
# Memory
free -h

# Disk
df -h

# Swap
swapon --show

# Process memory
ps aux --sort=-%mem | head -10
```

## ⚠️ Troubleshooting

### Out of Memory Errors

**Symptoms:**

- Containers killed with `OOMKilled`
- Services crash randomly
- Build fails with memory errors

**Solutions:**

1. **Increase swap file**:

   ```bash
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

2. **Reduce resource limits** (if needed):

   ```yaml
   deploy:
     resources:
       limits:
         memory: 200M # Reduce from 256M
   ```

3. **Stop unused containers**:
   ```bash
   docker ps
   docker stop <unused-container>
   ```

### Build Fails Due to Memory

**Solutions:**

1. **Build one service at a time**:

   ```bash
   docker-compose build mysql
   docker-compose build chatbot
   docker-compose build backend
   docker-compose build admin-web
   docker-compose build user-web
   ```

2. **Increase Node.js build memory** (temporary):

   ```dockerfile
   ENV NODE_OPTIONS="--max-old-space-size=768"
   ```

3. **Use swap during build**:
   ```bash
   # Ensure swap is active
   swapon --show
   ```

### Slow Performance

**Check:**

1. **CPU throttling**:

   ```bash
   docker stats --no-stream
   # Check if CPU% is hitting limits
   ```

2. **Memory pressure**:

   ```bash
   free -h
   # Check if swap is being used heavily
   ```

3. **Disk I/O**:
   ```bash
   iostat -x 1
   ```

## 📝 Best Practices

### 1. Regular Cleanup

```bash
# Remove unused images
docker image prune -af

# Remove unused volumes
docker volume prune -f

# Remove build cache (if needed)
docker builder prune -af
```

### 2. Monitor Resource Usage

```bash
# Set up monitoring script
watch -n 5 'docker stats --no-stream'
```

### 3. Optimize MySQL Queries

- Use indexes properly
- Limit result sets
- Avoid N+1 queries
- Use connection pooling

### 4. Optimize Node.js

- Use production mode: `NODE_ENV=production`
- Limit heap size with `NODE_OPTIONS`
- Use clustering for high traffic (not needed for t3.micro)

## 🎯 Performance Targets

### Build Time

- **First build**: 10-15 minutes (no cache)
- **Cached build**: 5-8 minutes
- **Incremental build**: 2-5 minutes

### Runtime Memory

- **Idle**: ~600-700MB
- **Normal load**: ~800-950MB
- **Peak load**: ~1.0-1.2GB (with swap)

### Startup Time

- **MySQL**: 20-30 seconds
- **Chatbot**: 10-15 seconds
- **Backend**: 60-120 seconds (database sync)
- **Frontend**: 5-10 seconds

## 📚 Additional Resources

- [Docker BuildKit](https://docs.docker.com/build/buildkit/)
- [MySQL Memory Optimization](https://dev.mysql.com/doc/refman/8.0/en/memory-use.html)
- [Node.js Memory Management](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Docker Resource Limits](https://docs.docker.com/config/containers/resource_constraints/)

---

**Last Updated**: 2025-11-09
