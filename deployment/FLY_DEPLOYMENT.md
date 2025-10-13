# DevOrbit AI - Fly.io Deployment Guide

This guide provides step-by-step instructions for deploying the DevOrbit AI platform to Fly.io.

## Quick Start

### Prerequisites

1. **Install Fly.io CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login to Fly.io**:
   ```bash
   flyctl auth login
   ```

3. **Set up your environment variables** (see [Environment Variables](#environment-variables) section)

### Deploy All Services

Run the automated deployment script:

```bash
# Make the script executable (run from project root)
chmod +x deployment/deploy.sh

# Deploy all services
./deployment/deploy.sh
```

This will:
- Deploy PostgreSQL database
- Deploy API service
- Deploy Web service
- Configure networking between services
- Set up basic environment variables

### Configure Secrets

After deployment, configure your secrets:

```bash
# Run the secrets configuration script (run from project root)
./deployment/fly-secrets.sh

# Or set secrets manually
flyctl secrets set ANTHROPIC_API_KEY='your-anthropic-key' --app devorbit-ai-api
flyctl secrets set NEXT_PUBLIC_NOTION_CLIENT_ID='your-notion-client-id' --app devorbit-ai-web
# ... set other OAuth credentials
```

## 🚀 Automated Deployment with GitHub Actions (Recommended)

For production workflows, use the automated CI/CD pipeline:

### Setup GitHub Actions CD Pipeline

1. **Generate Fly.io deploy token**:
   ```bash
   flyctl tokens create deploy -x 999999h
   ```
   Copy the entire token (including `FlyV1` prefix).

2. **Add token to GitHub Secrets**:
   - Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
   - Create new secret: `FLY_API_TOKEN`
   - Paste the token as the value

3. **Push to main branch**:
   ```bash
   git push origin main
   ```

The CD pipeline will automatically:
- ✅ Detect which apps changed (API/Web)
- ✅ Deploy only what changed
- ✅ Deploy API first, then Web (if both changed)
- ✅ Show deployment status in GitHub Actions

**Learn more**: See [`.github/workflows/README.md`](../.github/workflows/README.md) for complete documentation.

---

## Manual Deployment

If you prefer to deploy services individually or for initial setup:

### 1. Deploy Database

```bash
cd apps/api
flyctl launch --config fly.postgres.toml
flyctl deploy --config fly.postgres.toml
cd ../..
```

### 2. Deploy API

```bash
cd apps/api
flyctl launch --config fly-api.toml
flyctl deploy --config fly-api.toml
cd ../..
```

### 3. Deploy Web

```bash
cd apps/web
flyctl launch --config fly-web.toml
flyctl deploy --config fly-web.toml
cd ../..
```

## Environment Variables

### API Secrets (devorbit-ai-api)

**Required:**
- `SECRET_KEY` - Random secret key for JWT tokens
- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `DATABASE_URL` - PostgreSQL connection string (set automatically)

**Optional:**
- `BACKEND_CORS_ORIGINS` - CORS allowed origins
- `LOG_LEVEL` - Logging level (default: INFO)

### Web Secrets (devorbit-ai-web)

**Required:**
- `NEXT_PUBLIC_API_URL` - API endpoint URL (set automatically)

**OAuth Integration:**
- `NEXT_PUBLIC_NOTION_CLIENT_ID` - Notion OAuth client ID
- `NEXT_PUBLIC_NOTION_CLIENT_SECRET` - Notion OAuth client secret
- `NEXT_PUBLIC_GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `NEXT_PUBLIC_GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- `NEXT_PUBLIC_ATLASSIAN_CLIENT_ID` - Atlassian OAuth client ID
- `NEXT_PUBLIC_ATLASSIAN_CLIENT_SECRET` - Atlassian OAuth client secret

## Monitoring

### Check Service Status

```bash
# Check API status
flyctl status --app devorbit-ai-api

# Check Web status
flyctl status --app devorbit-ai-web

# Check Database status
flyctl status --app devorbit-ai-db
```

### View Logs

```bash
# API logs
flyctl logs --app devorbit-ai-api

# Web logs
flyctl logs --app devorbit-ai-web

# Database logs
flyctl logs --app devorbit-ai-db
```

### Health Checks

```bash
# API health check
curl https://your-api.fly.dev/health

# Web health check
curl https://your-web.fly.dev/
```

## Scaling

### Scale Services

```bash
# Scale API to 2 instances
flyctl scale count 2 --app devorbit-ai-api

# Scale Web to 2 instances
flyctl scale count 2 --app devorbit-ai-web

# Upgrade machine size
flyctl scale vm shared-cpu-2x --app devorbit-ai-api
```

## Custom Domains

### Add Custom Domains

```bash
# Add custom domain to API
flyctl certs add api.yourdomain.com --app devorbit-ai-api

# Add custom domain to Web
flyctl certs add app.yourdomain.com --app devorbit-ai-web
```

## Backups

### Database Backups

```bash
# Create volume snapshot
flyctl volumes snapshot create --app devorbit-ai-db

# List snapshots
flyctl volumes snapshot list --app devorbit-ai-db
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   ```bash
   # Check database status
   flyctl status --app devorbit-ai-db

   # Check database logs
   flyctl logs --app devorbit-ai-db
   ```

2. **API Not Starting**:
   ```bash
   # Check API logs
   flyctl logs --app devorbit-ai-api

   # Check secrets
   flyctl secrets list --app devorbit-ai-api
   ```

3. **Web Not Loading**:
   ```bash
   # Check Web logs
   flyctl logs --app devorbit-ai-web

   # Check if API is accessible
   curl https://your-api.fly.dev/health
   ```

### Debug Commands

```bash
# SSH into API machine
flyctl ssh console --app devorbit-ai-api

# SSH into Web machine
flyctl ssh console --app devorbit-ai-web

# Check machine metrics
flyctl metrics --app devorbit-ai-api
```

## Security

### Security Checklist

- [ ] Set strong `SECRET_KEY`
- [ ] Use HTTPS (automatic with Fly.io)
- [ ] Configure CORS properly
- [ ] Set up OAuth redirect URIs correctly
- [ ] Monitor logs for security issues
- [ ] Regular security updates

### OAuth Redirect URIs

Ensure your OAuth applications use the correct redirect URIs:

- **Notion**: `https://your-web.fly.dev/api/auth/notion`
- **GitHub**: `https://your-web.fly.dev/api/auth/github`
- **Atlassian**: `https://your-web.fly.dev/api/auth/atlassian`

## Cost Optimization

### Auto-scaling

Fly.io automatically scales down to 0 when not in use (with `auto_stop_machines = true`).

### Resource Optimization

```bash
# Check current resource usage
flyctl metrics --app devorbit-ai-api

# Adjust machine size if needed
flyctl scale vm shared-cpu-1x --app devorbit-ai-api
```

## Support

For issues with Fly.io deployment:

1. Check the [Fly.io Documentation](https://fly.io/docs/)
2. Review service logs: `flyctl logs --app <app-name>`
3. Check service status: `flyctl status --app <app-name>`
4. Contact Fly.io support if needed

## Migration from Railway

If migrating from Railway:

1. Export your Railway environment variables
2. Set them as Fly.io secrets using `flyctl secrets set`
3. Update your OAuth redirect URIs
4. Test all integrations thoroughly
5. Update your DNS records if using custom domains
