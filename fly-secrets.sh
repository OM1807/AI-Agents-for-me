#!/bin/bash

# SDLC Agents - Fly.io Secrets Configuration Script
# This script helps configure all required secrets for Fly.io deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[SETUP]${NC} $1"
}

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    print_error "flyctl is not installed. Please install it first:"
    echo "curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if user is logged in
if ! flyctl auth whoami &> /dev/null; then
    print_error "You are not logged in to Fly.io. Please run: flyctl auth login"
    exit 1
fi

print_header "SDLC Agents - Fly.io Secrets Configuration"
echo ""

# API Secrets
print_header "Configuring API Secrets (sdlc-agents-api)"
echo ""

# Required secrets for API
print_status "Setting up required API secrets..."

# SECRET_KEY
if [ -z "$SECRET_KEY" ]; then
    print_warning "SECRET_KEY not set. Generating a random secret key..."
    SECRET_KEY=$(openssl rand -base64 32)
    print_status "Generated SECRET_KEY: ${SECRET_KEY:0:10}..."
else
    print_status "Using provided SECRET_KEY"
fi

flyctl secrets set SECRET_KEY="$SECRET_KEY" --app sdlc-agents-api

# ANTHROPIC_API_KEY
if [ -z "$ANTHROPIC_API_KEY" ]; then
    print_warning "ANTHROPIC_API_KEY not set. Please set it manually:"
    echo "flyctl secrets set ANTHROPIC_API_KEY='your-anthropic-key' --app sdlc-agents-api"
else
    flyctl secrets set ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" --app sdlc-agents-api
    print_status "Set ANTHROPIC_API_KEY"
fi

# DATABASE_URL (will be set by deployment script)
print_status "DATABASE_URL will be set automatically by the deployment script"

# Optional secrets
print_status "Setting up optional API secrets..."

# CORS origins
if [ -n "$BACKEND_CORS_ORIGINS" ]; then
    flyctl secrets set BACKEND_CORS_ORIGINS="$BACKEND_CORS_ORIGINS" --app sdlc-agents-api
    print_status "Set BACKEND_CORS_ORIGINS"
fi

echo ""
print_header "Configuring Web Secrets (sdlc-agents-web)"
echo ""

# Get API URL
API_URL=$(flyctl status --app sdlc-agents-api --json 2>/dev/null | jq -r '.Hostname' 2>/dev/null || echo "")
if [ -n "$API_URL" ] && [ "$API_URL" != "null" ]; then
    API_URL="https://${API_URL}"
else
    print_warning "Could not determine API URL. Please set NEXT_PUBLIC_API_URL manually:"
    echo "flyctl secrets set NEXT_PUBLIC_API_URL='https://your-api.fly.dev/api/v1' --app sdlc-agents-web"
fi

# NEXT_PUBLIC_API_URL
if [ -n "$API_URL" ]; then
    flyctl secrets set NEXT_PUBLIC_API_URL="${API_URL}/api/v1" --app sdlc-agents-web
    print_status "Set NEXT_PUBLIC_API_URL to ${API_URL}/api/v1"
fi

# OAuth secrets
print_status "Setting up OAuth secrets..."

# Notion
if [ -n "$NEXT_PUBLIC_NOTION_CLIENT_ID" ]; then
    flyctl secrets set NEXT_PUBLIC_NOTION_CLIENT_ID="$NEXT_PUBLIC_NOTION_CLIENT_ID" --app sdlc-agents-web
    print_status "Set NEXT_PUBLIC_NOTION_CLIENT_ID"
fi

if [ -n "$NEXT_PUBLIC_NOTION_CLIENT_SECRET" ]; then
    flyctl secrets set NEXT_PUBLIC_NOTION_CLIENT_SECRET="$NEXT_PUBLIC_NOTION_CLIENT_SECRET" --app sdlc-agents-web
    print_status "Set NEXT_PUBLIC_NOTION_CLIENT_SECRET"
fi

# GitHub
if [ -n "$NEXT_PUBLIC_GITHUB_CLIENT_ID" ]; then
    flyctl secrets set NEXT_PUBLIC_GITHUB_CLIENT_ID="$NEXT_PUBLIC_GITHUB_CLIENT_ID" --app sdlc-agents-web
    print_status "Set NEXT_PUBLIC_GITHUB_CLIENT_ID"
fi

if [ -n "$NEXT_PUBLIC_GITHUB_CLIENT_SECRET" ]; then
    flyctl secrets set NEXT_PUBLIC_GITHUB_CLIENT_SECRET="$NEXT_PUBLIC_GITHUB_CLIENT_SECRET" --app sdlc-agents-web
    print_status "Set NEXT_PUBLIC_GITHUB_CLIENT_SECRET"
fi

# Atlassian
if [ -n "$NEXT_PUBLIC_ATLASSIAN_CLIENT_ID" ]; then
    flyctl secrets set NEXT_PUBLIC_ATLASSIAN_CLIENT_ID="$NEXT_PUBLIC_ATLASSIAN_CLIENT_ID" --app sdlc-agents-web
    print_status "Set NEXT_PUBLIC_ATLASSIAN_CLIENT_ID"
fi

if [ -n "$NEXT_PUBLIC_ATLASSIAN_CLIENT_SECRET" ]; then
    flyctl secrets set NEXT_PUBLIC_ATLASSIAN_CLIENT_SECRET="$NEXT_PUBLIC_ATLASSIAN_CLIENT_SECRET" --app sdlc-agents-web
    print_status "Set NEXT_PUBLIC_ATLASSIAN_CLIENT_SECRET"
fi

echo ""
print_status "Secrets configuration completed!"
echo ""
print_warning "Manual configuration required:"
echo ""
echo "1. Set your Anthropic API key:"
echo "   flyctl secrets set ANTHROPIC_API_KEY='your-anthropic-key' --app sdlc-agents-api"
echo ""
echo "2. Set OAuth credentials for integrations:"
echo "   flyctl secrets set NEXT_PUBLIC_NOTION_CLIENT_ID='your-notion-client-id' --app sdlc-agents-web"
echo "   flyctl secrets set NEXT_PUBLIC_GITHUB_CLIENT_ID='your-github-client-id' --app sdlc-agents-web"
echo "   flyctl secrets set NEXT_PUBLIC_ATLASSIAN_CLIENT_ID='your-atlassian-client-id' --app sdlc-agents-web"
echo ""
echo "3. Set corresponding client secrets:"
echo "   flyctl secrets set NEXT_PUBLIC_NOTION_CLIENT_SECRET='your-notion-secret' --app sdlc-agents-web"
echo "   flyctl secrets set NEXT_PUBLIC_GITHUB_CLIENT_SECRET='your-github-secret' --app sdlc-agents-web"
echo "   flyctl secrets set NEXT_PUBLIC_ATLASSIAN_CLIENT_SECRET='your-atlassian-secret' --app sdlc-agents-web"
echo ""
print_status "Run 'flyctl secrets list --app sdlc-agents-api' to view API secrets"
print_status "Run 'flyctl secrets list --app sdlc-agents-web' to view Web secrets"
