from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.core.config import get_settings
from app.core.database import close_db_connection
from app.utils import configure_logging, get_logger

logger = get_logger(__name__)


def get_application() -> FastAPI:
    """Get the FastAPI application"""
    # Initialize logging first
    configure_logging()

    settings = get_settings()
    logger.info(f"Initializing {settings.PROJECT_NAME} v{settings.VERSION}")

    _app = FastAPI(
        title=settings.PROJECT_NAME,
        description="""
## SDLC Agents - Claude Code Wrapper API

A powerful FastAPI wrapper around Claude Code SDK providing:

- **Streaming Code Assistance**: Real-time coding help and code generation
- **Context-Aware Responses**: Intelligent understanding of your coding context
- **Session Management**: Track related coding requests
- **Error Handling**: Graceful error recovery and helpful messages
- **Modern API**: RESTful design with comprehensive documentation
- **User Authentication**: JWT-based authentication with PostgreSQL
- **Database Integration**: SQLModel ORM with Alembic migrations

Send a POST request to `/api/v1/claude-code/code-assistance` with your coding question.

The API will stream back real-time responses with code, explanations, and suggestions.
        """,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.ENABLE_DOCS else None,
        docs_url="/docs" if settings.ENABLE_DOCS else None,
        redoc_url="/redoc" if settings.ENABLE_REDOC else None,
    )

    # CORS middleware configuration
    _app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.get_cors_origins() or ["*"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # Include API router
    _app.include_router(api_router, prefix=settings.API_V1_STR)

    @_app.on_event("startup")
    async def startup_event() -> None:
        """Application startup event handler"""
        logger.info("Starting up application...")
        # We need to initialize the agents workflows here
        from app.agents import workflows  # noqa: F401

    @_app.on_event("shutdown")
    async def shutdown_event() -> None:
        """Application shutdown event handler"""
        logger.info("Shutting down application...")
        try:
            # Close database connections
            await close_db_connection()
            logger.info("Database connections closed successfully")
        except Exception as e:
            logger.error(f"Failed to close database connections: {e}")

    @_app.get("/")
    async def root() -> dict[str, Any]:
        """Welcome endpoint with API information"""
        return {
            "message": f"Welcome to {settings.PROJECT_NAME}",
            "description": "Claude Code SDK Wrapper API for intelligent coding assistance",
            "version": settings.VERSION,
            "docs": "/docs" if settings.ENABLE_DOCS else None,
            "redoc": "/redoc" if settings.ENABLE_REDOC else None,
            "health": "/health",
            "environment": settings.ENVIRONMENT,
        }

    @_app.get("/health")
    async def health_check() -> dict[str, Any]:
        """Global health check endpoint"""
        return {
            "status": "healthy",
            "version": settings.VERSION,
            "service": "Claude Code Wrapper API",
            "environment": settings.ENVIRONMENT,
            "debug_mode": settings.DEBUG,
        }

    return _app


app = get_application()

if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(app, host="0.0.0.0", port=settings.PORT)
