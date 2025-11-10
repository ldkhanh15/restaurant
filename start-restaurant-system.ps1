# ============================================
# Restaurant Management System Startup Script
# ============================================
# This script starts all services in the correct order with proper health checks
# Optimized for Windows with Docker Desktop

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Starting Restaurant Management System" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Function to check container health status
function Wait-ForHealthy {
    param(
        [string]$ContainerName,
        [string]$ServiceName,
        [int]$MaxWait = 180,
        [int]$Interval = 10
    )
    
    Write-Host "Waiting for $ServiceName to become healthy (max $MaxWait seconds)..." -ForegroundColor Yellow
    $waited = 0
    
    while ($waited -lt $MaxWait) {
        Start-Sleep -Seconds $Interval
        $waited += $Interval
        
        $status = docker inspect $ContainerName --format='{{.State.Health.Status}}' 2>$null
        
        if ($status -eq "healthy") {
            Write-Host "✓ $ServiceName is healthy!" -ForegroundColor Green
            return $true
        }
        
        if ($status -eq "unhealthy") {
            Write-Host "✗ $ServiceName is unhealthy!" -ForegroundColor Red
            Write-Host "  Check logs with: docker-compose logs $($ServiceName.ToLower())" -ForegroundColor Yellow
            return $false
        }
        
        Write-Host "  Waiting... ($waited/$MaxWait seconds) - Status: $status" -ForegroundColor Gray
    }
    
    Write-Host "✗ $ServiceName failed to become healthy after $MaxWait seconds" -ForegroundColor Red
    return $false
}

# Step 1: Stop any existing containers
Write-Host "[1/5] Stopping existing containers..." -ForegroundColor Yellow
docker-compose down 2>&1 | Out-Null

# Step 2: Start MySQL first
Write-Host "`n[2/5] Starting MySQL database..." -ForegroundColor Yellow
docker-compose up -d mysql

if (-not (Wait-ForHealthy -ContainerName "restaurant_mysql" -ServiceName "MySQL" -MaxWait 120)) {
    Write-Host "`n❌ MySQL failed to start. Showing logs:" -ForegroundColor Red
    docker-compose logs mysql --tail 30
    exit 1
}

# Step 3: Start Chatbot
Write-Host "`n[3/5] Starting Chatbot service..." -ForegroundColor Yellow
docker-compose up -d chatbot

if (-not (Wait-ForHealthy -ContainerName "restaurant_chatbot" -ServiceName "Chatbot" -MaxWait 120)) {
    Write-Host "`n⚠️  Chatbot health check failed, but continuing..." -ForegroundColor Yellow
    docker-compose logs chatbot --tail 20
}

# Step 4: Start Backend
Write-Host "`n[4/5] Starting Backend API (database sync may take 2-3 minutes)..." -ForegroundColor Yellow
docker-compose up -d backend

if (-not (Wait-ForHealthy -ContainerName "restaurant_backend" -ServiceName "Backend" -MaxWait 240)) {
    Write-Host "`n❌ Backend failed to start. Showing logs:" -ForegroundColor Red
    docker-compose logs backend --tail 50
    exit 1
}

# Step 5: Start Frontend services
Write-Host "`n[5/5] Starting Frontend services (Admin Web, User Web)..." -ForegroundColor Yellow
docker-compose up -d admin-web user-web

# Wait for frontend services to initialize
Write-Host "Waiting for frontend services to initialize (60 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

# Check frontend health
$adminStatus = docker inspect restaurant_admin_web --format='{{.State.Health.Status}}' 2>$null
$userStatus = docker inspect restaurant_user_web --format='{{.State.Health.Status}}' 2>$null

if ($adminStatus -eq "healthy") {
    Write-Host "✓ Admin Web is healthy!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Admin Web status: $adminStatus" -ForegroundColor Yellow
}

if ($userStatus -eq "healthy") {
    Write-Host "✓ User Web is healthy!" -ForegroundColor Green
} else {
    Write-Host "⚠️  User Web status: $userStatus" -ForegroundColor Yellow
}

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
