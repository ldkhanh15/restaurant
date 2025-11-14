#!/bin/bash
# ============================================
# Azure VM Setup Script for Restaurant System
# Run this once on a fresh Azure VM
# Compatible with Ubuntu Server (recommended for Azure Student)
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🔧 Azure VM Setup for Restaurant System${NC}"
echo -e "${GREEN}   (Ubuntu Server recommended)${NC}"
echo -e "${GREEN}========================================${NC}"

# Detect OS
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS=$ID
  OS_VERSION=$VERSION_ID
else
  OS="unknown"
fi

echo -e "${YELLOW}📦 Detected OS: $OS $OS_VERSION${NC}"

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
  echo -e "${RED}❌ Please do not run as root. Use sudo when needed.${NC}"
  exit 1
fi

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
if command -v apt-get &> /dev/null; then
  sudo apt-get update -y
  sudo apt-get upgrade -y
elif command -v dnf &> /dev/null; then
  sudo dnf update -y
elif command -v yum &> /dev/null; then
  sudo yum update -y
else
  echo -e "${YELLOW}⚠️  Package manager not found, skipping update${NC}"
fi

# Install Docker
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}🐳 Installing Docker...${NC}"
  if command -v apt-get &> /dev/null; then
    # Ubuntu/Debian
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  elif command -v dnf &> /dev/null; then
    # RHEL/CentOS/Fedora
    sudo dnf install -y docker
  elif command -v yum &> /dev/null; then
    # Older RHEL/CentOS
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
  echo -e "${YELLOW}⚠️  You may need to log out and log back in for Docker group changes to take effect${NC}"
else
  echo -e "${GREEN}✅ Docker already installed${NC}"
  # Ensure Docker is running
  sudo systemctl start docker || true
  sudo systemctl enable docker || true
fi

# Install Docker Compose (if not using plugin)
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
  echo -e "${YELLOW}🐳 Installing Docker Compose...${NC}"
  if command -v apt-get &> /dev/null; then
    # Docker Compose plugin should be installed with docker-ce
    # If not, install standalone
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
  else
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
  fi
  echo -e "${GREEN}✅ Docker Compose installed${NC}"
else
  echo -e "${GREEN}✅ Docker Compose already installed${NC}"
fi

# Install Git
if ! command -v git &> /dev/null; then
  echo -e "${YELLOW}📥 Installing Git...${NC}"
  if command -v apt-get &> /dev/null; then
    sudo apt-get install -y git
  elif command -v dnf &> /dev/null; then
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
  if command -v apt-get &> /dev/null; then
    sudo apt-get install -y curl
  elif command -v dnf &> /dev/null; then
    sudo dnf install -y curl
  elif command -v yum &> /dev/null; then
    sudo yum install -y curl
  fi
  echo -e "${GREEN}✅ curl installed${NC}"
else
  echo -e "${GREEN}✅ curl already installed${NC}"
fi

# Setup swap file for Azure B1/B2ATS (limited RAM)
if [ ! -f /swapfile ]; then
  echo -e "${YELLOW}💾 Creating swap file (2GB)...${NC}"
  sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  echo -e "${GREEN}✅ Swap file created${NC}"
else
  echo -e "${GREEN}✅ Swap file already exists${NC}"
fi

# Create deployment directory
# Azure VMs typically use azureuser or the username you specified
if [ "$USER" = "azureuser" ]; then
  DEPLOY_PATH="/home/azureuser/restaurant"
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

# Setup firewall (Azure uses Network Security Groups, but also configure local firewall)
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
if command -v ufw &> /dev/null; then
  # UFW (Ubuntu)
  sudo ufw allow 22/tcp   # SSH
  sudo ufw allow 80/tcp   # HTTP
  sudo ufw allow 443/tcp  # HTTPS
  sudo ufw allow 8000/tcp # Backend API
  sudo ufw allow 3000/tcp # User Web
  sudo ufw allow 3001/tcp # Admin Web
  sudo ufw --force enable
  echo -e "${GREEN}✅ Firewall configured (UFW)${NC}"
elif command -v firewall-cmd &> /dev/null; then
  # firewalld (RHEL/CentOS)
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
else
  echo -e "${YELLOW}⚠️  No firewall tool found. Please configure Azure NSG manually.${NC}"
  echo -e "${YELLOW}   Required ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 8000 (Backend), 3000 (User Web), 3001 (Admin Web)${NC}"
fi

# Install monitoring tools (optional)
echo -e "${YELLOW}📊 Installing monitoring tools...${NC}"
if command -v apt-get &> /dev/null; then
  sudo apt-get install -y htop || echo -e "${YELLOW}⚠️  htop not available${NC}"
elif command -v dnf &> /dev/null; then
  sudo dnf install -y htop || echo -e "${YELLOW}⚠️  htop not available${NC}"
elif command -v yum &> /dev/null; then
  sudo yum install -y htop || echo -e "${YELLOW}⚠️  htop not available${NC}"
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Azure VM Setup Complete!${NC}"
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
echo -e "      COMPOSE_FILE=docker-compose.prod.yml ./scripts/deploy.sh"
echo -e ""
echo -e "${YELLOW}⚠️  Important Notes:${NC}"
echo -e "   - You may need to log out and log back in for Docker group changes to take effect"
echo -e "   - Configure Azure Network Security Group (NSG) to allow ports: 22, 80, 443, 8000, 3000, 3001"
echo -e "   - Deployment path: $DEPLOY_PATH"
echo -e "   - For Azure Student free tier, use Standard_B1s, Standard_B2ats, or Standard_B2pts VM sizes"

