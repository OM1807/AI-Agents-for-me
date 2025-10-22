# Requirements-to-Code: Initial Code Generation Task (IMPROVED)

You are about to generate production-ready code from the requirements provided below. Read all sections carefully and confirm your understanding before proceeding.

---

## 📥 Input Sources

{% if not requirements or requirements|length == 0 %}
⚠️ **ERROR**: No requirements provided. Cannot proceed with code generation.
{% else %}
The following requirements have been fetched and analyzed:

{% for key, req in requirements.items() %}
### 📌 Source {{ loop.index }}: {{ req.provider|upper if req.provider else 'DOCUMENT' }}

{% if req.provider == 'jira' %}
**🎫 Jira Ticket**: `{{ req.key }}`
{% if req.url %}**Link**: {{ req.url }}{% endif %}
{% elif req.provider == 'clickup' %}
**📋 ClickUp Task**: `{{ req.id }}`
{% if req.url %}**Link**: {{ req.url }}{% endif %}
{% else %}
**📄 Document**: `{{ req.file_name or 'Text Document' }}`
{% endif %}

{% if req.summary %}
#### Summary
{{ req.summary }}
{% endif %}

{% if req.description %}
#### Description
{{ req.description }}
{% endif %}

{% if req.acceptance_criteria and req.acceptance_criteria|length > 0 %}
#### ✅ Acceptance Criteria (MUST IMPLEMENT ALL)
{% for criterion in req.acceptance_criteria %}
{{ loop.index }}. {{ criterion }}
{% endfor %}

⚠️ **CRITICAL**: Every single acceptance criterion listed above MUST be fully implemented and verifiable. Do not skip any criterion.
{% endif %}

{% if req.priority %}
**Priority**: {{ req.priority }}
{% endif %}

{% if req.status %}
**Status**: {{ req.status }}
{% endif %}

{% if req.labels %}
**Labels**: {{ req.labels | join(', ') }}
{% endif %}

{% if req.type %}
**Type**: {{ req.type }}
{% endif %}

{% if req.content %}
<details>
<summary>📖 Full Requirement Content (Click to expand)</summary>

```
{{ req.content }}
```
</details>
{% endif %}

---
{% endfor %}
{% endif %}

---

## 🎯 Output Configuration

### Delivery Mode: **{{ output_config.type|upper if output_config and output_config.type else 'WORKSPACE' }}**

{% if output_config and output_config.type == "new_repo" %}
### 🆕 New GitHub Repository

You will create a **brand new GitHub repository** with the generated code.

**Repository Details**:
- **Name**: `{{ output_config.repo_name }}`
- **Description**: {{ output_config.description or 'AI-generated code from requirements' }}
- **Visibility**: {{ 'Private' if output_config.private else 'Public' }}
{% if output_config.license %}
- **License**: {{ output_config.license }}
{% endif %}

**Your Responsibilities**:
1. ✅ Generate complete project with proper structure
2. ✅ Include all configuration files (dependencies, Docker, CI/CD if requested)
3. ✅ Create comprehensive README with setup instructions
4. ✅ Add .env.example with all required environment variables
5. ✅ Include .gitignore appropriate for the tech stack
6. ✅ Add LICENSE file
7. ✅ Ensure project is immediately runnable after clone and setup
8. ✅ After generation, the system will:
   - Initialize git repository
   - Create GitHub repository via API
   - Push code to GitHub
   - Provide repository URL

{% elif output_config and output_config.type == "pull_request" %}
### 🔀 Pull Request to Existing Repository

You will make changes to an **existing codebase** and create a pull request.

**Target Repository**: {{ output_config.repo_url }}
**Base Branch**: {{ output_config.base_branch or 'main' }}
**PR Branch**: {{ output_config.branch_name or 'feature/ai-generated-changes' }}
{% if output_config.pr_title %}
**PR Title**: {{ output_config.pr_title }}
{% endif %}

**Your Responsibilities**:
1. ✅ The target repository has been cloned to your workspace
2. ✅ **Analyze the existing codebase first**:
   - Understand current architecture and patterns
   - Identify code style and conventions
   - Review existing folder structure
   - Check for existing tests and documentation
3. ✅ **Make targeted changes only**:
   - Modify only files necessary for the requirements
   - Follow existing code style and naming conventions
   - Maintain consistency with current architecture
   - Don't refactor unrelated code
4. ✅ **Update related components**:
   - Add/modify tests for changed functionality
   - Update documentation (README, API docs)
   - Update .env.example if new variables added
   - Add migration scripts if database schema changed
5. ✅ **Prepare for PR**:
   - Ensure all tests pass
   - Write clear commit messages (conventional commits)
   - Create detailed PR description
6. ✅ After generation, the system will:
   - Create feature branch
   - Commit changes
   - Push branch to GitHub
   - Create pull request
   - Provide PR URL

{% else %}
### 💾 Workspace Generation Only

You will generate code in the workspace directory: `{{ workspace_dir }}`

**Your Responsibilities**:
1. ✅ Generate complete project in the workspace
2. ✅ Include all necessary files
3. ✅ Provide clear instructions for manual git initialization if needed
4. ✅ Code will remain in workspace for user to review and use

{% endif %}

---

## 🛠️ Technology Stack

{% if output_config and output_config.tech_stack %}
### ⚙️ Required Technology Stack (MANDATORY)

You **MUST** use the following technologies. Do not substitute with alternatives.

- **Language**: {{ output_config.tech_stack.language }}
- **Framework**: {{ output_config.tech_stack.framework }}
{% if output_config.tech_stack.database %}
- **Database**: {{ output_config.tech_stack.database }}
{% endif %}
{% if output_config.tech_stack.version %}
- **Version Requirements**: {{ output_config.tech_stack.version }}
{% endif %}
{% if output_config.tech_stack.dependencies and output_config.tech_stack.dependencies|length > 0 %}
- **Required Dependencies**:
{% for dep in output_config.tech_stack.dependencies %}
  - {{ dep }}
{% endfor %}
{% endif %}

⚠️ **IMPORTANT**: Strictly adhere to this tech stack. If there are compatibility issues or concerns, raise them explicitly before proceeding.

{% else %}
### 🤔 Technology Stack Selection Required

No specific tech stack was provided. You must intelligently select the most appropriate technologies based on the requirements.

**Selection Process**:
1. **Analyze the requirements** to determine project type:
   - Web application (frontend + backend)?
   - REST/GraphQL API only?
   - Mobile application?
   - CLI tool?
   - Data processing/analytics?
   - Machine learning model?

2. **Choose appropriate technologies** based on:
   - Project type and complexity
   - Performance and scalability needs
   - Modern best practices
   - Strong community support
   - Well-maintained libraries

3. **Justify your selection** in the README

**Recommended Stacks by Project Type**:

| Project Type | Recommended Stack |
|--------------|-------------------|
| **Web App (Full-Stack)** | Next.js 14+ (React + TypeScript), FastAPI + React, T3 Stack |
| **REST API** | FastAPI (Python), NestJS (Node.js + TypeScript), Express.js |
| **GraphQL API** | Apollo Server + TypeScript, Hasura + PostgreSQL |
| **Mobile App** | React Native + Expo, Flutter |
| **Real-time App** | Node.js + Socket.io, Go + WebSockets |
| **Data Processing** | Python (Pandas + NumPy + Dask), Apache Spark |
| **ML/AI** | Python (TensorFlow/PyTorch + FastAPI) |
| **CLI Tool** | Python (Typer/Click), Go (Cobra), Node.js (Commander) |
| **Microservices** | Go, Rust, Node.js (NestJS), Python (FastAPI) |

**Database Selection Guidelines**:
- **Relational data, complex queries**: PostgreSQL
- **Document-oriented, flexible schema**: MongoDB
- **High-performance caching**: Redis
- **Time-series data**: InfluxDB, TimescaleDB
- **Graph relationships**: Neo4j

{% endif %}

---

## 📋 Generation Requirements

### 🎯 What You Must Generate

#### 1. **Complete Source Code**
- All application code organized by feature/layer
- Entry point file (main.py, index.js, App.tsx, etc.)
- Configuration management module
- Utility functions and helpers
- Data models, schemas, interfaces
- API routes/controllers (if applicable)
- Service layer with business logic
- Repository/data access layer (if database used)
- Middleware (auth, logging, error handling)

#### 2. **Comprehensive Test Suite**
{% if not options or not options.generate_tests or options.generate_tests %}
- ✅ **Unit Tests**: Test individual functions and methods
  - Target >80% code coverage
  - Test edge cases and boundary conditions
  - Test error scenarios
  - Use mocking for external dependencies
- ✅ **Integration Tests**: Test component interactions
  - API endpoint testing
  - Database integration tests
  - Service integration tests
- ✅ **Test Configuration**: Setup files, fixtures, mocks
- ✅ **Test Documentation**: How to run tests, interpret results

**Testing Framework Selection**:
- Python: `pytest`, `unittest`
- JavaScript/TypeScript: `Jest`, `Vitest`, `Mocha + Chai`
- Go: `testing` package
- Java: `JUnit`, `TestNG`

{% else %}
- ⏭️ **Tests Disabled**: Testing has been disabled for this generation. Include minimal test examples only.
{% endif %}

#### 3. **Configuration Files**
- **Dependencies**: package.json, requirements.txt, pyproject.toml, go.mod, pom.xml, etc.
- **Environment**: .env.example with all required variables (never .env with real secrets!)
- **Version Control**: .gitignore comprehensive for chosen tech stack
- **Editor Config**: .editorconfig for consistent formatting (optional)
- **Linting**: ESLint, Ruff, Flake8, golangci-lint config
- **Type Checking**: tsconfig.json, mypy.ini, etc.

#### 4. **Containerization** (if requested)
{% if options and options.include_docker %}
- ✅ **Dockerfile**: Optimized multi-stage build
- ✅ **docker-compose.yml**: Multi-service orchestration (app, database, redis, etc.)
- ✅ **.dockerignore**: Exclude unnecessary files
- ✅ **Docker Documentation**: How to build and run containers
{% else %}
- ⏭️ **Docker Disabled**: No containerization required
{% endif %}

#### 5. **CI/CD Pipeline** (if requested)
{% if options and options.include_ci_cd %}
- ✅ **GitHub Actions** (.github/workflows/ci.yml, cd.yml):
  - Lint and format check
  - Run test suite
  - Build application
  - Deploy (if configured)
- ✅ **Status Badges**: Add to README
- ✅ **Pipeline Documentation**: Explain workflow stages
{% else %}
- ⏭️ **CI/CD Disabled**: No pipeline configuration required
{% endif %}

#### 6. **Documentation**
{% if not options or not options.generate_docs or options.generate_docs %}
- ✅ **README.md**: Comprehensive project documentation
  - Project title and description
  - Features list
  - Tech stack used (with justification if you selected it)
  - Prerequisites (software versions, accounts, etc.)
  - Installation steps (detailed, step-by-step)
  - Configuration guide (environment variables explained)
  - Usage examples (code samples, API examples)
  - API documentation (endpoints, request/response examples)
  - Testing instructions
  - Deployment guide
  - Troubleshooting section
  - Contributing guidelines
  - License information
- ✅ **Inline Documentation**:
  - Docstrings/JSDoc for all public functions and classes
  - Type hints/annotations
  - Comments for complex logic
- ✅ **Additional Docs** (if complex project):
  - docs/architecture.md: System design overview
  - docs/api.md: Detailed API documentation
  - docs/deployment.md: Deployment instructions for different platforms
{% else %}
- ⏭️ **Documentation Simplified**: Create minimal README only
{% endif %}

#### 7. **Additional Files**
- **LICENSE**: MIT (default) or as specified in output_config
- **CONTRIBUTING.md**: Guidelines for contributors (optional)
- **.env.example**: Template for environment variables
- **CHANGELOG.md**: Version history (optional)

---

## 🏗️ Implementation Workflow

Follow this systematic approach:

### Phase 1: 🧠 Analysis & Planning (Critical Step)
1. **Understand Requirements Deeply**:
   - Read all requirement sources completely
   - List main features and functionality
   - Identify all acceptance criteria
   - Note constraints, performance requirements, integrations
   - Infer implicit requirements (auth, validation, error handling, logging)

2. **Design Architecture**:
   - Determine project type (web app, API, mobile, CLI, etc.)
   - Choose architecture pattern (layered, MVC, microservices, etc.)
   - Design folder structure
   - Identify core modules/components
   - Plan data models and relationships
   - Consider scalability and maintainability

3. **Confirm/Select Tech Stack**:
   - If specified, confirm compatibility
   - If not specified, select based on requirements and best practices
   - Identify all dependencies needed
   - Consider version compatibility

4. **Create Implementation Checklist**:
   - Break features into implementable tasks
   - Map tasks to acceptance criteria
   - Identify task dependencies

5. **Communicate Your Plan**:
   ```
   📋 Project Analysis:
   - Type: [Web App / API / Mobile / etc.]
   - Key Features: [List 3-5 main features]
   - Tech Stack: [Language + Framework + Database]
   - Architecture: [Pattern being used]

   🎯 Acceptance Criteria: [X criteria identified]
   ✅ All criteria will be implemented and verified

   🚀 Beginning implementation...
   ```

### Phase 2: ⚙️ Project Setup
1. Create folder structure
2. Initialize dependency management
3. Create configuration files
4. Set up .gitignore
5. Create .env.example

### Phase 3: ✍️ Core Implementation
1. **Implement systematically**:
   - Start with data models/schemas
   - Build service layer (business logic)
   - Implement API endpoints or UI components
   - Add authentication and authorization
   - Implement validation and error handling
   - Add logging

2. **Follow Best Practices**:
   - Write clean, readable code
   - Use proper naming conventions
   - Single Responsibility Principle
   - DRY (Don't Repeat Yourself)
   - Comprehensive error handling
   - Input validation for all user inputs
   - Security-first approach

3. **Security Checklist**:
   - ✅ No hardcoded secrets
   - ✅ Environment variables for config
   - ✅ Input validation and sanitization
   - ✅ Parameterized queries (no SQL injection)
   - ✅ Authentication implemented
   - ✅ Authorization checks
   - ✅ Password hashing (bcrypt/Argon2)
   - ✅ HTTPS/TLS in production
   - ✅ Rate limiting on APIs
   - ✅ Secure headers (CSP, X-Frame-Options)

### Phase 4: 🧪 Testing Implementation
{% if not options or not options.generate_tests or options.generate_tests %}
1. Write unit tests for all business logic
2. Write integration tests for APIs/services
3. Test edge cases and error scenarios
4. Aim for >80% code coverage
5. Ensure all tests pass
6. Document how to run tests
{% else %}
*Testing disabled - skip this phase*
{% endif %}

### Phase 5: 📚 Documentation
{% if not options or not options.generate_docs or options.generate_docs %}
1. Create comprehensive README.md
2. Add inline documentation (docstrings, comments)
3. Document API endpoints with examples
4. Create architecture overview (if complex)
5. Add troubleshooting guide
6. Include deployment instructions
{% else %}
*Create minimal README only*
{% endif %}

### Phase 6: ✅ Quality Assurance & Finalization
1. **Verify Implementation**:
   - ✅ All acceptance criteria met
   - ✅ Code follows language conventions
   - ✅ No hardcoded secrets
   - ✅ Comprehensive error handling
   - ✅ All tests pass (if enabled)
   - ✅ Documentation complete
   - ✅ Project runs successfully
   - ✅ No placeholder code

2. **Prepare Deliverables**:
{% if output_config and output_config.type == "new_repo" %}
   - Ensure all files in workspace
   - Verify .gitignore completeness
   - Check README accuracy
   - Ready for git initialization and GitHub push
{% elif output_config and output_config.type == "pull_request" %}
   - List modified files
   - Prepare PR description
   - Ensure no unnecessary changes
   - Verify backward compatibility
{% else %}
   - Confirm all files in workspace
   - Provide usage instructions
{% endif %}

3. **Final Summary**:
   ```
   ✅ Code Generation Complete!

   📦 Project: [Name]
   🛠️ Tech Stack: [Stack]
   📁 Files Generated: [Count]
   {% if not options or not options.generate_tests or options.generate_tests %}
   🧪 Tests: [Count] tests, [Coverage]% coverage
   {% endif %}

   🎯 Acceptance Criteria: [X/X] ✅ All implemented

   {% if output_config and output_config.type == "new_repo" %}
   🚀 Next: Creating GitHub repository...
   {% elif output_config and output_config.type == "pull_request" %}
   🚀 Next: Creating pull request...
   {% else %}
   📂 Location: {{ workspace_dir }}
   {% endif %}
   ```

---

## 🚨 Critical Requirements

### ❌ NEVER Do:
- Generate placeholder code (`// TODO: implement later`)
- Use dummy/fake data where real implementation needed
- Hardcode secrets, API keys, or credentials
- Create non-functional code
- Skip acceptance criteria
- Ignore error handling
- Skip input validation
- Leave console.log or debug statements in production code
- Copy code without understanding it

### ✅ ALWAYS Do:
- Implement ALL acceptance criteria
- Write production-ready, functional code
- Use environment variables for secrets
- Add comprehensive error handling
- Validate all user inputs
- Follow security best practices
- Write clean, maintainable code
- Add meaningful comments for complex logic
- Include proper documentation
- Test critical functionality
- Ask clarification questions if requirements are ambiguous

---

## 📊 Output Format

### After Implementation, Provide:

#### 1. Executive Summary
```
✅ Project: [Name]
🎯 Type: [Web App / API / Mobile / etc.]
🛠️ Tech Stack: [Language + Framework + Database]
📁 Total Files: [Count]
{% if not options or not options.generate_tests or options.generate_tests %}
🧪 Tests: [Count] tests, [Coverage]%
{% endif %}
✅ Status: Complete and ready for use
```

#### 2. File Structure
```
📂 project-name/
├── 📁 src/
│   ├── 📄 main.py - Application entry point
│   ├── 📁 api/
│   │   ├── 📄 routes.py - API endpoints
│   │   └── 📄 middleware.py - Auth, logging
│   ├── 📁 services/
│   │   └── 📄 user_service.py - Business logic
│   ├── 📁 models/
│   │   └── 📄 user.py - Data models
│   └── 📁 utils/
│       └── 📄 validators.py - Input validation
{% if not options or not options.generate_tests or options.generate_tests %}
├── 📁 tests/
│   ├── 📄 test_auth.py - Auth tests
│   └── 📄 test_users.py - User API tests
{% endif %}
├── 📄 README.md - Complete documentation
├── 📄 requirements.txt - Dependencies
├── 📄 .env.example - Environment template
├── 📄 .gitignore - Git ignore rules
└── 📄 LICENSE - MIT License
```

#### 3. Acceptance Criteria Verification
```
{% if requirements %}
{% for key, req in requirements.items() %}
{% if req.acceptance_criteria %}
Requirements from {{ key }}:
{% for criterion in req.acceptance_criteria %}
✅ Criterion {{ loop.index }}: {{ criterion }}
   - Implemented in: [File/module location]
   - Tested: [Test file if applicable]
{% endfor %}
{% endif %}
{% endfor %}
{% endif %}
```

#### 4. Setup Instructions
```bash
# Quick Start
git clone [repo-url]  # If applicable
cd project-name

# Install dependencies
[install commands based on tech stack]

# Configure environment
cp .env.example .env
# Edit .env with your values

# Run application
[run commands]

{% if not options or not options.generate_tests or options.generate_tests %}
# Run tests
[test commands]
{% endif %}
```

#### 5. Key Features Implemented
- ✅ Feature 1: [Description] - [Location]
- ✅ Feature 2: [Description] - [Location]
- ✅ Feature 3: [Description] - [Location]

{% if not output_config or not output_config.tech_stack %}
#### 6. Tech Stack Justification
- **Language**: [Chosen] - [Reason: performance, ecosystem, team familiarity]
- **Framework**: [Chosen] - [Reason: productivity, community support, features]
- **Database**: [Chosen] - [Reason: data structure, scalability, query needs]
- **Key Libraries**: [List] - [Reasons]
{% endif %}

#### 7. Next Steps
1. [First step for user to take]
2. [Second step]
3. [Deployment considerations]
4. [Monitoring/logging recommendations]

#### 8. Important Notes
- [Any assumptions made]
- [Known limitations]
- [Configuration tips]
- [Security reminders]

---

## 🎬 Begin Implementation

Before you start coding, **confirm your understanding** by briefly stating:

1. **Project Type**: What are you building? (e.g., "REST API for user management", "Full-stack e-commerce web app")
2. **Key Features**: What are the 3-5 main features to implement?
3. **Tech Stack**: What technologies will you use? (If specified, confirm; if not, state your selection)
4. **Delivery Mode**: How will the code be delivered? (New repo / PR / Workspace)
5. **Acceptance Criteria Count**: How many criteria must be implemented?

Example confirmation:
```
🎯 Understanding Confirmed:
1. Project: REST API for task management
2. Features:
   - User authentication (JWT)
   - CRUD operations for tasks
   - Task filtering and search
   - Role-based access control
3. Tech Stack: FastAPI + PostgreSQL + SQLAlchemy
4. Delivery: New GitHub repository "task-manager-api"
5. Acceptance Criteria: 8 criteria identified from Jira ticket

🚀 Proceeding with implementation...
```

**Once confirmed, begin systematic code generation following the phases above.**

Good luck! Build something exceptional. 🚀
