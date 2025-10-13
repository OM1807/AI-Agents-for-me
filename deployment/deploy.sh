#!/bin/bash

# DevOrbit AI - Fly.io Deployment Script
# This script deploys all services to Fly.io

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

print_status "Starting DevOrbit AI deployment to Fly.io..."

# Deploy PostgreSQL database
print_status "Deploying PostgreSQL database..."
cd apps/api
if flyctl apps list | grep -q "devorbit-ai-db"; then
    print_warning "Database app already exists. Updating..."
    flyctl deploy --config fly.postgres.toml
else
    print_status "Creating new database app..."
    flyctl launch --config fly.postgres.toml --no-deploy
    flyctl deploy --config fly.postgres.toml
fi
cd ../..

# Get database connection details
print_status "Getting database connection details..."
DB_HOST=$(flyctl status --app devorbit-ai-db --json | jq -r '.Hostname')
DB_PASSWORD=$(flyctl secrets list --app devorbit-ai-db | grep POSTGRES_PASSWORD | cut -d' ' -f2 || echo "postgres")

# Set database password if not set
if [ -z "$DB_PASSWORD" ] || [ "$DB_PASSWORD" = "postgres" ]; then
    print_status "Setting database password..."
    DB_PASSWORD=$(openssl rand -base64 32)
    flyctl secrets set POSTGRES_PASSWORD="$DB_PASSWORD" --app devorbit-ai-db
fi

DATABASE_URL="postgresql+asyncpg://postgres:${DB_PASSWORD}@${DB_HOST}:5432/devorbit_ai"

# Deploy API
print_status "Deploying API service..."
cd apps/api
if flyctl apps list | grep -q "devorbit-ai-api"; then
    print_warning "API app already exists. Updating..."
    flyctl deploy --config fly-api.toml
else
    print_status "Creating new API app..."
    flyctl launch --config fly-api.toml --no-deploy
    flyctl deploy --config fly-api.toml
fi
cd ../..

# Set API secrets
print_status "Setting API environment variables..."
flyctl secrets set DATABASE_URL="$DATABASE_URL" --app devorbit-ai-api

# Get API URL
API_URL=$(flyctl status --app devorbit-ai-api --json | jq -r '.Hostname')
if [ "$API_URL" != "null" ] && [ -n "$API_URL" ]; then
    API_URL="https://${API_URL}"
else
    API_URL=$(flyctl info --app devorbit-ai-api --json | jq -r '.Hostname')
    API_URL="https://${API_URL}"
fi

# Deploy Web
print_status "Deploying Web service..."
cd apps/web
if flyctl apps list | grep -q "devorbit-ai-web"; then
    print_warning "Web app already exists. Updating..."
    flyctl deploy --config fly-web.toml
else
    print_status "Creating new Web app..."
    flyctl launch --config fly-web.toml --no-deploy
    flyctl deploy --config fly-web.toml
fi
cd ../..

# Set Web environment variables
print_status "Setting Web environment variables..."
flyctl secrets set NEXT_PUBLIC_API_URL="${API_URL}/api/v1" --app devorbit-ai-web

# Get Web URL
WEB_URL=$(flyctl status --app devorbit-ai-web --json | jq -r '.Hostname')
if [ "$WEB_URL" != "null" ] && [ -n "$WEB_URL" ]; then
    WEB_URL="https://${WEB_URL}"
else
    WEB_URL=$(flyctl info --app devorbit-ai-web --json | jq -r '.Hostname')
    WEB_URL="https://${WEB_URL}"
fi

print_status "Deployment completed successfully!"
echo ""
echo "🌐 Web Application: $WEB_URL"
echo "🔧 API Endpoint: $API_URL"
echo "📊 Database: devorbit-ai-db"
echo ""
print_warning "Don't forget to set the following secrets:"
echo "  flyctl secrets set SECRET_KEY='your-secret-key' --app devorbit-ai-api"
echo "  flyctl secrets set ANTHROPIC_API_KEY='your-anthropic-key' --app devorbit-ai-api"
echo "  flyctl secrets set NEXT_PUBLIC_NOTION_CLIENT_ID='your-notion-client-id' --app devorbit-ai-web"
echo "  flyctl secrets set NEXT_PUBLIC_GITHUB_CLIENT_ID='your-github-client-id' --app devorbit-ai-web"
echo "  # ... and other OAuth credentials as needed"
echo ""
print_status "Run 'flyctl logs --app devorbit-ai-api' to check API logs"
print_status "Run 'flyctl logs --app devorbit-ai-web' to check Web logs"
