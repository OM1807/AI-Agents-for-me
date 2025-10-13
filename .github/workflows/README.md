# GitHub Actions CI/CD Workflows

This directory contains automated workflows for Continuous Integration and Continuous Deployment.

## 📋 Workflows

### `cd.yml` - Continuous Deployment Pipeline

Automatically deploys your API and Web applications to Fly.io when changes are pushed to the `main` branch.

## 🚀 Setup Instructions

### 1. Generate Fly.io Deploy Token

First, you need to create a deploy token that GitHub Actions will use to deploy to Fly.io.

```bash
# Generate a long-lived deploy token (valid for ~114 years)
flyctl tokens create deploy -x 999999h
```

**Important:** Copy the entire token output, including the `FlyV1` prefix and the space after it.

Example output:
```
FlyV1 fm2_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 2. Add Token to GitHub Secrets

1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `FLY_API_TOKEN`
5. Value: Paste the entire token from step 1
6. Click **Add secret**

### 3. Verify Fly.io Apps Exist

Make sure your Fly.io apps are already created:

```bash
# Check if apps exist
flyctl apps list

# You should see:
# - devorbit-ai-api
# - devorbit-ai
```

If they don't exist, create them:

```bash
# Deploy manually first time to create the apps
cd apps/api && flyctl launch --config fly-api.toml && cd ../..
cd apps/web && flyctl launch --config fly-web.toml && cd ../..
```

### 4. Push to Main Branch

Once the token is set up, any push to the `main` branch will trigger automatic deployment:

```bash
git add .
git commit -m "Enable CD pipeline"
git push origin main
```

## 📊 How It Works

### Change Detection

The pipeline automatically detects which apps changed:

- **API changes**: Files in `apps/api/**`
- **Web changes**: Files in `apps/web/**`

### Deployment Flow

```
┌─────────────────────┐
│  Push to main       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Detect Changes     │
│  (API/Web)          │
└──────────┬──────────┘
           │
           ├─────────────────┐
           ▼                 ▼
    ┌──────────┐      ┌──────────┐
    │ API      │      │ Web      │
    │ Changed? │      │ Changed? │
    └────┬─────┘      └────┬─────┘
         │                 │
         ▼                 │
    ┌──────────┐           │
    │ Deploy   │           │
    │ API      │           │
    └────┬─────┘           │
         │                 │
         └────────┬────────┘
                  ▼
           ┌──────────────┐
           │ Deploy Web   │
           │ (if changed) │
           └──────────────┘
```

### Key Features

✅ **Smart Deployment**: Only deploys apps that changed
✅ **Sequential Deployment**: API deploys first, then Web (since Web depends on API)
✅ **Concurrency Control**: Prevents parallel deployments to same app
✅ **Deployment Summary**: Shows clear status for each deployment
✅ **Manual Trigger**: Can manually trigger via GitHub UI using `workflow_dispatch`

## 🎯 Deployment Scenarios

### Scenario 1: Only API Changed
```
✅ API: Deployed successfully
⏭️ Web: No changes detected
```

### Scenario 2: Only Web Changed
```
⏭️ API: No changes detected
✅ Web: Deployed successfully
```

### Scenario 3: Both Changed
```
✅ API: Deployed successfully (deploys first)
✅ Web: Deployed successfully (waits for API)
```

### Scenario 4: API Failed, Web Changed
```
❌ API: Deployment failed
⏭️ Web: Skipped (API dependency failed)
```

## 🔍 Monitoring Deployments

### View Deployment Logs

1. Go to your GitHub repository
2. Click on the **Actions** tab
3. Click on the latest workflow run
4. View detailed logs for each deployment step

### Check Deployment Status

```bash
# Check API status
flyctl status --app devorbit-ai-api

# Check Web status
flyctl status --app devorbit-ai

# View API logs
flyctl logs --app devorbit-ai-api

# View Web logs
flyctl logs --app devorbit-ai
```

### Deployment URLs

Once deployed, your apps are available at:

- **API**: https://devorbit-ai-api.fly.dev
- **Web**: https://devorbit-ai.fly.dev
- **API Health**: https://devorbit-ai-api.fly.dev/health
- **API Docs**: https://devorbit-ai-api.fly.dev/docs

## 🔧 Manual Deployment Trigger

You can manually trigger a deployment without pushing code:

1. Go to **Actions** tab in GitHub
2. Select **CD Pipeline** workflow
3. Click **Run workflow**
4. Select branch (usually `main`)
5. Click **Run workflow** button

This will deploy both API and Web regardless of what changed.

## 🛠️ Troubleshooting

### Issue: "FLY_API_TOKEN secret not found"

**Solution**: Make sure you added the `FLY_API_TOKEN` secret in GitHub repository settings (see Setup step 2).

### Issue: "App not found"

**Solution**: Create the app on Fly.io first:
```bash
cd apps/api && flyctl launch --config fly-api.toml && cd ../..
```

### Issue: Deployment fails with "unauthorized"

**Solution**:
1. Generate a new token: `flyctl tokens create deploy -x 999999h`
2. Update the `FLY_API_TOKEN` secret in GitHub

### Issue: Web deployment fails when API changes

**Solution**: This is expected if API deployment fails. Fix API issues first, then Web will deploy automatically on next push.

## 📝 Best Practices

1. **Test Locally First**: Always test your changes locally before pushing
2. **Check Logs**: Review deployment logs if something goes wrong
3. **Monitor Health**: Verify health endpoints after deployment
4. **Small Changes**: Push small, incremental changes for easier debugging
5. **Use Branches**: Develop in feature branches, merge to main when ready

## 🔒 Security Notes

- Never commit the `FLY_API_TOKEN` to your repository
- Keep the token in GitHub Secrets only
- Rotate tokens periodically for security
- Use deploy tokens (not personal tokens) for CI/CD

## 📚 Additional Resources

- [Fly.io GitHub Actions Documentation](https://fly.io/docs/launch/continuous-deployment-with-github-actions/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Fly.io Deploy Tokens](https://fly.io/docs/reference/deploy-tokens/)
- [superfly/flyctl-actions](https://github.com/superfly/flyctl-actions)

## 🆘 Need Help?

If you encounter issues:

1. Check the GitHub Actions logs
2. Review Fly.io logs: `flyctl logs --app <app-name>`
3. Verify secrets are configured correctly
4. Check the deployment documentation in `/deployment` folder
