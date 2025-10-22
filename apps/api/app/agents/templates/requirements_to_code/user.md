# Code Generation Task

You are about to generate production-ready code based on provided requirements. Read all sections carefully before beginning.

---

## 📋 Requirements Sources

{% for key, req in requirements.items() %}
### Requirement {{ loop.index }}

**Source**: {{ req.provider if req.provider else 'Document/Text' }}
{% if req.key %}
**Ticket ID**: {{ req.key }}
{% endif %}
{% if req.url %}
**URL**: {{ req.url }}
{% endif %}

{% if req.summary %}
#### Summary
{{ req.summary }}
{% endif %}

{% if req.description %}
#### Description
{{ req.description }}
{% endif %}

{% if req.acceptance_criteria %}
#### Acceptance Criteria
{% for criterion in req.acceptance_criteria %}
{{ loop.index }}. {{ criterion }}
{% endfor %}

**CRITICAL**: All acceptance criteria above MUST be implemented and verified. Do not skip any criterion.
{% endif %}

{% if req.priority %}
**Priority**: {{ req.priority }}
{% endif %}

{% if req.labels %}
**Labels**: {{ req.labels | join(', ') }}
{% endif %}

{% if req.content %}
#### Full Content
```
{{ req.content }}
```
{% endif %}

{% if req.attachments %}
#### Attachments
{% for attachment in req.attachments %}
- {{ attachment }}
{% endfor %}
{% endif %}

---
{% endfor %}

## 🎯 Output Configuration

### Mode
**{{ output_config.type | upper }}**

{% if output_config.type == "new_repo" %}
### New Repository Details
- **Repository Name**: `{{ output_config.repo_name }}`
- **Platform**: GitHub
- **Visibility**: {{ output_config.visibility or 'Public' }}
{% if output_config.description %}
- **Description**: {{ output_config.description }}
{% endif %}

**Your Task**:
1. Generate a complete project with proper structure
2. Include all configuration and setup files
3. Prepare repository for GitHub creation
4. Ensure project is immediately runnable after clone

{% elif output_config.type == "pull_request" %}
### Pull Request Details
- **Target Repository**: {{ output_config.repo_url }}
- **Base Branch**: {{ output_config.base_branch or 'main' }}
- **PR Branch**: {{ output_config.pr_branch or 'feature/auto-generated-changes' }}
{% if output_config.target_issue %}
- **Related Issue**: #{{ output_config.target_issue }}
{% endif %}

**Your Task**:
1. Analyze the existing repository structure and code style
2. Make only the necessary changes to fulfill requirements
3. Follow existing conventions and patterns
4. Update tests and documentation
5. Prepare a comprehensive PR description

{% elif output_config.type == "local_files" %}
### Local Files Output
- **Output Directory**: `{{ output_config.output_dir or './generated-code' }}`

**Your Task**:
1. Generate all code files in the specified directory
2. Create proper project structure
3. Include README with setup instructions
4. Output is ready for manual git initialization

{% endif %}

---

## 🛠️ Technology Stack

{% if output_config.tech_stack %}
### Specified Tech Stack (MUST USE)
- **Language**: {{ output_config.tech_stack.language }}
- **Framework**: {{ output_config.tech_stack.framework }}
{% if output_config.tech_stack.database %}
- **Database**: {{ output_config.tech_stack.database }}
{% endif %}
{% if output_config.tech_stack.dependencies %}
- **Required Dependencies**:
{% for dep in output_config.tech_stack.dependencies %}
  - {{ dep }}
{% endfor %}
{% endif %}
{% if output_config.tech_stack.version %}
- **Version Requirements**: {{ output_config.tech_stack.version }}
{% endif %}

⚠️ **IMPORTANT**: You MUST use the specified tech stack above. Do not substitute with alternatives.

{% else %}
### Tech Stack Selection Required
**No tech stack specified. You must:**
1. Analyze the requirements carefully
2. Select the most appropriate technologies based on:
   - Project type (web app, API, mobile, data processing, etc.)
   - Scalability needs
   - Performance requirements
   - Complexity level
3. Justify your selection in the README
4. Consider popular, well-maintained options with good community support

**Suggested Options by Project Type**:
- **Web Frontend**: React + TypeScript, Next.js, Vue 3, Svelte
- **Backend API**: FastAPI (Python), Express.js (Node), NestJS, Spring Boot
- **Full-Stack**: Next.js, Nuxt, SvelteKit, Django
- **Mobile**: React Native, Flutter
- **Data Processing**: Python (Pandas + NumPy), Apache Spark
- **Machine Learning**: Python (TensorFlow/PyTorch/scikit-learn)
- **CLI Tool**: Python (Click/Typer), Node.js (Commander), Go

{% endif %}

---

## ⚙️ Generation Options

**Generate Tests**: {{ options.generate_tests if options and options.generate_tests is defined else 'Yes' }}
{% if not options or options.generate_tests != false %}
- Create comprehensive unit tests
- Aim for >80% code coverage
- Include integration tests where appropriate
- Use appropriate testing framework for chosen stack
- Test both success and failure scenarios
- Include edge cases and boundary conditions
{% endif %}

**Generate Documentation**: {{ options.generate_docs if options and options.generate_docs is defined else 'Yes' }}
{% if not options or options.generate_docs != false %}
- Create detailed README.md with:
  - Project description and purpose
  - Prerequisites and dependencies
  - Installation instructions
  - Configuration guide
  - Usage examples
  - API documentation (if applicable)
  - Architecture overview
  - Contributing guidelines
  - License information
- Add inline code documentation (docstrings, comments)
- Include JSDoc/Sphinx/Javadoc as appropriate
{% endif %}

**Include CI/CD**: {{ options.include_ci_cd if options and options.include_ci_cd else 'No' }}
{% if options and options.include_ci_cd %}
- Set up GitHub Actions workflow or GitLab CI
- Include stages: lint, test, build, deploy
- Add status badges to README
- Configure automated deployment (if applicable)
{% endif %}

**Docker Support**: {{ options.include_docker if options and options.include_docker else 'No' }}
{% if options and options.include_docker %}
- Create Dockerfile for containerization
- Add docker-compose.yml for multi-service setup
- Include .dockerignore
- Add Docker instructions to README
{% endif %}

---

## 📝 Execution Instructions

Follow this workflow strictly:

### Phase 1: Analysis & Planning (5 minutes)
1. **Read all requirements thoroughly**
   - Identify main features and functionality
   - List all acceptance criteria
   - Note any constraints or special requirements
   - Identify implicit requirements (auth, validation, error handling)

2. **Plan the architecture**
   - Determine project type and appropriate patterns
   - Design folder structure
   - Identify core components/modules
   - Plan data models and relationships
   - Consider scalability and maintainability

3. **Select or confirm tech stack**
   - Verify specified stack or choose appropriate one
   - Identify all required dependencies
   - Consider compatibility and version requirements

4. **Create implementation checklist**
   - Break down features into implementable tasks
   - Map tasks to acceptance criteria
   - Identify dependencies between tasks

### Phase 2: Project Setup (5 minutes)
1. **Create project structure**
   - Set up folder hierarchy
   - Create configuration files
   - Initialize dependency management
   - Set up .gitignore

2. **Configure environment**
   - Create .env.example with all variables
   - Document environment requirements
   - Set up configuration loading

### Phase 3: Core Implementation (30-45 minutes)
1. **Implement features systematically**
   - Start with data models/schemas
   - Build core business logic
   - Implement API endpoints or UI components
   - Add authentication and authorization
   - Implement validation and error handling
   - Add logging and monitoring hooks

2. **Follow best practices**
   - Write clean, readable code
   - Use proper naming conventions
   - Add error handling for all operations
   - Implement input validation
   - Use dependency injection where appropriate
   - Follow SOLID principles

3. **Security considerations**
   - Never hardcode secrets
   - Implement proper authentication
   - Validate and sanitize all inputs
   - Use parameterized queries
   - Implement CORS properly
   - Add rate limiting for APIs

### Phase 4: Testing (15-20 minutes)
{% if not options or options.generate_tests != false %}
1. **Write unit tests**
   - Test each function/method
   - Cover edge cases and boundary conditions
   - Test error scenarios
   - Aim for >80% coverage

2. **Write integration tests**
   - Test API endpoints
   - Test database operations
   - Test service integrations

3. **Add test documentation**
   - Explain how to run tests
   - Document test coverage
   - List any test dependencies
{% else %}
*Testing disabled - Skip this phase*
{% endif %}

### Phase 5: Documentation (10-15 minutes)
{% if not options or options.generate_docs != false %}
1. **Create README.md**
   - Write clear project description
   - List all features
   - Provide step-by-step setup instructions
   - Include usage examples
   - Document API endpoints (if applicable)
   - Add troubleshooting section

2. **Add inline documentation**
   - Docstrings for all public functions/classes
   - Comments for complex logic
   - Type hints/annotations

3. **Create additional docs**
   - API documentation
   - Architecture diagrams (if complex)
   - Contributing guidelines
{% else %}
*Documentation disabled - Create minimal README only*
{% endif %}

### Phase 6: Finalization (5 minutes)
1. **Quality check**
   - Verify all acceptance criteria are met
   - Check code formatting and consistency
   - Ensure no hardcoded secrets
   - Validate all imports and dependencies
   - Test that project runs successfully

2. **Prepare for delivery**
{% if output_config.type == "new_repo" %}
   - Ensure all files are in place
   - Verify .gitignore is complete
   - Check README accuracy
   - Prepare repository description
{% elif output_config.type == "pull_request" %}
   - List all modified files
   - Create PR description
   - Ensure no unnecessary changes
   - Verify backward compatibility
{% endif %}

3. **Generate summary report**
   - List all created files
   - Confirm acceptance criteria completion
   - Provide next steps
   - Note any assumptions or decisions

---

## ✅ Quality Checklist

Before marking the task complete, verify:

### Functionality
- [ ] All acceptance criteria are fully implemented
- [ ] All features work as specified
- [ ] Error handling is comprehensive
- [ ] Edge cases are handled
- [ ] No placeholder or dummy code

### Code Quality
- [ ] Code follows language-specific conventions
- [ ] Functions are small and focused
- [ ] No code duplication (DRY principle)
- [ ] Variable and function names are clear and descriptive
- [ ] Complex logic is commented
- [ ] No console.log or debug statements in production code

### Security
- [ ] No hardcoded secrets, API keys, or passwords
- [ ] All user inputs are validated and sanitized
- [ ] Authentication and authorization implemented correctly
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection in place
- [ ] Environment variables used for configuration

### Testing
{% if not options or options.generate_tests != false %}
- [ ] Unit tests cover critical functionality
- [ ] Integration tests for key workflows
- [ ] Tests pass successfully
- [ ] Code coverage >80%
- [ ] Edge cases are tested
{% else %}
- [ ] Testing disabled - skipped
{% endif %}

### Documentation
{% if not options or options.generate_docs != false %}
- [ ] README.md is complete and accurate
- [ ] Setup instructions are clear and tested
- [ ] Usage examples are provided
- [ ] All public APIs are documented
- [ ] Inline documentation is adequate
{% else %}
- [ ] Minimal README created
{% endif %}

### Project Structure
- [ ] Logical folder organization
- [ ] Proper separation of concerns
- [ ] Configuration files present and correct
- [ ] .gitignore is appropriate for tech stack
- [ ] Dependencies are properly declared

### Deliverables
{% if output_config.type == "new_repo" %}
- [ ] Complete project structure
- [ ] All configuration files
- [ ] README with setup instructions
- [ ] LICENSE file
- [ ] .env.example
{% elif output_config.type == "pull_request" %}
- [ ] Only necessary files modified
- [ ] Existing code style followed
- [ ] Tests updated
- [ ] Documentation updated
- [ ] PR description prepared
{% endif %}

---

## 🚀 Deliverables

You must generate:

### Required Files
1. **Source Code**
   - All application code organized by feature/layer
   - Entry point file (main.py, index.js, App.js, etc.)
   - Configuration modules
   - Utility functions
   - Data models/schemas

2. **Configuration Files**
{% if output_config.tech_stack %}
   {% if output_config.tech_stack.language == "Python" %}
   - requirements.txt or pyproject.toml
   - setup.py (if creating a package)
   {% elif output_config.tech_stack.language in ["JavaScript", "TypeScript"] %}
   - package.json
   - tsconfig.json (if TypeScript)
   {% elif output_config.tech_stack.language == "Java" %}
   - pom.xml or build.gradle
   {% endif %}
{% else %}
   - Dependency management file for chosen stack
{% endif %}
   - .env.example with all required environment variables
   - .gitignore appropriate for the tech stack
   - Configuration files (config.py, appsettings.json, etc.)

3. **Documentation**
   - README.md with:
     - Project title and description
     - Features list
     - Tech stack used
     - Prerequisites
     - Installation steps
     - Configuration instructions
     - Usage examples
     - API documentation (if applicable)
     - Testing instructions
     - Deployment guide
     - License information
     - Contributing guidelines
{% if options and options.include_docker %}
   - Docker setup instructions
{% endif %}

{% if not options or options.generate_tests != false %}
4. **Test Suite**
   - Unit tests for core logic
   - Integration tests for APIs/services
   - Test fixtures and mocks
   - Test configuration
   - Instructions for running tests
{% endif %}

{% if options and options.include_ci_cd %}
5. **CI/CD Pipeline**
   - .github/workflows/*.yml or .gitlab-ci.yml
   - Build and test stages
   - Deployment configuration
   - Status badges
{% endif %}

{% if options and options.include_docker %}
6. **Docker Configuration**
   - Dockerfile
   - docker-compose.yml
   - .dockerignore
{% endif %}

7. **Additional Files**
   - LICENSE (MIT by default)
{% if output_config.type == "pull_request" %}
   - PR description (summary, changes, testing, breaking changes)
{% endif %}

---

## 📊 Final Output Format

After completing code generation, provide a structured summary:

### 1. Executive Summary
```
Project: [Name]
Type: [Web App / API / CLI Tool / Mobile App / etc.]
Tech Stack: [Language + Framework + Database]
Status: ✅ Complete
```

### 2. Generated Components
List all created files with brief descriptions:
```
src/
├── main.py - Application entry point
├── models/
│   └── user.py - User data model
├── services/
│   └── auth_service.py - Authentication logic
└── utils/
    └── validators.py - Input validation functions
tests/
├── test_auth.py - Authentication tests
└── test_validators.py - Validation tests
README.md - Complete documentation
requirements.txt - Python dependencies
.env.example - Environment variables template
```

### 3. Acceptance Criteria Verification
For each criterion, confirm completion:
```
✅ Criterion 1: [Description] - Implemented in [file/module]
✅ Criterion 2: [Description] - Implemented in [file/module]
✅ Criterion 3: [Description] - Implemented in [file/module]
```

### 4. Key Features Implemented
- Feature 1: [Description and location]
- Feature 2: [Description and location]
- Feature 3: [Description and location]

### 5. Tech Stack Justification
{% if not output_config.tech_stack %}
Explain why you chose the specific technologies:
- Language: [Reason]
- Framework: [Reason]
- Database: [Reason]
- Key Libraries: [Reasons]
{% endif %}

### 6. Setup Instructions
```bash
# Quick start commands
git clone [if applicable]
cd project-name
[installation commands]
[configuration steps]
[run commands]
```

### 7. Testing Results
{% if not options or options.generate_tests != false %}
```
Total Tests: [number]
Passed: [number]
Coverage: [percentage]
```
{% endif %}

### 8. Next Steps & Recommendations
- Immediate next steps for deployment
- Suggested improvements or enhancements
- Production considerations
- Monitoring and logging setup

### 9. Important Notes
- Any assumptions made
- Known limitations
- Configuration requirements
- Security considerations

---

## ⚠️ Critical Requirements

### Do NOT:
- ❌ Generate placeholder code (`// TODO: implement`)
- ❌ Use dummy data where real implementation is needed
- ❌ Hardcode secrets, API keys, or credentials
- ❌ Skip acceptance criteria
- ❌ Create non-functional code
- ❌ Copy code without understanding it
- ❌ Ignore error handling
- ❌ Skip input validation
- ❌ Generate inconsistent code styles

### DO:
- ✅ Ask clarifying questions if requirements are ambiguous
- ✅ Implement all acceptance criteria
- ✅ Write production-ready, functional code
- ✅ Follow security best practices
- ✅ Add comprehensive error handling
- ✅ Validate all inputs
- ✅ Use environment variables for configuration
- ✅ Follow language-specific conventions
- ✅ Write clear, maintainable code
- ✅ Test your understanding of requirements

---

## 🎯 Success Criteria

This task is considered successful when:

1. ✅ All acceptance criteria are fully implemented and verified
2. ✅ Code is production-ready (no placeholders or TODOs)
3. ✅ Project runs without errors after following setup instructions
4. ✅ All tests pass (if testing enabled)
5. ✅ Documentation is complete and accurate
6. ✅ Security best practices are followed
7. ✅ Code follows clean code principles
8. ✅ No hardcoded secrets or credentials
9. ✅ Proper error handling throughout
10. ✅ Repository/PR is ready for immediate use

---

## 🎬 Begin Code Generation

You may now begin the code generation process. Follow the phases outlined above and provide status updates as you progress through each phase.

**Start by confirming your understanding**:
1. What type of project are you building?
2. What are the key features to implement?
3. What tech stack will you use?
4. What is the delivery mode (new repo / PR / local files)?

Then proceed with implementation.
