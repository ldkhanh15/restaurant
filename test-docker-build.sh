#!/bin/bash

# ============================================
# Docker Build Test Script
# ============================================
# This script tests Docker builds for all services
# Usage: ./test-docker-build.sh [service_name]
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to build a service
build_service() {
    local service=$1
    print_info "Building $service..."
    
    if docker-compose build --progress=plain "$service" 2>&1 | tee "${service}-build.log"; then
        print_success "$service built successfully"
        
        # Check for standalone directory in Next.js apps
        if [[ "$service" == "admin-web" ]] || [[ "$service" == "user-web" ]]; then
            print_info "Checking for standalone output in $service..."
            if docker-compose run --rm "$service" sh -c "ls -la .next/ 2>/dev/null" | grep -q standalone; then
                print_success "$service: standalone directory found"
            else
                print_warning "$service: standalone directory check skipped (service may not be running)"
            fi
        fi
        
        return 0
    else
        print_error "$service build failed! Check ${service}-build.log for details"
        print_info "Last 30 lines of build log:"
        tail -30 "${service}-build.log"
        return 1
    fi
}

# Function to test all services
test_all() {
    print_info "Starting Docker build test for all services..."
    echo ""
    
    local failed=0
    
    # Test chatbot
    print_info "======================================"
    print_info "Testing chatbot (Python FastAPI)"
    print_info "======================================"
    if build_service "chatbot"; then
        echo ""
    else
        failed=$((failed + 1))
        echo ""
    fi
    
    # Test backend
    print_info "======================================"
    print_info "Testing backend (be_restaurant)"
    print_info "======================================"
    if build_service "backend"; then
        echo ""
    else
        failed=$((failed + 1))
        echo ""
    fi
    
    # Test admin-web
    print_info "======================================"
    print_info "Testing admin-web"
    print_info "======================================"
    if build_service "admin-web"; then
        echo ""
    else
        failed=$((failed + 1))
        echo ""
    fi
    
    # Test user-web
    print_info "======================================"
    print_info "Testing user-web"
    print_info "======================================"
    if build_service "user-web"; then
        echo ""
    else
        failed=$((failed + 1))
        echo ""
    fi
    
    # Summary
    print_info "======================================"
    print_info "Build Test Summary"
    print_info "======================================"
    
    if [ $failed -eq 0 ]; then
        print_success "All services built successfully! ✨"
        print_info "Next steps:"
        echo "  1. Start services: docker-compose up -d"
        echo "  2. Check status: docker-compose ps"
        echo "  3. View logs: docker-compose logs -f"
        return 0
    else
        print_error "$failed service(s) failed to build"
        print_info "Check the *-build.log files for details"
        return 1
    fi
}

# Main script
main() {
    # Check if docker-compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_error "docker-compose is not installed!"
        exit 1
    fi
    
    # Check if docker-compose.yml exists
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found in current directory!"
        exit 1
    fi
    
    # If service name is provided, build only that service
    if [ $# -eq 1 ]; then
        local service=$1
        
        # Validate service name
        if ! docker-compose config --services | grep -q "^${service}$"; then
            print_error "Service '$service' not found in docker-compose.yml"
            print_info "Available services:"
            docker-compose config --services
            exit 1
        fi
        
        print_info "======================================"
        print_info "Testing $service"
        print_info "======================================"
        
        if build_service "$service"; then
            print_success "Build test completed successfully!"
            exit 0
        else
            print_error "Build test failed!"
            exit 1
        fi
    else
        # Test all services
        if test_all; then
            exit 0
        else
            exit 1
        fi
    fi
}

# Run main function
main "$@"

