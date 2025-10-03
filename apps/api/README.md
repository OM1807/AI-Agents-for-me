# SDLC Agents API

A powerful FastAPI backend for SDLC Agents with Claude Code SDK streaming, PostgreSQL database integration, and JWT authentication.

## Features

- **Streaming Code Assistance**: Real-time coding help and code generation
- **User Authentication**: JWT-based authentication with PostgreSQL
- **Database Integration**: SQLModel ORM with Alembic migrations
- **Modern API**: RESTful design with comprehensive documentation
- **Error Handling**: Graceful error recovery and helpful messages

## Tech Stack

- **FastAPI**: Modern, fast web framework
- **SQLModel**: SQL databases in Python, designed for simplicity and compatibility
- **PostgreSQL**: Robust, open-source database
- **Alembic**: Database migration tool
- **JWT**: JSON Web Token authentication
- **Pydantic**: Data validation using Python type annotations
- **Uvicorn**: ASGI server implementation

## Database Schema

The application includes a comprehensive database schema with multiple entities for AI agents, integrations, and user management. For the complete ER diagram and detailed schema information, see [DATABASE_MANAGEMENT.md](DATABASE_MANAGEMENT.md).

### Core Entities

- **Users**: User authentication and profile management
- **LLMProviderConfigs**: LLM provider configurations (Anthropic, OpenAI, etc.)
- **Integrations**: External service integrations (GitHub, etc.)
- **AIAgents**: AI agent definitions with workflows and prompts
- **UserAgentSessions**: User sessions with AI agents
- **PromptLibrary**: Reusable prompt templates

### Users Table
- `id`: Primary key (bigint)
- `name`: User's full name (varchar(255))
- `password`: Encrypted password (varchar(255))
- `provider`: Authentication provider (PASS/GITHUB/MICROSOFT)
- `email`: Unique email address (varchar(255))
- `is_active`: Account status (boolean)
- `created_at`: Record creation timestamp
- `updated_at`: Record last update timestamp

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Poetry (for dependency management)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sdlc-agents/apps/api
   ```

2. **Install dependencies**
   ```bash
   poetry install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start PostgreSQL database**
   ```bash
   # Using Docker Compose
   docker-compose up postgres -d

   # Or start PostgreSQL locally
   ```

5. **Initialize database**
   ```bash
   # Run the database initialization script
   python scripts/init_db.py

   # Or manually run migrations
   alembic upgrade head
   ```

6. **Start the application**
   ```bash
   # Using manage.py (recommended)
   poetry run python manage.py run --reload

   # Or using uvicorn directly
   poetry run uvicorn app.main:app --reload
   ```

## Environment Variables

Create a `.env` file in the `apps/api` directory:

```env
# Database Configuration
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/sdlc_agents
DATABASE_ECHO=false

# JWT Configuration
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Claude Configuration
CLAUDE_CODE_OAUTH_TOKEN=your-anthropic-api-key

# API Configuration
PROJECT_NAME=SDLC Agents API
VERSION=1.0.0
API_V1_STR=/api/v1
DEBUG=true
```

## API Endpoints

### Authentication Endpoints

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login and get JWT tokens
- `POST /api/v1/auth/refresh` - Refresh JWT access token
- `GET /api/v1/auth/me` - Get current user information

### Code Assistance Endpoints

- `POST /api/v1/claude-code/code-assistance` - Get streaming code assistance

## Orchestrator CLI (Local Testing)

A minimal CLI is available to run the Claude orchestrator directly for ad‑hoc testing without hitting the API.

Prerequisites:

- Set `CLAUDE_CODE_OAUTH_TOKEN` in your environment
- Activate your Python environment (Poetry or venv)

Basic usage (from repo root):

```bash
# Using Poetry (recommended)
cd apps/api
poetry run python app/run_orchestrator.py run -m "List files and suggest refactors"

# Or directly from repo root if your interpreter is set up
python apps/api/app/run_orchestrator.py run -m "List files and suggest refactors"
```

Common options:

- `-m, --message`: Inline user message
- `--message-file`: Read user message from a file
- `--stdin`: Read user message from stdin (end with Ctrl-D)
- `--system-prompt-file`: Path to a system prompt file (defaults to `apps/api/sample_rendered_system_prompt.md` if present)
- `--workspace-dir`: Working directory for tools (defaults to `AGENTS_DIR` or current directory)
- `--mcp-config`: Path to JSON file mapping MCP server names to configs
- `--resume-session-id`: Continue an existing Claude session id
- `--json`: Print raw JSON events instead of pretty text

Examples:

```bash
# Use a custom system prompt and workspace
python apps/api/app/run_orchestrator.py run -m "Analyze" \
  --system-prompt-file apps/api/sample_rendered_system_prompt.md \
  --workspace-dir /tmp/sdlc-agents-workspace

# Read prompt from a file
python apps/api/app/run_orchestrator.py run --message-file prompt.txt

# Provide MCP servers via JSON file
python apps/api/app/run_orchestrator.py run -m "Analyze" --mcp-config mcp.json
```

Minimal `mcp.json` example:

```json
{
  "atlassian": {
    "type": "sse",
    "url": "https://mcp.atlassian.com/v1/sse",
    "headers": { "Authorization": "Bearer YOUR_TOKEN" }
  },
  "notion": {
    "command": "npx",
    "args": ["-y", "@notionhq/notion-mcp-server"],
    "env": {
      "OPENAPI_MCP_HEADERS": "{\"Authorization\": \"Bearer YOUR_TOKEN\", \"Notion-Version\": \"2022-06-28\"}"
    }
  }
}
```

## Authentication Flow

1. **Register a new user**:
   ```bash
   curl -X POST "http://localhost:8000/api/v1/auth/register" \
        -H "Content-Type: application/json" \
        -d '{
          "name": "John Doe",
          "email": "john@example.com",
          "password": "securepassword123",
          "provider": "PASS"
        }'
   ```

2. **Login to get JWT tokens**:
   ```bash
   curl -X POST "http://localhost:8000/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
          "email": "john@example.com",
          "password": "securepassword123"
        }'
   ```

3. **Use the access token for authenticated requests**:
   ```bash
   curl -X GET "http://localhost:8000/api/v1/auth/me" \
        -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

## Application Management

We provide a comprehensive management system using `manage.py` for both application running and database operations.

### Application Commands

```bash
# Run the application (recommended)
poetry run python manage.py run

# Run with auto-reload for development
poetry run python manage.py run --reload

# Run on specific host and port
poetry run python manage.py run --host 127.0.0.1 --port 8080

# Run with multiple workers
poetry run python manage.py run --workers 4

# Run with debug logging
poetry run python manage.py run --log-level debug
```

### Database Migrations

We provide a comprehensive database management system using `manage.py`. For detailed documentation, see [DATABASE_MANAGEMENT.md](DATABASE_MANAGEMENT.md).

### Quick Start

```bash
# Initialize database (first time setup)
poetry run python manage.py init

# Check migration status
poetry run python manage.py check

# Create a new migration
poetry run python manage.py revision --message "Description of changes"

# Apply migrations
poetry run python manage.py upgrade

# Rollback migrations
poetry run python manage.py downgrade

# Show current revision
poetry run python manage.py current
```

### Advanced Commands

```bash
# Show migration history
poetry run python manage.py history

# Reset database (⚠️ destructive)
poetry run python manage.py reset

# Stamp database with revision
poetry run python manage.py stamp --revision abc123def456
```

For complete documentation and examples, see [DATABASE_MANAGEMENT.md](DATABASE_MANAGEMENT.md).

## Development

### Running Tests
```bash
poetry run pytest
```

### Code Formatting
```bash
poetry run black .
poetry run ruff check --fix .
```

### Type Checking
```bash
poetry run mypy .
```

## Docker Deployment

### Using Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

### Manual Docker Build
```bash
# Build the API image
docker build -t sdlc-agents-api .

# Run the container
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql+asyncpg://postgres:password@host.docker.internal:5432/sdlc_agents \
  -e SECRET_KEY=your-secret-key \
  sdlc-agents-api
```

## Project Structure

```
apps/api/
├── alembic/                 # Database migrations
├── app/
│   ├── api/                # API routes
│   │   └── v1/
│   │       ├── endpoints/  # Endpoint modules
│   │       └── api.py      # API router
│   ├── core/               # Core functionality
│   │   ├── auth.py         # Authentication utilities
│   │   ├── config.py       # Configuration settings
│   │   └── database.py     # Database connection
│   ├── models/             # SQLModel models
│   │   └── user.py         # User model
│   ├── schemas/            # Pydantic schemas
│   │   └── auth.py         # Authentication schemas
│   ├── services/           # Business logic
│   └── utils/              # Utility functions
├── scripts/                # Utility scripts
│   └── init_db.py          # Database initialization
├── tests/                  # Test files
├── alembic.ini            # Alembic configuration
├── pyproject.toml         # Project dependencies
└── README.md              # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.
