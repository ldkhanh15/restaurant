#!/bin/bash
# ============================================
# Restaurant Management System Startup Script
# ============================================
# Optimized for Linux/Amazon Linux
# This script starts all services in the correct order with proper timing
#
# Usage:
#   chmod +x start-restaurant-system.sh
#   ./start-restaurant-system.sh

set -e  # Exit on error

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Auto-detect Docker Compose command
COMPOSE_CMD="docker-compose"
if docker compose version &> /dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
fi

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Starting Restaurant Management System${NC}"
echo -e "${CYAN}========================================${NC}\n"

# Step 1: Stop any existing containers
echo -e "${YELLOW}[1/4] Stopping existing containers...${NC}"
$COMPOSE_CMD down > /dev/null 2>&1 || true

# Step 2: Start infrastructure services (MySQL, Chatbot, Backend)
echo -e "${YELLOW}[2/4] Starting infrastructure services (MySQL, Chatbot, Backend)...${NC}"
$COMPOSE_CMD up -d mysql chatbot backend

# Step 3: Wait for backend to become healthy (database sync takes ~2 minutes)
echo -e "${YELLOW}[3/4] Waiting for backend to complete database sync (this may take 2-3 minutes)...${NC}"
MAX_WAIT=180  # 3 minutes
WAITED=0
INTERVAL=10
STATUS="starting"

while [ $WAITED -lt $MAX_WAIT ]; do
  sleep $INTERVAL
  WAITED=$((WAITED + INTERVAL))
  
  # Check health status using docker inspect
  STATUS=$(docker inspect restaurant_backend --format='{{.State.Health.Status}}' 2>/dev/null || echo "starting")
  
  if [ "$STATUS" = "healthy" ]; then
    echo -e "${GREEN}✓ Backend is healthy!${NC}"
    break
  fi
  
  echo -e "${GRAY}  Waiting... ($WAITED/$MAX_WAIT seconds)${NC}"
done

if [ "$STATUS" != "healthy" ]; then
  echo -e "${RED}✗ Backend failed to become healthy after $MAX_WAIT seconds${NC}"
  echo -e "${YELLOW}  Check logs with: $COMPOSE_CMD logs backend${NC}"
  exit 1
fi

# Step 4: Start frontend services
echo -e "${YELLOW}[4/4] Starting frontend services (Admin Web, User Web)...${NC}"
$COMPOSE_CMD up -d admin-web user-web

# Wait for frontend health checks
echo -e "${YELLOW}Waiting for frontend services to become healthy (60 seconds)...${NC}"
sleep 60

# Display final status
echo -e "\n${CYAN}========================================${NC}"
echo -e "${CYAN}System Status${NC}"
echo -e "${CYAN}========================================${NC}\n"

$COMPOSE_CMD ps

# Get public IP if on EC2, otherwise use localhost
PUBLIC_IP=$(curl -s --max-time 2 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "")
if [ -n "$PUBLIC_IP" ]; then
  # On EC2 - show both local and public URLs
  echo -e "\n${CYAN}========================================${NC}"
  echo -e "${CYAN}Access URLs${NC}"
  echo -e "${CYAN}========================================${NC}"
  echo -e "${YELLOW}⚠️  Local Access (from EC2):${NC}"
  echo -e "${GREEN}   Backend API:  http://localhost:8000${NC}"
  echo -e "${GREEN}   User Web:     http://localhost:3000${NC}"
  echo -e "${GREEN}   Admin Web:    http://localhost:3001${NC}"
  echo -e "\n${YELLOW}🌐 Public Access (from Internet):${NC}"
  echo -e "${GREEN}   Backend API:  http://$PUBLIC_IP:8000${NC}"
  echo -e "${GREEN}   User Web:     http://$PUBLIC_IP:3000${NC}"
  echo -e "${GREEN}   Admin Web:    http://$PUBLIC_IP:3001${NC}"
else
  # Local machine - show localhost URLs
  echo -e "\n${CYAN}========================================${NC}"
  echo -e "${CYAN}Access URLs${NC}"
  echo -e "${CYAN}========================================${NC}"
  echo -e "${GREEN}Backend API:  http://localhost:8000${NC}"
  echo -e "${GREEN}User Web:     http://localhost:3000${NC}"
  echo -e "${GREEN}Admin Web:    http://localhost:3001${NC}"
fi

echo -e "\n${GRAY}Health Check: http://localhost:8000/health${NC}"
echo -e "\n${CYAN}========================================${NC}"
echo -e "${GREEN}System Started Successfully! 🚀${NC}"
echo -e "${CYAN}========================================${NC}\n"

