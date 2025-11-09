#!/bin/bash
# ============================================
# AWS EC2 Setup Script for Restaurant System
# Run this once on a fresh EC2 instance
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🔧 AWS EC2 Setup for Restaurant System${NC}"
echo -e "${GREEN}========================================${NC}"

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}🐳 Installing Docker...${NC}"
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo usermod -aG docker $USER
  rm get-docker.sh
  echo -e "${GREEN}✅ Docker installed${NC}"
else
  echo -e "${GREEN}✅ Docker already installed${NC}"
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
  echo -e "${YELLOW}🐳 Installing Docker Compose...${NC}"
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  echo -e "${GREEN}✅ Docker Compose installed${NC}"
else
  echo -e "${GREEN}✅ Docker Compose already installed${NC}"
fi

# Install Git
if ! command -v git &> /dev/null; then
  echo -e "${YELLOW}📥 Installing Git...${NC}"
  sudo apt-get install -y git
  echo -e "${GREEN}✅ Git installed${NC}"
else
  echo -e "${GREEN}✅ Git already installed${NC}"
fi

# Install curl
if ! command -v curl &> /dev/null; then
  echo -e "${YELLOW}📥 Installing curl...${NC}"
  sudo apt-get install -y curl
  echo -e "${GREEN}✅ curl installed${NC}"
else
  echo -e "${GREEN}✅ curl already installed${NC}"
fi

# Setup swap file for t3.micro (1GB RAM is limited)
if [ ! -f /swapfile ]; then
  echo -e "${YELLOW}💾 Creating swap file (2GB)...${NC}"
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  echo -e "${GREEN}✅ Swap file created${NC}"
else
  echo -e "${GREEN}✅ Swap file already exists${NC}"
fi

# Create deployment directory
DEPLOY_PATH="/home/ubuntu/restaurant"
if [ ! -d "$DEPLOY_PATH" ]; then
  echo -e "${YELLOW}📁 Creating deployment directory...${NC}"
  mkdir -p "$DEPLOY_PATH"
  sudo chown -R $USER:$USER "$DEPLOY_PATH"
  echo -e "${GREEN}✅ Deployment directory created${NC}"
else
  echo -e "${GREEN}✅ Deployment directory already exists${NC}"
fi

# Setup firewall (UFW)
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 8000/tcp # Backend API
sudo ufw allow 3000/tcp # User Web
sudo ufw allow 3001/tcp # Admin Web
sudo ufw --force enable
echo -e "${GREEN}✅ Firewall configured${NC}"

# Install monitoring tools (optional)
echo -e "${YELLOW}📊 Installing monitoring tools...${NC}"
sudo apt-get install -y htop iotop

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ EC2 Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "   1. Clone your repository:"
echo -e "      cd $DEPLOY_PATH"
echo -e "      git clone <your-repo-url> ."
echo -e ""
echo -e "   2. Configure environment variables:"
echo -e "      cp env.example .env"
echo -e "      cp be_restaurant/env.example be_restaurant/.env"
echo -e "      nano .env"
echo -e "      nano be_restaurant/.env"
echo -e ""
echo -e "   3. Deploy:"
echo -e "      ./scripts/deploy.sh"
echo -e ""
echo -e "${YELLOW}⚠️  Note: You may need to log out and log back in for Docker group changes to take effect${NC}"

