# 🤖 Chatbot Docker Integration

## 📋 Tổng quan

Chatbot service đã được tích hợp vào Docker Compose với các đặc điểm sau:

### 🏗️ Kiến trúc

```
┌─────────────────┐         ┌─────────────────┐
│   Admin Web     │         │    User Web     │
│  (Port 3001)    │         │  (Port 3000)    │
└────────┬────────┘         └────────┬────────┘
         │                           │
         └──────────┬────────────────┘
                    │ HTTP Requests
         ┌──────────▼────────────┐
         │   Backend (Node.js)   │ ◄─── Exposed: localhost:8000
         │    (Port 8000)        │
         └──────────┬────────────┘
                    │
         ┌──────────┴────────────┐
         │                       │
    ┌────▼─────┐         ┌──────▼──────┐
    │  MySQL   │         │   Chatbot   │
    │  (3306)  │         │   (7860)    │
    └──────────┘         └─────────────┘
    
    ✅ Exposed: backend, admin-web, user-web
    ❌ NOT Exposed: mysql, chatbot (internal only)
```

### 🔐 Port Exposure Strategy

| Service | Port | Exposed? | Access From |
|---------|------|----------|-------------|
| **backend** | 8000 | ✅ Yes | Host machine (localhost:8000) |
| **admin-web** | 3001 | ✅ Yes | Host machine (localhost:3001) |
| **user-web** | 3000 | ✅ Yes | Host machine (localhost:3000) |
| **chatbot** | 7860 | ❌ No | Docker network only |
| **mysql** | 3306 | ❌ No | Docker network only |

### 🔄 Communication Flow

#### 1. **User → Frontend → Backend**
- User accesses `localhost:3000` (user-web) or `localhost:3001` (admin-web)
- Frontend sends requests to `localhost:8000` (backend)

#### 2. **Backend → Chatbot**
- Backend calls chatbot at `http://chatbot:7860/api/generate`
- Uses Docker service name `chatbot` (DNS resolution within Docker network)

#### 3. **Chatbot → Backend**
- Chatbot calls backend at `http://backend:8000/api/*`
- Uses Docker service name `backend`

#### 4. **Backend/Chatbot → MySQL**
- Both services connect to `mysql:3306`
- No external access needed

---

## 📁 Files Created/Modified

### New Files:
1. ✅ **`chatbot/Dockerfile`** - Chatbot container definition
2. ✅ **`chatbot/.dockerignore`** - Ignore patterns for Docker build
3. ✅ **`CHATBOT_DOCKER_INTEGRATION.md`** - This documentation

### Modified Files:
4. ✅ **`docker-compose.yml`**
   - Added `chatbot` service
   - Updated `backend` dependencies to include `chatbot`
   - Added `CHATBOT_URL` env var to backend
   - Removed port exposure for `mysql` (security improvement)
   - Kept `chatbot` internal (no port exposure)

---

## 🐳 Chatbot Dockerfile Details

### Base Image
```dockerfile
FROM python:3.10-slim
```

### Key Features:
- ✅ **Multi-stage caching** - Requirements installed first for faster rebuilds
- ✅ **System dependencies** - `libmagic1` for MIME type detection
- ✅ **Health check** - Automatic health monitoring
- ✅ **Environment variables** - `BE_URL` configured for Docker network
- ✅ **Volume mounts** - Logs and DB persisted to host

### Environment Variables:
```dockerfile
ENV PYTHONUNBUFFERED=1
ENV BE_URL=http://backend:8000/api
```

### Exposed Port:
```dockerfile
EXPOSE 7860
```
**Note:** Port is exposed in Dockerfile but NOT mapped to host in `docker-compose.yml`

---

## 🛠️ Docker Compose Configuration

### Chatbot Service:
```yaml
chatbot:
  build:
    context: ./chatbot
    dockerfile: Dockerfile
  container_name: restaurant_chatbot
  restart: unless-stopped
  # No ports exposed - only accessible within Docker network
  environment:
    BE_URL: http://backend:8000/api
    PYTHONUNBUFFERED: 1
  volumes:
    - ./chatbot/chatbot.log:/app/chatbot.log
    - ./chatbot/hiwell_chatbot.db:/app/hiwell_chatbot.db
  networks:
    - app-network
  depends_on:
    mysql:
      condition: service_healthy
  healthcheck:
    test: ["CMD", "python", "-c", "import requests; requests.get('http://localhost:7860/api/health', timeout=5)"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

### Backend Service (Updated):
```yaml
backend:
  # ... existing config ...
  environment:
    # ... existing env vars ...
    CHATBOT_URL: http://chatbot:7860  # ← NEW
  depends_on:
    mysql:
      condition: service_healthy
    chatbot:
      condition: service_healthy  # ← NEW
```

### MySQL Service (Updated):
```yaml
mysql:
  # ... existing config ...
  # No ports exposed - only accessible within Docker network
  # ports:  # ← REMOVED for security
  #   - "${MYSQL_PORT:-3306}:3306"
```

---

## 🚀 Deployment Commands

### Build and Start All Services:
```bash
# Option 1: Build and start in one command
docker-compose up --build -d

# Option 2: Build first, then start
docker-compose build
docker-compose up -d
```

### Build Individual Services:
```bash
# Build only chatbot
docker-compose build chatbot

# Build backend (if chatbot env vars changed)
docker-compose build backend

# Start all services
docker-compose up -d
```

### Check Status:
```bash
# View all services
docker-compose ps

# Expected output:
# NAME                    STATUS              PORTS
# restaurant_mysql        Up (healthy)        (no ports exposed)
# restaurant_chatbot      Up (healthy)        (no ports exposed)
# restaurant_backend      Up (healthy)        0.0.0.0:8000->8000/tcp
# restaurant_admin_web    Up (healthy)        0.0.0.0:3001->3001/tcp
# restaurant_user_web     Up (healthy)        0.0.0.0:3000->3000/tcp
```

### View Logs:
```bash
# View chatbot logs
docker-compose logs -f chatbot

# View backend logs (to see chatbot API calls)
docker-compose logs -f backend

# View all logs
docker-compose logs -f
```

### Test Chatbot Health:
```bash
# From within Docker network (via backend container)
docker exec restaurant_backend curl http://chatbot:7860/api/health

# Expected response:
# {"status":"healthy","service":"chatbot"}
```

---

## 🔍 Testing Integration

### 1. Test Chatbot → Backend Communication:
```bash
# Exec into chatbot container
docker exec -it restaurant_chatbot /bin/bash

# Test backend connectivity
curl http://backend:8000/api/health

# Expected: {"status":"healthy","message":"Server is running"}
```

### 2. Test Backend → Chatbot Communication:
```bash
# Exec into backend container
docker exec -it restaurant_backend /bin/sh

# Test chatbot connectivity
curl http://chatbot:7860/api/health

# Expected: {"status":"healthy","service":"chatbot"}
```

### 3. Test End-to-End (from host machine):
```bash
# Test backend (which calls chatbot internally)
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message": "Xin chào"}'

# Backend will internally call chatbot at http://chatbot:7860/api/generate
```

---

## 🔧 Troubleshooting

### Issue 1: Chatbot not healthy
```bash
# Check chatbot logs
docker-compose logs chatbot

# Common causes:
# - Python dependencies failed to install
# - BE_URL misconfigured
# - Port 7860 already in use in container
```

**Solution:**
```bash
# Rebuild chatbot
docker-compose build --no-cache chatbot
docker-compose up -d chatbot
```

### Issue 2: Backend can't reach chatbot
```bash
# Check if chatbot is healthy
docker-compose ps

# Check network connectivity
docker exec restaurant_backend ping chatbot
```

**Solution:**
```bash
# Ensure both are on same network
docker network inspect restaurant_network

# Restart backend
docker-compose restart backend
```

### Issue 3: Chatbot can't reach backend
```bash
# Check BE_URL env var
docker exec restaurant_chatbot env | grep BE_URL

# Should show: BE_URL=http://backend:8000/api
```

**Solution:**
```bash
# If incorrect, rebuild with correct env var
docker-compose up -d --force-recreate chatbot
```

### Issue 4: MySQL connection refused
```bash
# Check if MySQL is healthy
docker-compose ps mysql

# Check if chatbot can reach MySQL (if needed)
docker exec restaurant_chatbot ping mysql
```

**Solution:**
```bash
# Wait for MySQL to be healthy
docker-compose up -d mysql
# Wait ~30 seconds for health check to pass
docker-compose up -d chatbot backend
```

---

## 🔐 Security Considerations

### ✅ What's Secure:
1. **Chatbot not exposed** - Only accessible within Docker network
2. **MySQL not exposed** - Only accessible within Docker network
3. **Service isolation** - Each service runs in its own container
4. **Environment variables** - Sensitive config not in code

### ⚠️ Security Recommendations:
1. **Add API rate limiting** to chatbot endpoints
2. **Use secrets management** for Gemini API key (currently hardcoded)
3. **Enable HTTPS** for production (use nginx reverse proxy)
4. **Add authentication** for chatbot API (if needed)
5. **Scan images** for vulnerabilities: `docker scan restaurant_chatbot`

### 🔑 Secrets to Secure (TODO):
```python
# In chatbot/chatbot.py line 28:
genai.configure(api_key="AIzaSyDNHlqLN8GbMgYaSiyBJR052cfe5ESMKjU")
# ⚠️ This should be an environment variable!
```

**Recommended Fix:**
```python
# chatbot/chatbot.py
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# docker-compose.yml
chatbot:
  environment:
    GEMINI_API_KEY: ${GEMINI_API_KEY}
```

---

## 📊 Service Dependencies

```
mysql (first)
  ↓
chatbot (depends on mysql)
  ↓
backend (depends on mysql + chatbot)
  ↓
admin-web (depends on backend)
user-web (depends on backend)
```

### Startup Order:
1. ✅ MySQL starts and becomes healthy
2. ✅ Chatbot starts (after MySQL is healthy)
3. ✅ Backend starts (after MySQL + Chatbot are healthy)
4. ✅ Frontend services start (after Backend is healthy)

---

## 🎯 Summary

### What Changed:
- ✅ Added Chatbot as Docker service
- ✅ Backend now depends on Chatbot
- ✅ Chatbot NOT exposed to host (security)
- ✅ MySQL NOT exposed to host (security)
- ✅ Inter-service communication via Docker network
- ✅ Health checks for all services
- ✅ Persistent volumes for logs and DB

### Services Exposed to Host:
1. ✅ Backend - `localhost:8000`
2. ✅ Admin Web - `localhost:3001`
3. ✅ User Web - `localhost:3000`

### Services Internal Only:
1. ❌ MySQL - `mysql:3306` (Docker network only)
2. ❌ Chatbot - `chatbot:7860` (Docker network only)

---

**Updated:** 2025-11-09  
**Status:** ✅ Ready for deployment

