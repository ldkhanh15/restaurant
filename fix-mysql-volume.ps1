# ============================================
# Fix MySQL Volume Script
# ============================================
# This script removes the corrupted MySQL volume and recreates it
# WARNING: This will delete all MySQL data!

Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "⚠️  WARNING: This will DELETE all MySQL data!" -ForegroundColor Red
Write-Host "========================================`n" -ForegroundColor Yellow

$confirm = Read-Host "Are you sure you want to continue? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Aborted." -ForegroundColor Yellow
    exit 0
}

Write-Host "`n[1/4] Stopping all containers..." -ForegroundColor Yellow
docker-compose down 2>&1 | Out-Null

Write-Host "[2/4] Removing MySQL container..." -ForegroundColor Yellow
docker rm -f restaurant_mysql 2>&1 | Out-Null

Write-Host "[3/4] Removing MySQL volume..." -ForegroundColor Yellow
# Force remove volume even if in use
docker volume rm -f restaurant_mysql_data 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Volume removed successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  Volume removal returned error (may not exist or still in use)" -ForegroundColor Yellow
    Write-Host "   Trying to prune unused volumes..." -ForegroundColor Yellow
    docker volume prune -f 2>&1 | Out-Null
}

# Wait a moment for cleanup
Start-Sleep -Seconds 2

Write-Host "[4/4] Starting MySQL with fresh volume..." -ForegroundColor Yellow
docker-compose up -d mysql

Write-Host "`n✅ MySQL container started!" -ForegroundColor Green
Write-Host "Waiting for MySQL to initialize (90 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 90

Write-Host "`nChecking MySQL status..." -ForegroundColor Yellow
docker-compose ps mysql

Write-Host "`nChecking MySQL logs (last 20 lines)..." -ForegroundColor Yellow
docker-compose logs mysql --tail 20

$healthStatus = docker inspect restaurant_mysql --format='{{.State.Health.Status}}' 2>$null
if ($healthStatus -eq "healthy") {
    Write-Host "`n✅ MySQL is healthy! You can now run: .\start-restaurant-system.ps1" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  MySQL status: $healthStatus" -ForegroundColor Yellow
    Write-Host "   Check logs with: docker-compose logs mysql" -ForegroundColor Yellow
    Write-Host "   If still unhealthy, the volume may need manual cleanup." -ForegroundColor Yellow
}

