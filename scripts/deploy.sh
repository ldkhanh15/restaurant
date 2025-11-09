#!/bin/bash
# ============================================
# Deployment Script for AWS EC2
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
# Auto-detect user home directory
if [ "$USER" = "ec2-user" ]; then
  DEFAULT_DEPLOY_PATH="/home/ec2-user/restaurant"
else
  DEFAULT_DEPLOY_PATH="/home/$USER/restaurant"
fi
DEPLOY_PATH="${DEPLOY_PATH:-$DEFAULT_DEPLOY_PATH}"
BRANCH="${BRANCH:-main}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🚀 Restaurant System Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
  echo -e "${RED}❌ Please do not run as root${NC}"
  exit 1
fi

# Navigate to deployment directory
cd "$DEPLOY_PATH" || {
  echo -e "${RED}❌ Deployment directory not found: $DEPLOY_PATH${NC}"
  exit 1
}

# Pull latest code
echo -e "${YELLOW}📥 Pulling latest code from $BRANCH...${NC}"
git fetch origin
git reset --hard "origin/$BRANCH"

# Create .env files if they don't exist
if [ ! -f .env ]; then
  echo -e "${YELLOW}📝 Creating .env file from example...${NC}"
  cp env.example .env
  echo -e "${YELLOW}⚠️  Please update .env file with your configuration!${NC}"
fi

if [ ! -f be_restaurant/.env ]; then
  echo -e "${YELLOW}📝 Creating backend .env file...${NC}"
  cp be_restaurant/env.example be_restaurant/.env
  echo -e "${YELLOW}⚠️  Please update be_restaurant/.env file with your configuration!${NC}"
fi

# Check Docker and Docker Compose
if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Docker is not installed${NC}"
  exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
  echo -e "${RED}❌ Docker Compose is not installed${NC}"
  exit 1
fi

# Use docker compose (v2) if available, otherwise docker-compose (v1)
COMPOSE_CMD="docker-compose"
if docker compose version &> /dev/null; then
  COMPOSE_CMD="docker compose"
fi

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
$COMPOSE_CMD down || true

# Clean up old images (t3.micro has limited storage)
echo -e "${YELLOW}🧹 Cleaning up old Docker images...${NC}"
docker image prune -af --filter "until=24h" || true

# Build services
echo -e "${YELLOW}🔨 Building Docker images...${NC}"
$COMPOSE_CMD build --no-cache

# Start services
echo -e "${YELLOW}🚀 Starting services...${NC}"
$COMPOSE_CMD up -d

# Wait for services to initialize
echo -e "${YELLOW}⏳ Waiting for services to initialize...${NC}"
sleep 30

# Check service status
echo -e "${GREEN}📊 Service Status:${NC}"
$COMPOSE_CMD ps

# Health check
echo -e "${YELLOW}🏥 Running health checks...${NC}"
MAX_RETRIES=20
RETRY_COUNT=0
HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy!${NC}"
    HEALTHY=true
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo -e "${YELLOW}⏳ Waiting for backend... ($RETRY_COUNT/$MAX_RETRIES)${NC}"
  sleep 10
done

if [ "$HEALTHY" = false ]; then
  echo -e "${RED}❌ Backend health check failed!${NC}"
  echo -e "${YELLOW}📋 Backend logs:${NC}"
  $COMPOSE_CMD logs backend --tail 50
  exit 1
fi

# Final status
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}📊 Final Service Status:${NC}"
$COMPOSE_CMD ps

echo -e "${GREEN}🌐 Access URLs:${NC}"
echo -e "   Backend:  http://$(curl -s ifconfig.me):8000"
echo -e "   User Web: http://$(curl -s ifconfig.me):3000"
echo -e "   Admin Web: http://$(curl -s ifconfig.me):3001"

