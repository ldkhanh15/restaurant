#!/bin/bash
# ============================================
# AWS EC2 Setup Script for Restaurant System
# Run this once on a fresh EC2 instance
# Compatible with Amazon Linux 2023
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🔧 AWS EC2 Setup for Restaurant System${NC}"
echo -e "${GREEN}   (Amazon Linux 2023)${NC}"
echo -e "${GREEN}========================================${NC}"

# Detect OS
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS=$ID
else
  OS="unknown"
fi

echo -e "${YELLOW}📦 Detected OS: $OS${NC}"

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
if command -v dnf &> /dev/null; then
  sudo dnf update -y
elif command -v yum &> /dev/null; then
  sudo yum update -y
else
  echo -e "${YELLOW}⚠️  Package manager not found, skipping update${NC}"
fi

# Install Docker
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}🐳 Installing Docker...${NC}"
  if command -v dnf &> /dev/null; then
    sudo dnf install -y docker
  elif command -v yum &> /dev/null; then
    sudo yum install -y docker
  else
    # Fallback to Docker install script
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
  fi
  sudo systemctl start docker
  sudo systemctl enable docker
  sudo usermod -aG docker $USER
  echo -e "${GREEN}✅ Docker installed${NC}"
else
  echo -e "${GREEN}✅ Docker already installed${NC}"
  # Ensure Docker is running
  sudo systemctl start docker || true
  sudo systemctl enable docker || true
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
  if command -v dnf &> /dev/null; then
    sudo dnf install -y git
  elif command -v yum &> /dev/null; then
    sudo yum install -y git
  fi
  echo -e "${GREEN}✅ Git installed${NC}"
else
  echo -e "${GREEN}✅ Git already installed${NC}"
fi

# Install curl
if ! command -v curl &> /dev/null; then
  echo -e "${YELLOW}📥 Installing curl...${NC}"
  if command -v dnf &> /dev/null; then
    sudo dnf install -y curl
  elif command -v yum &> /dev/null; then
    sudo yum install -y curl
  fi
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
# Use ec2-user home for Amazon Linux, ubuntu for Ubuntu
if [ "$USER" = "ec2-user" ]; then
  DEPLOY_PATH="/home/ec2-user/restaurant"
else
  DEPLOY_PATH="/home/$USER/restaurant"
fi

if [ ! -d "$DEPLOY_PATH" ]; then
  echo -e "${YELLOW}📁 Creating deployment directory...${NC}"
  mkdir -p "$DEPLOY_PATH"
  sudo chown -R $USER:$USER "$DEPLOY_PATH"
  echo -e "${GREEN}✅ Deployment directory created: $DEPLOY_PATH${NC}"
else
  echo -e "${GREEN}✅ Deployment directory already exists: $DEPLOY_PATH${NC}"
fi

# Setup firewall (Amazon Linux uses firewalld or security groups)
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
if command -v firewall-cmd &> /dev/null; then
  # firewalld is available
  sudo systemctl start firewalld || true
  sudo systemctl enable firewalld || true
  sudo firewall-cmd --permanent --add-port=22/tcp   # SSH
  sudo firewall-cmd --permanent --add-port=80/tcp   # HTTP
  sudo firewall-cmd --permanent --add-port=443/tcp  # HTTPS
  sudo firewall-cmd --permanent --add-port=8000/tcp # Backend API
  sudo firewall-cmd --permanent --add-port=3000/tcp # User Web
  sudo firewall-cmd --permanent --add-port=3001/tcp # Admin Web
  sudo firewall-cmd --reload
  echo -e "${GREEN}✅ Firewall configured (firewalld)${NC}"
elif command -v ufw &> /dev/null; then
  # UFW is available (Ubuntu)
  sudo ufw allow 22/tcp   # SSH
  sudo ufw allow 80/tcp   # HTTP
  sudo ufw allow 443/tcp  # HTTPS
  sudo ufw allow 8000/tcp # Backend API
  sudo ufw allow 3000/tcp # User Web
  sudo ufw allow 3001/tcp # Admin Web
  sudo ufw --force enable
  echo -e "${GREEN}✅ Firewall configured (UFW)${NC}"
else
  echo -e "${YELLOW}⚠️  No firewall tool found. Please configure AWS Security Groups manually.${NC}"
  echo -e "${YELLOW}   Required ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 8000 (Backend), 3000 (User Web), 3001 (Admin Web)${NC}"
fi

# Install monitoring tools (optional)
echo -e "${YELLOW}📊 Installing monitoring tools...${NC}"
if command -v dnf &> /dev/null; then
  sudo dnf install -y htop || echo -e "${YELLOW}⚠️  htop not available${NC}"
elif command -v yum &> /dev/null; then
  sudo yum install -y htop || echo -e "${YELLOW}⚠️  htop not available${NC}"
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ EC2 Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "   1. Clone your repository (if not already):"
echo -e "      cd $DEPLOY_PATH"
echo -e "      git clone <your-repo-url> ."
echo -e ""
echo -e "   2. Configure environment variables:"
echo -e "      cd $DEPLOY_PATH"
echo -e "      cp env.example .env"
echo -e "      cp be_restaurant/env.example be_restaurant/.env"
echo -e "      nano .env"
echo -e "      nano be_restaurant/.env"
echo -e ""
echo -e "   3. Deploy:"
echo -e "      cd $DEPLOY_PATH"
echo -e "      ./scripts/deploy.sh"
echo -e ""
echo -e "${YELLOW}⚠️  Important Notes:${NC}"
echo -e "   - You may need to log out and log back in for Docker group changes to take effect"
echo -e "   - For Amazon Linux, ensure AWS Security Groups allow ports: 22, 80, 443, 8000, 3000, 3001"
echo -e "   - Deployment path: $DEPLOY_PATH"

