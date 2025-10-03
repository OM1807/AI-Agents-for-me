FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install Node.js, npm, make, and the Claude Code CLI
RUN apt-get update && \
    apt-get install -y --no-install-recommends nodejs npm curl make git && \
    npm install -g @anthropic-ai/claude-code && \
    rm -rf /var/lib/apt/lists/*

# Install Playwright MCP and Firefox browser
RUN npm install -g @playwright/test @playwright/mcp && \
    npx playwright install firefox && \
    npx playwright install-deps firefox

# Install Poetry
RUN pip install poetry==2.1.3

# Install uv as appuser
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
COPY --from=docker.io/astral/uv:latest /uv /uvx /bin/

# Add appuser's bin to PATH
ENV PATH="/home/appuser/.local/bin:$PATH"

# Configure Poetry: Don't create virtual environment, install dependencies to system python
ENV POETRY_CACHE_DIR=/tmp/poetry_cache
RUN poetry config virtualenvs.create false

# Copy Poetry configuration files
COPY pyproject.toml poetry.lock* ./

# Install dependencies
RUN poetry install --only=main --no-root && rm -rf $POETRY_CACHE_DIR

# Copy application code
COPY . .

# Install the application
RUN poetry install --only-root

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Set the entrypoint and command to use deployment Makefile
ENTRYPOINT ["make", "-s", "-f", "deployment/Makefile"]
CMD ["run-prod-server"]
