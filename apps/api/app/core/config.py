import json
from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Paths:
    ROOT_DIR = Path(__file__).resolve().parents[2]
    API_DIR = ROOT_DIR
    APP_DIR = ROOT_DIR / "app"


class Settings(BaseSettings):
    """Application settings and configuration"""

    # API Configuration
    PROJECT_NAME: str = Field(default="SDLC Agents API", description="Project name")
    VERSION: str = Field(default="1.0.0", description="API version")
    API_V1_STR: str = Field(default="/api/v1", description="API v1 prefix")

    # CORS Configuration
    BACKEND_CORS_ORIGINS: str = Field(default="*", description="Allowed CORS origins (comma-separated)")

    def get_cors_origins(self) -> list[str]:
        """Get parsed CORS origins as list"""
        if not self.BACKEND_CORS_ORIGINS:
            return []

        # Handle wildcard case
        if self.BACKEND_CORS_ORIGINS.strip() == "*":
            return ["*"]

        if self.BACKEND_CORS_ORIGINS.startswith("[") and self.BACKEND_CORS_ORIGINS.endswith("]"):
            try:
                parsed = json.loads(self.BACKEND_CORS_ORIGINS)
                if isinstance(parsed, list) and all(isinstance(item, str) for item in parsed):
                    return parsed
                return []
            except (json.JSONDecodeError, ValueError):
                return []
        return [i.strip() for i in self.BACKEND_CORS_ORIGINS.split(",") if i.strip()]

    # Database Configuration
    DATABASE_URL: str = Field(description="Database connection URL")
    DATABASE_ECHO: bool = Field(default=True, description="Echo SQL queries for debugging")

    # Database Pool Configuration
    DB_POOL_SIZE: int = Field(default=20, description="Database connection pool size")
    DB_MAX_OVERFLOW: int = Field(default=40, description="Database connection pool max overflow")
    DB_POOL_TIMEOUT: int = Field(default=30, description="Database connection pool timeout in seconds")
    DB_POOL_RECYCLE: int = Field(default=1800, description="Database connection pool recycle time in seconds")

    # JWT Configuration
    SECRET_KEY: str = Field(description="Secret key for JWT token generation")
    ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, description="Access token expiration in minutes")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, description="Refresh token expiration in days")

    # Claude Code SDK Configuration
    CLAUDE_PERMISSION_MODE: str = Field(default="bypassPermissions", description="Claude SDK permission mode")
    CLAUDE_REQUEST_TIMEOUT: int = Field(default=300, description="Claude request timeout in seconds")
    ANTHROPIC_API_KEY: str = Field(default="", description="Anthropic API key")

    # Environment Configuration
    ENVIRONMENT: str = Field(default="development", description="Environment name")
    DEBUG: bool = Field(default=True, description="Debug mode")
    LOG_LEVEL: str = Field(default="DEBUG", description="Logging level")

    # Railway Configuration
    PORT: int = Field(default=8000, description="Server port")

    # Security Configuration
    MAX_REQUEST_SIZE: int = Field(default=10 * 1024 * 1024, description="Maximum request size in bytes")  # 10MB

    # Documentation Configuration
    ENABLE_DOCS: bool = Field(default=True, description="Enable API documentation")
    ENABLE_REDOC: bool = Field(default=True, description="Enable ReDoc documentation")

    # Agents/Workspace Configuration
    AGENTS_DIR: str | None = Field(default=None, description="Root directory for per-session agent workspaces")

    model_config = SettingsConfigDict(
        env_file=str(Paths.ROOT_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # Changed from "forbid" to "ignore" to handle extra env vars
    )


@lru_cache
def get_settings() -> Settings:
    """Get the application settings"""
    return Settings()  # type: ignore
