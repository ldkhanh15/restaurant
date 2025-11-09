# ============================================
# Restaurant Management System Startup Script
# ============================================
# This script starts all services in the correct order with proper timing

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Starting Restaurant Management System" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Stop any existing containers
Write-Host "[1/4] Stopping existing containers..." -ForegroundColor Yellow
docker-compose down 2>&1 | Out-Null

# Step 2: Start infrastructure services (MySQL, Chatbot, Backend)
Write-Host "[2/4] Starting infrastructure services (MySQL, Chatbot, Backend)..." -ForegroundColor Yellow
docker-compose up -d mysql chatbot backend

# Step 3: Wait for backend to become healthy (database sync takes ~2 minutes)
Write-Host "[3/4] Waiting for backend to complete database sync (this may take 2-3 minutes)..." -ForegroundColor Yellow
$maxWait = 180 # 3 minutes
$waited = 0
$interval = 10

while ($waited -lt $maxWait) {
    Start-Sleep -Seconds $interval
    $waited += $interval
    
    $status = docker inspect restaurant_backend --format='{{.State.Health.Status}}' 2>$null
    
    if ($status -eq "healthy") {
        Write-Host "✓ Backend is healthy!" -ForegroundColor Green
        break
    }
    
    Write-Host "  Waiting... ($waited/$maxWait seconds)" -ForegroundColor Gray
}

if ($status -ne "healthy") {
    Write-Host "✗ Backend failed to become healthy after $maxWait seconds" -ForegroundColor Red
    Write-Host "  Check logs with: docker-compose logs backend" -ForegroundColor Yellow
    exit 1
}

# Step 4: Start frontend services
Write-Host "[4/4] Starting frontend services (Admin Web, User Web)..." -ForegroundColor Yellow
docker-compose up -d admin-web user-web

# Wait for frontend health checks
Write-Host "Waiting for frontend services to become healthy (60 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

# Display final status
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "System Status" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

docker-compose ps

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Access URLs" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "⚠️  IMPORTANT: Use IPv4 addresses (not localhost)!" -ForegroundColor Yellow
Write-Host "`nBackend API:  http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "User Web:     http://127.0.0.1:3000" -ForegroundColor Green
Write-Host "Admin Web:    http://127.0.0.1:3001" -ForegroundColor Green
Write-Host "`nHealth Check: http://127.0.0.1:8000/health" -ForegroundColor Gray
Write-Host "`nNote: If using 'localhost' gives ERR_CONNECTION_RESET," -ForegroundColor DarkGray
Write-Host "      this is due to WSL port forwarding conflict." -ForegroundColor DarkGray
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "System Started Successfully! 🚀" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

