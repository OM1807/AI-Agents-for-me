# SDLC Agents - Deployment Guide

## Table of Contents
1. [Deployment Overview](#deployment-overview)
2. [Prerequisites](#prerequisites)
3. [Environment Configuration](#environment-configuration)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Database Setup](#database-setup)
7. [Monitoring & Logging](#monitoring--logging)
8. [Security Checklist](#security-checklist)
9. [Troubleshooting](#troubleshooting)

---

## Deployment Overview

The SDLC Agents platform consists of three main components that need to be deployed:

1. **FastAPI Backend** - Python API server
2. **Next.js Frontend** - React web application
3. **PostgreSQL Database** - Data persistence

### Recommended Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│  Production Environment                         │
│                                                 │
│  ┌──────────────┐         ┌──────────────┐    │
│  │  Next.js App │◄────────┤  CDN/Edge    │    │
│  │  (Vercel)    │         │  (Vercel)    │    │
│  └──────┬───────┘         └──────────────┘    │
│         │                                       │
│         │ API Calls                            │
│         ▼                                       │
│  ┌──────────────┐                              │
│  │  FastAPI     │                              │
│  │  (Railway/   │                              │
│  │   Render)    │                              │
│  └──────┬───────┘                              │
│         │                                       │
│         │ Database Connection                  │
│         ▼                                       │
│  ┌──────────────┐         ┌──────────────┐    │
│  │  PostgreSQL  │         │  File Storage│    │
│  │  (Managed DB)│         │  (S3/R2)     │    │
│  └──────────────┘         └──────────────┘    │
└─────────────────────────────────────────────────┘
```

---

## Prerequisites

### Required Services

- **Cloud Platform Account** (Railway, Render, Heroku, or AWS)
- **Vercel Account** (for frontend hosting)
- **PostgreSQL Database** (managed service or self-hosted)
- **Domain Name** (optional, for custom domains)
- **Third-Party Service Accounts**:
  - Anthropic API (for Claude)
  - GitHub OAuth App
  - Notion OAuth Integration
  - Atlassian OAuth App
  - Other integrations as needed

### Required Tools

- Git
- Docker (optional, for containerized deployment)
- Node.js 18+ (for local builds)
- Python 3.11+ (for local testing)
- pnpm (for frontend dependencies)
- Poetry (for backend dependencies)

---

## Environment Configuration

### Backend Environment Variables

Create a `.env` file in `apps/api/`:

```bash
# ===========================================
# Core Configuration
# ===========================================
ENVIRONMENT=production
DEBUG=false
PROJECT_NAME="SDLC Agents API"
VERSION=1.0.0
API_V1_STR=/api/v1

# ===========================================
# Server Configuration
# ===========================================
HOST=0.0.0.0
PORT=8000

# ===========================================
# Database Configuration
# ===========================================
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=40
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=1800

# ===========================================
# Security
# ===========================================
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# ===========================================
# CORS Configuration
# ===========================================
BACKEND_CORS_ORIGINS=https://your-frontend.vercel.app,https://your-custom-domain.com

# ===========================================
# Claude Code SDK
# ===========================================
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx
CLAUDE_PERMISSION_MODE=bypassPermissions
CLAUDE_REQUEST_TIMEOUT=300

# ===========================================
# Workspace Configuration
# ===========================================
AGENTS_DIR=/app/agents

# ===========================================
# Logging
# ===========================================
LOG_LEVEL=INFO

# ===========================================
# Documentation
# ===========================================
ENABLE_DOCS=true
ENABLE_REDOC=true
```

### Frontend Environment Variables

Create a `.env.local` file in `apps/web/`:

```bash
# ===========================================
# App Configuration
# ===========================================
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_API_URL=https://your-api.railway.app/api/v1

# ===========================================
# OAuth - Notion
# ===========================================
NEXT_PUBLIC_NOTION_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_NOTION_CLIENT_SECRET=secret_xxxxxxxxxxxxx

# ===========================================
# OAuth - GitHub
# ===========================================
NEXT_PUBLIC_GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxx
NEXT_PUBLIC_GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxx

# ===========================================
# OAuth - Atlassian
# ===========================================
NEXT_PUBLIC_ATLASSIAN_CLIENT_ID=xxxxxxxxxxxxx
NEXT_PUBLIC_ATLASSIAN_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxx

# ===========================================
# OAuth - Figma (if using)
# ===========================================
NEXT_PUBLIC_FIGMA_CLIENT_ID=xxxxxxxxxxxxx
NEXT_PUBLIC_FIGMA_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxx

# Add other OAuth credentials as needed
```

---

## Backend Deployment

### Option 1: Railway Deployment

**Railway** is the recommended platform for FastAPI deployment.

#### Step 1: Prepare Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
cd apps/api
railway init

# Link to existing project (or create new)
railway link
```

#### Step 2: Configure Railway

Create `railway.json` in `apps/api/`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "poetry install --no-dev"
  },
  "deploy": {
    "startCommand": "poetry run uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### Step 3: Set Environment Variables

```bash
# Set variables via CLI
railway variables set SECRET_KEY=your-secret-key
railway variables set DATABASE_URL=postgresql+asyncpg://...
railway variables set ANTHROPIC_API_KEY=sk-ant-...
# ... set all other variables

# Or use Railway dashboard to add variables
```

#### Step 4: Deploy

```bash
# Deploy to Railway
railway up

# Check deployment status
railway status

# View logs
railway logs

# Get deployment URL
railway domain
```

#### Step 5: Configure Custom Domain (Optional)

```bash
# Add custom domain
railway domain add api.yourdomain.com
```

---

### Option 2: Render Deployment

#### Step 1: Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select `apps/api` directory

#### Step 2: Configure Build Settings

**Build Command**:
```bash
poetry install --no-dev
```

**Start Command**:
```bash
poetry run uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

#### Step 3: Environment Variables

Add all backend environment variables in Render dashboard.

#### Step 4: Deploy

Render will automatically deploy on push to the main branch.

---

### Option 3: Docker Deployment

#### Step 1: Build Docker Image

```bash
cd apps/api

# Build image
docker build -t sdlc-agents-api:latest .

# Test locally
docker run -p 8000:8000 --env-file .env sdlc-agents-api:latest
```

#### Step 2: Push to Container Registry

```bash
# Tag for registry
docker tag sdlc-agents-api:latest your-registry.com/sdlc-agents-api:latest

# Push
docker push your-registry.com/sdlc-agents-api:latest
```

#### Step 3: Deploy to Container Platform

**Docker Compose** (for VPS/self-hosted):

```yaml
version: '3.8'

services:
  api:
    image: your-registry.com/sdlc-agents-api:latest
    ports:
      - "8000:8000"
    env_file:
      - .env
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: sdlc_user
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: sdlc_agents
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

```bash
# Deploy
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Frontend Deployment

### Recommended: Vercel Deployment

**Vercel** provides seamless Next.js deployment with optimal performance.

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Deploy

```bash
cd apps/web

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

#### Step 3: Configure via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Add all frontend environment variables
5. Redeploy if needed

#### Step 4: Custom Domain (Optional)

1. Go to "Settings" → "Domains"
2. Add custom domain: `app.yourdomain.com`
3. Follow DNS configuration instructions

---

### Alternative: Netlify Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd apps/web
netlify deploy --prod

# Set environment variables
netlify env:set NEXT_PUBLIC_API_URL https://your-api.railway.app/api/v1
# ... set other variables
```

---

### Alternative: Self-Hosted with Nginx

#### Step 1: Build Application

```bash
cd apps/web

# Install dependencies
pnpm install

# Build for production
pnpm build

# Output will be in .next/ directory
```

#### Step 2: Start Production Server

```bash
# Start Next.js production server
pnpm start

# Or use PM2 for process management
pm2 start npm --name "sdlc-web" -- start
pm2 save
pm2 startup
```

#### Step 3: Nginx Configuration

```nginx
server {
    listen 80;
    server_name app.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/sdlc-web /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### Step 4: SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d app.yourdomain.com

# Auto-renewal is set up automatically
```

---

## Database Setup

### Option 1: Managed PostgreSQL (Recommended)

**Providers**:
- Railway (included with backend deployment)
- Render
- AWS RDS
- Google Cloud SQL
- DigitalOcean Managed Databases
- Supabase

**Setup with Railway**:

```bash
# Add PostgreSQL to Railway project
railway add

# Select PostgreSQL plugin

# Get connection string
railway variables

# Copy DATABASE_URL
```

**Setup with Render**:

1. Go to Render Dashboard
2. Click "New +" → "PostgreSQL"
3. Configure database
4. Copy "External Database URL"
5. Use as `DATABASE_URL` in backend

---

### Option 2: Self-Hosted PostgreSQL

#### Step 1: Install PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql@15
```

#### Step 2: Create Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE sdlc_agents;
CREATE USER sdlc_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE sdlc_agents TO sdlc_user;
\q
```

#### Step 3: Configure Connection

```bash
# Allow remote connections (if needed)
sudo nano /etc/postgresql/15/main/postgresql.conf

# Set listen_addresses
listen_addresses = '*'

# Edit pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Add line for remote access
host    all             all             0.0.0.0/0               md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### Step 4: Run Migrations

```bash
cd apps/api

# Install Alembic
poetry install

# Run migrations
poetry run alembic upgrade head
```

---

## Monitoring & Logging

### Application Monitoring

**Recommended Tools**:

1. **Sentry** - Error tracking
   ```bash
   # Install Sentry
   poetry add sentry-sdk[fastapi]
   ```

   ```python
   # In app/main.py
   import sentry_sdk

   sentry_sdk.init(
       dsn="https://your-dsn@sentry.io/project-id",
       environment=settings.ENVIRONMENT,
       traces_sample_rate=0.1,
   )
   ```

2. **New Relic** - APM
3. **DataDog** - Full observability

### Logging

**Structured Logging with Loguru**:

```python
# Already configured in app/utils/logger.py

# Logs are output to:
# - Console (stdout/stderr)
# - File (optional)
# - Cloud logging service (optional)
```

**Cloud Logging**:

- **Railway**: Built-in logging via `railway logs`
- **Render**: Built-in logging in dashboard
- **AWS**: CloudWatch Logs
- **Google Cloud**: Cloud Logging

### Health Checks

**Backend Health Check**:
```bash
curl https://your-api.railway.app/health
```

**Response**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "service": "Claude Code Wrapper API",
  "environment": "production"
}
```

**Database Health Check**:
```bash
curl https://your-api.railway.app/api/v1/claude-code/health
```

### Uptime Monitoring

**Tools**:
- **UptimeRobot** (free tier available)
- **Pingdom**
- **StatusCake**
- **Better Uptime**

**Setup**:
1. Add health check URL
2. Set check interval (e.g., 5 minutes)
3. Configure alerts (email, Slack, PagerDuty)

---

## Security Checklist

### Pre-Deployment Security

- [ ] Change default `SECRET_KEY` to strong random value
- [ ] Use HTTPS for all endpoints
- [ ] Enable CORS only for specific origins (not wildcard `*`)
- [ ] Rotate OAuth client secrets
- [ ] Use managed secrets service (AWS Secrets Manager, Railway Secrets)
- [ ] Enable database SSL connections
- [ ] Set strong database passwords
- [ ] Disable API documentation in production (`ENABLE_DOCS=false`)
- [ ] Enable rate limiting (optional, via middleware)
- [ ] Review and minimize database permissions
- [ ] Use environment-specific configurations

### Post-Deployment Security

- [ ] Monitor error logs for security issues
- [ ] Set up intrusion detection
- [ ] Enable database backups
- [ ] Configure firewall rules
- [ ] Review OAuth redirect URIs
- [ ] Enable 2FA for deployment platforms
- [ ] Set up security alerts (Sentry, New Relic)
-[ ] Conduct security audit
- [ ] Implement API rate limiting
- [ ] Monitor for dependency vulnerabilities

### OAuth Security

**Redirect URI Configuration**:

Ensure OAuth apps use exact redirect URIs:

**Notion**:
- `https://your-app.vercel.app/api/auth/notion`

**GitHub**:
- `https://your-app.vercel.app/api/auth/github`

**Atlassian**:
- `https://your-app.vercel.app/api/auth/atlassian`
- `https://your-app.vercel.app/api/auth/atlassian-mcp`

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**Error**: `asyncpg.exceptions.InvalidPasswordError`

**Solution**:
- Verify `DATABASE_URL` format
- Ensure database user has correct permissions
- Check firewall rules (if self-hosted)
- For Railway: Verify PostgreSQL plugin is attached

#### 2. CORS Errors

**Error**: `Access to fetch at 'https://api.example.com' from origin 'https://app.example.com' has been blocked by CORS policy`

**Solution**:
```bash
# Update BACKEND_CORS_ORIGINS
BACKEND_CORS_ORIGINS=https://app.example.com,https://www.app.example.com
```

#### 3. OAuth Redirect Mismatch

**Error**: `redirect_uri_mismatch`

**Solution**:
- Update OAuth app redirect URIs to match deployed URLs
- Ensure `NEXT_PUBLIC_APP_URL` is set correctly

#### 4. Claude API Errors

**Error**: `AuthenticationError: Invalid API key`

**Solution**:
- Verify `ANTHROPIC_API_KEY` is set correctly
- Check API key is valid on Anthropic dashboard
- Ensure no whitespace in key

#### 5. Out of Memory Errors

**Error**: `JavaScript heap out of memory`

**Solution** (for Next.js build):
```bash
# Increase Node.js memory limit
NODE_OPTIONS=--max-old-space-size=4096 pnpm build
```

#### 6. File Upload Issues

**Error**: File uploads fail or timeout

**Solution**:
- Increase request timeout on platform
- Configure file size limits
- Use cloud storage (S3) for large files

### Debugging

**Backend Logs**:
```bash
# Railway
railway logs

# Render
# View logs in dashboard

# Docker
docker logs container-name -f
```

**Frontend Logs**:
```bash
# Vercel
vercel logs

# Check browser console for client-side errors
```

**Database Queries**:
```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# Check active connections
SELECT * FROM pg_stat_activity;

# Check database size
SELECT pg_size_pretty(pg_database_size('sdlc_agents'));
```

---

## Performance Optimization

### Backend Optimization

1. **Database Connection Pooling**:
   - Already configured with optimal pool size
   - Adjust if needed based on load

2. **Caching**:
   - Add Redis for session caching (optional)
   - Cache API responses (integration data)

3. **Async Operations**:
   - Already using async/await throughout
   - Ensure all I/O is non-blocking

### Frontend Optimization

1. **Image Optimization**:
   - Use Next.js `Image` component
   - Serve images from CDN

2. **Code Splitting**:
   - Automatic with Next.js App Router
   - Use dynamic imports for heavy components

3. **Bundle Analysis**:
   ```bash
   # Analyze bundle size
   pnpm build
   ANALYZE=true pnpm build
   ```

4. **Edge Caching**:
   - Configure Vercel edge caching
   - Add cache headers for static assets

---

## Backup & Recovery

### Database Backups

**Automated Backups** (Managed Databases):
- Railway: Automatic daily backups
- Render: Automatic backups on paid plans
- AWS RDS: Configure automated backups

**Manual Backup**:
```bash
# Backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20240101.sql
```

### Workspace Backups

**Agent Workspaces** (if using persistent storage):
```bash
# Backup workspace directory
tar -czf agents_backup_$(date +%Y%m%d).tar.gz /app/agents/

# Upload to S3 (or other storage)
aws s3 cp agents_backup_20240101.tar.gz s3://your-bucket/backups/
```

---

## Scaling

### Horizontal Scaling

**Backend**:
- Deploy multiple instances behind load balancer
- Use managed database with read replicas
- Add Redis for distributed caching

**Frontend**:
- Vercel automatically scales with edge network
- No additional configuration needed

### Vertical Scaling

**Railway/Render**:
- Upgrade instance size in platform dashboard
- Monitor CPU and memory usage

### Load Testing

```bash
# Install k6
brew install k6

# Create load test script
cat > load_test.js <<EOF
import http from 'k6/http';

export default function() {
  http.get('https://your-api.railway.app/health');
}

export let options = {
  vus: 100,
  duration: '30s',
};
EOF

# Run test
k6 run load_test.js
```

---

## Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Run database migrations
- [ ] Test OAuth flows for all integrations
- [ ] Verify API health check returns 200
- [ ] Test agent execution with Claude API
- [ ] Check CORS configuration
- [ ] Set up monitoring and alerts
- [ ] Configure backups
- [ ] Review security settings
- [ ] Test file uploads
- [ ] Verify email notifications (if configured)
- [ ] Load test critical endpoints
- [ ] Document deployment URLs and credentials
- [ ] Set up status page (optional)
- [ ] Train team on production access

---

## Rollback Procedure

### Railway Rollback

```bash
# List deployments
railway deployments

# Rollback to previous deployment
railway rollback <deployment-id>
```

### Vercel Rollback

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-url>
```

### Database Rollback

```bash
# Downgrade database migration
cd apps/api
poetry run alembic downgrade -1

# Or restore from backup
psql $DATABASE_URL < backup_20240101.sql
```

---

## Conclusion

This deployment guide provides comprehensive instructions for deploying SDLC Agents to production. For the most reliable and scalable deployment:

✅ **Backend**: Railway or Render with managed PostgreSQL
✅ **Frontend**: Vercel for optimal Next.js performance
✅ **Monitoring**: Sentry for errors, UptimeRobot for uptime
✅ **Backups**: Automated database backups, manual workspace backups
✅ **Security**: HTTPS, strong secrets, CORS configuration, regular audits

For questions or issues, consult the logs, check health endpoints, and review the troubleshooting section.
