# DevOrbit AI - Documentation Index

Welcome to the comprehensive documentation for the DevOrbit AI platform. This index will guide you to the right documentation based on your needs.

---

## 📚 Documentation Files

### 1. **SystemArchitecture.md** - System Architecture Documentation
**Who should read this**: Architects, senior developers, DevOps engineers

**Contents**:
- Executive summary of the platform
- High-level architecture diagrams
- Component breakdown and responsibilities
- Architecture patterns (Factory, Repository, Adapter, etc.)
- Technology stack details
- Data flow and request lifecycle
- Security architecture
- Scalability considerations
- Performance metrics and monitoring

**Best for**:
- Understanding the overall system design
- Making architectural decisions
- Planning infrastructure
- Onboarding senior engineers

---

### 2. **BackendAPI_Documentation.md** - Complete Backend API Reference
**Who should read this**: Backend developers, integration developers, API consumers

**Contents**:
- API overview and base information
- Authentication (JWT, OAuth flows)
- Complete endpoint reference
  - Projects
  - Integrations
  - Integration clients (GitHub, Notion, Atlassian, etc.)
  - Agent sessions
  - File uploads
- Agent workflows deep dive
  - Code Analysis
  - Code Reviewer
  - Test Case Generation
  - Requirements to Tickets
  - Root Cause Analysis
  - API Testing Suite
- Database schema with ER diagrams
- Error handling and status codes
- Streaming protocols (AI SDK v4, v5, SSE)
- MCP integration details

**Best for**:
- Building API integrations
- Understanding agent workflows
- Debugging API issues
- Implementing new agents

---

### 3. **Frontend_Documentation.md** - Complete Frontend Documentation
**Who should read this**: Frontend developers, UI/UX developers

**Contents**:
- Technology stack (Next.js, React, TypeScript, Tailwind)
- Project structure and organization
- Comprehensive type system (19 type definition files)
- State management with Zustand (3 stores)
- Component architecture
  - UI primitives (17 components)
  - Shared components (60+ components)
  - Feature components
  - Agent pages
- Integration flows and OAuth
- API communication patterns
- Authentication and authorization
- Development guide

**Best for**:
- Frontend development
- Adding new agent pages
- Implementing integrations
- UI/UX improvements

---

### 4. **Deployment_Guide.md** - Production Deployment Guide
**Who should read this**: DevOps engineers, system administrators, deployment engineers

**Contents**:
- Deployment overview and architecture
- Prerequisites and required services
- Environment configuration
- Backend deployment
  - Fly.io (recommended)
  - Render
  - Docker deployment
- Frontend deployment
  - Vercel (recommended)
  - Netlify
  - Self-hosted with Nginx
- Database setup (managed and self-hosted)
- Monitoring and logging
- Security checklist
- Troubleshooting common issues
- Performance optimization
- Backup and recovery
- Scaling strategies

**Best for**:
- Deploying to production
- Infrastructure planning
- Troubleshooting deployment issues
- Setting up CI/CD

---

## 🎯 Quick Navigation

### I want to...

#### Understand the Platform
→ Start with **SystemArchitecture.md** (Executive Summary)

#### Build a Feature
→ **BackendAPI_Documentation.md** (if backend)
→ **Frontend_Documentation.md** (if frontend)

#### Deploy the Application
→ **Deployment_Guide.md**

#### Add a New Agent
→ **BackendAPI_Documentation.md** (Agent Workflows section)
→ **Frontend_Documentation.md** (Agent Pages section)

#### Add a New Integration
→ **BackendAPI_Documentation.md** (Integration Clients section)
→ **Frontend_Documentation.md** (Integration Flows section)

#### Debug an Issue
→ **BackendAPI_Documentation.md** (Error Handling section)
→ **Deployment_Guide.md** (Troubleshooting section)

#### Optimize Performance
→ **SystemArchitecture.md** (Scalability & Performance sections)
→ **Deployment_Guide.md** (Performance Optimization section)

---

## 🏗️ Platform Overview

### What is DevOrbit AI?

DevOrbit AI is a comprehensive AI-powered platform for automating software development lifecycle tasks. It consists of:

**6 Specialized AI Agents**:
1. **Code Analysis Agent** - Analyze repositories and generate documentation
2. **Code Reviewer Agent** - Review pull requests with AI assistance
3. **Test Case Generation Agent** - Generate comprehensive test cases from PRDs
4. **Requirements to Tickets Agent** - Convert requirements into Jira tickets
5. **Root Cause Analysis Agent** - Analyze incidents and identify solutions
6. **API Testing Suite Agent** - Generate API test suites from OpenAPI specs

**11+ Service Integrations**:
- GitHub (repositories, PRs, branches)
- Jira (projects, issues, epics)
- Confluence (spaces, pages)
- Notion (pages, databases)
- Figma (design files)
- PagerDuty (incidents)
- Sentry (error tracking)
- DataDog (logs, metrics)
- Grafana (dashboards)
- CloudWatch (AWS logs)
- New Relic (APM)

**Core Technologies**:
- **Backend**: FastAPI + Python 3.11 + Claude Code SDK
- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Database**: PostgreSQL + SQLModel
- **State Management**: Zustand
- **AI Streaming**: Vercel AI SDK

---

## 📖 Documentation Conventions

### Code Examples

Code examples in the documentation use the following conventions:

```python
# Python code for backend
def example_function():
    pass
```

```typescript
// TypeScript code for frontend
function exampleFunction(): void {
  // implementation
}
```

```bash
# Shell commands
command --flag value
```

### Placeholders

When you see placeholders like these, replace them with your actual values:

- `{agent_type}` - Replace with actual agent identifier (e.g., `code_analysis`)
- `{session_id}` - Replace with actual session ID
- `your-api.fly.dev` - Replace with your actual API URL
- `your-app.vercel.app` - Replace with your actual frontend URL

### Status Indicators

- ✅ **Implemented** - Feature is complete and tested
- 🔄 **In Progress** - Feature is under development
- 📝 **Planned** - Feature is planned for future release

---

## 🛠️ Development Setup

### Quick Start (Local Development)

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd devorbit-ai
   ```

2. **Backend setup**:
   ```bash
   cd apps/api
   poetry install
   cp .env.example .env
   # Edit .env with your configuration
   poetry run alembic upgrade head
   poetry run uvicorn app.main:app --reload
   ```

3. **Frontend setup**:
   ```bash
   cd apps/web
   pnpm install
   cp .env.example .env.local
   # Edit .env.local with your configuration
   pnpm dev
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

For detailed setup instructions, see:
- **Backend**: BackendAPI_Documentation.md → Development Tools section
- **Frontend**: Frontend_Documentation.md → Development Guide section

---

## 🔐 Security

**Important security notes**:

1. **Never commit secrets** - Use `.env` files (gitignored)
2. **Change default secrets** - Especially `SECRET_KEY` in production
3. **Use HTTPS** - All production deployments must use HTTPS
4. **Configure CORS** - Restrict to specific origins, not wildcard
5. **Rotate credentials** - Regularly rotate API keys and OAuth secrets

See **Deployment_Guide.md → Security Checklist** for comprehensive security guidelines.

---

## 🧪 Testing

### Backend Tests

```bash
cd apps/api
poetry run pytest
poetry run pytest --cov=app --cov-report=term-missing
```

### Frontend Tests

```bash
cd apps/web
pnpm test
```

---

## 📊 Key Metrics

### Platform Statistics

- **Lines of Code**: ~50,000+ (backend + frontend)
- **Type Definitions**: 19 TypeScript files
- **Components**: 60+ shared, 17 UI primitives
- **State Stores**: 3 Zustand stores (825 lines for project store)
- **API Endpoints**: 40+ endpoints
- **Agent Workflows**: 6 specialized agents
- **Integrations**: 11+ third-party services

### Performance Targets

- API Response Time: < 200ms (non-streaming)
- Streaming Latency: < 100ms (first event)
- Page Load Time: < 2s
- Database Query Time: < 50ms

---

## 🤝 Contributing

### Adding New Features

1. **New Agent**:
   - Backend: Create workflow in `apps/api/app/agents/workflows/`
   - Frontend: Create page in `apps/web/src/app/(agents)/`
   - See: BackendAPI_Documentation.md + Frontend_Documentation.md

2. **New Integration**:
   - Backend: Add to integration endpoints
   - Frontend: Create modal + hook + OAuth route
   - See: Frontend_Documentation.md → Adding a New Integration

3. **UI Components**:
   - Follow shadcn/ui patterns
   - Use Radix UI primitives
   - Document in component file

---

## 📞 Support & Resources

### Documentation Issues

If you find errors or unclear sections in this documentation:

1. Check the related source code for clarification
2. Review API documentation at `/docs` endpoint
3. Check commit history for recent changes

### External Resources

- **FastAPI**: https://fastapi.tiangolo.com/
- **Next.js**: https://nextjs.org/docs
- **Claude Code SDK**: https://github.com/anthropics/claude-code-sdk
- **Radix UI**: https://www.radix-ui.com/
- **Tailwind CSS**: https://tailwindcss.com/

---

## 📋 Documentation Maintenance

### Updating Documentation

When making significant changes to the codebase:

1. **Update relevant documentation files**
2. **Add version numbers if breaking changes**
3. **Update code examples to match current implementation**
4. **Review related documentation sections**

### Documentation Version

Current Documentation Version: **1.0.0** (Generated: 2024)

Based on:
- Backend: DevOrbit AI API v1.0.0
- Frontend: @devorbit-ai/web v0.1.0

---

## 🎉 Conclusion

This documentation suite provides comprehensive coverage of the DevOrbit AI platform. Whether you're developing new features, deploying to production, or integrating with the API, you'll find the information you need in these guides.

**Happy building! 🚀**
