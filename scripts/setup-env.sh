#!/bin/bash

# Simple script to copy env.template files to .env files
# Usage: ./scripts/setup-env.sh

set -e

echo "🚀 Setting up environment files from templates..."
echo ""

# Function to copy template if .env doesn't exist
copy_template() {
  local template=$1
  local output=$2
  local service=$3
  
  if [ ! -f "$output" ]; then
    if [ -f "$template" ]; then
      cp "$template" "$output"
      echo "✅ Created $output from $template"
    else
      echo "⚠️  Template not found: $template"
    fi
  else
    echo "⏭️  $output already exists, skipping..."
  fi
}

# Backend
copy_template "be_restaurant/env.template" "be_restaurant/.env" "Backend"

# Admin Web
copy_template "admin-web/env.template" "admin-web/.env.local" "Admin Web"

# User Web
copy_template "user-web/env.template" "user-web/.env.local" "User Web"

# Chatbot
copy_template "chatbot/env.template" "chatbot/.env" "Chatbot"

# Root (Docker Compose)
copy_template "env.template" ".env" "Root"

echo ""
echo "✨ Environment files setup complete!"
echo ""
echo "⚠️  Remember to:"
echo "   1. Update the .env files with your actual values"
echo "   2. Never commit .env files to git"
echo "   3. Use .env.template files as reference"

