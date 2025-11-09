#!/bin/bash
# ============================================
# Fix MySQL Volume Script (Production)
# ============================================
# This script removes the corrupted MySQL volume and recreates it
# WARNING: This will delete all MySQL data!
# Optimized for Amazon Linux 2023

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

# Auto-detect Docker Compose command
COMPOSE_CMD="docker-compose"
if docker compose version &> /dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
fi

echo -e "${YELLOW}========================================${NC}"
echo -e "${RED}⚠️  WARNING: This will DELETE all MySQL data!${NC}"
echo -e "${YELLOW}========================================${NC}\n"

read -p "Are you sure you want to continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo -e "${YELLOW}Aborted.${NC}"
  exit 0
fi

echo -e "\n${YELLOW}[1/4] Stopping all containers...${NC}"
$COMPOSE_CMD -f $COMPOSE_FILE down 2>&1 | grep -v "No such" || true

echo -e "${YELLOW}[2/4] Removing MySQL container...${NC}"
docker rm -f restaurant_mysql 2>&1 | grep -v "No such" || true

echo -e "${YELLOW}[3/4] Removing MySQL volume...${NC}"
if docker volume rm -f restaurant_mysql_data 2>&1; then
  echo -e "${GREEN}✓ Volume removed successfully${NC}"
else
  echo -e "${YELLOW}⚠️  Volume removal returned error (may not exist or still in use)${NC}"
  echo -e "${YELLOW}   Trying to prune unused volumes...${NC}"
  docker volume prune -f > /dev/null 2>&1 || true
fi

# Wait a moment for cleanup
sleep 2

echo -e "${YELLOW}[4/4] Starting MySQL with fresh volume...${NC}"
$COMPOSE_CMD -f $COMPOSE_FILE up -d mysql

echo -e "\n${GREEN}✅ MySQL container started!${NC}"
echo -e "${YELLOW}Waiting for MySQL to initialize (90 seconds)...${NC}"
sleep 90

echo -e "\n${YELLOW}Checking MySQL status...${NC}"
$COMPOSE_CMD -f $COMPOSE_FILE ps mysql

echo -e "\n${YELLOW}Checking MySQL logs (last 20 lines)...${NC}"
$COMPOSE_CMD -f $COMPOSE_FILE logs mysql --tail 20

health_status=$(docker inspect restaurant_mysql --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
if [ "$health_status" = "healthy" ]; then
  echo -e "\n${GREEN}✅ MySQL is healthy! You can now run: ./start-restaurant-system-prod.sh${NC}"
else
  echo -e "\n${YELLOW}⚠️  MySQL status: $health_status${NC}"
  echo -e "${YELLOW}   Check logs with: $COMPOSE_CMD -f $COMPOSE_FILE logs mysql${NC}"
  echo -e "${YELLOW}   If still unhealthy, the volume may need manual cleanup.${NC}"
fi

