#!/bin/bash
# ============================================
# Restaurant Management System Production Startup Script
# ============================================
# Optimized for Amazon Linux 2023 on AWS EC2
# Uses docker-compose.prod.yml for production configuration
#
# Usage:
#   chmod +x start-restaurant-system-prod.sh
#   ./start-restaurant-system-prod.sh

set -e  # Exit on error

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="${SERVER_IP:-98.91.23.236}"
PROTOCOL="${PROTOCOL:-https}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

# Auto-detect Docker Compose command
COMPOSE_CMD="docker-compose"
if docker compose version &> /dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
fi

# Function to check container health status
wait_for_healthy() {
  local container_name=$1
  local service_name=$2
  local max_wait=${3:-180}
  local interval=${4:-10}
  
  echo -e "${YELLOW}Waiting for $service_name to become healthy (max $max_wait seconds)...${NC}"
  local waited=0
  local status="starting"
  
  while [ $waited -lt $max_wait ]; do
    sleep $interval
    waited=$((waited + interval))
    
    status=$(docker inspect "$container_name" --format='{{.State.Health.Status}}' 2>/dev/null || echo "starting")
    
    if [ "$status" = "healthy" ]; then
      echo -e "${GREEN}✓ $service_name is healthy!${NC}"
      return 0
    fi
    
    if [ "$status" = "unhealthy" ]; then
      echo -e "${RED}✗ $service_name is unhealthy!${NC}"
      echo -e "${YELLOW}  Check logs with: $COMPOSE_CMD -f $COMPOSE_FILE logs ${service_name,,}${NC}"
      return 1
    fi
    
    echo -e "${GRAY}  Waiting... ($waited/$max_wait seconds) - Status: $status${NC}"
  done
  
  echo -e "${RED}✗ $service_name failed to become healthy after $max_wait seconds${NC}"
  return 1
}

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Starting Restaurant Management System${NC}"
echo -e "${CYAN}   (Production Mode - Amazon Linux 2023)${NC}"
echo -e "${CYAN}========================================${NC}\n"

# Step 1: Stop any existing containers
echo -e "${YELLOW}[1/5] Stopping existing containers...${NC}"
$COMPOSE_CMD -f $COMPOSE_FILE down > /dev/null 2>&1 || true

# Step 2: Start MySQL first
echo -e "${YELLOW}[2/5] Starting MySQL database...${NC}"
$COMPOSE_CMD -f $COMPOSE_FILE up -d mysql

if ! wait_for_healthy "restaurant_mysql" "MySQL" 120; then
  echo -e "${RED}❌ MySQL failed to start. Showing logs:${NC}"
  $COMPOSE_CMD -f $COMPOSE_FILE logs mysql --tail 30
  exit 1
fi

# Step 3: Start Chatbot
echo -e "${YELLOW}[3/5] Starting Chatbot service...${NC}"
$COMPOSE_CMD -f $COMPOSE_FILE up -d chatbot

if ! wait_for_healthy "restaurant_chatbot" "Chatbot" 120; then
  echo -e "${YELLOW}⚠️  Chatbot health check failed, but continuing...${NC}"
  $COMPOSE_CMD -f $COMPOSE_FILE logs chatbot --tail 20
fi

# Step 4: Start Backend
echo -e "${YELLOW}[4/5] Starting Backend API (database sync may take 2-3 minutes)...${NC}"
$COMPOSE_CMD -f $COMPOSE_FILE up -d backend

if ! wait_for_healthy "restaurant_backend" "Backend" 240; then
  echo -e "${RED}❌ Backend failed to start. Showing logs:${NC}"
  $COMPOSE_CMD -f $COMPOSE_FILE logs backend --tail 50
  exit 1
fi

# Step 5: Start Frontend services
echo -e "${YELLOW}[5/5] Starting Frontend services (Admin Web, User Web)...${NC}"
$COMPOSE_CMD -f $COMPOSE_FILE up -d admin-web user-web

# Wait for frontend services to initialize
echo -e "${YELLOW}Waiting for frontend services to initialize (60 seconds)...${NC}"
sleep 60

# Check frontend health
admin_status=$(docker inspect restaurant_admin_web --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
user_status=$(docker inspect restaurant_user_web --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")

if [ "$admin_status" = "healthy" ]; then
  echo -e "${GREEN}✓ Admin Web is healthy!${NC}"
else
  echo -e "${YELLOW}⚠️  Admin Web status: $admin_status${NC}"
fi

if [ "$user_status" = "healthy" ]; then
  echo -e "${GREEN}✓ User Web is healthy!${NC}"
else
  echo -e "${YELLOW}⚠️  User Web status: $user_status${NC}"
fi

# Display final status
echo -e "\n${CYAN}========================================${NC}"
echo -e "${CYAN}System Status${NC}"
echo -e "${CYAN}========================================${NC}\n"

$COMPOSE_CMD -f $COMPOSE_FILE ps

# Display access URLs
echo -e "\n${CYAN}========================================${NC}"
echo -e "${CYAN}Access URLs${NC}"
echo -e "${CYAN}========================================${NC}"
echo -e "${YELLOW}⚠️  Local Access (from EC2):${NC}"
echo -e "${GREEN}   Backend API:  http://localhost:8000${NC}"
echo -e "${GREEN}   User Web:     http://localhost:3000${NC}"
echo -e "${GREEN}   Admin Web:    http://localhost:3001${NC}"
echo -e "\n${YELLOW}🌐 Public Access (from Internet):${NC}"
echo -e "${GREEN}   Backend API:  $PROTOCOL://$SERVER_IP:8000${NC}"
echo -e "${GREEN}   User Web:     $PROTOCOL://$SERVER_IP:3000${NC}"
echo -e "${GREEN}   Admin Web:    $PROTOCOL://$SERVER_IP:3001${NC}"
echo -e "\n${GRAY}Health Check: $PROTOCOL://$SERVER_IP:8000/health${NC}"

# Check if running on EC2
PUBLIC_IP=$(curl -s --max-time 2 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "")
if [ -n "$PUBLIC_IP" ]; then
  echo -e "\n${GRAY}EC2 Public IP detected: $PUBLIC_IP${NC}"
  if [ "$PUBLIC_IP" != "$SERVER_IP" ]; then
    echo -e "${YELLOW}⚠️  Note: Configured IP ($SERVER_IP) differs from EC2 IP ($PUBLIC_IP)${NC}"
    echo -e "${YELLOW}   Update SERVER_IP environment variable if needed${NC}"
  fi
fi

echo -e "\n${CYAN}========================================${NC}"
echo -e "${GREEN}System Started Successfully! 🚀${NC}"
echo -e "${CYAN}========================================${NC}\n"

