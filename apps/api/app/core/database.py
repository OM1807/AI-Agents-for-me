"""Database connection and session management."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

MODEL_PATHS = ["app.models"]

# Global variables to hold engine instances
engine: AsyncEngine | None = None


def get_engine() -> AsyncEngine:
    """Get or create the database engine with optimized connection pooling."""
    global engine
    if engine is None:
        settings = get_settings()
        engine = create_async_engine(
            settings.DATABASE_URL,
            echo=settings.DATABASE_ECHO,
            pool_pre_ping=True,
            pool_recycle=settings.DB_POOL_RECYCLE,
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_MAX_OVERFLOW,
            pool_timeout=settings.DB_POOL_TIMEOUT,
            pool_reset_on_return="commit",
        )
    return engine


@asynccontextmanager
async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Async context manager that yields a database AsyncSession."""
    async_session_factory = async_sessionmaker(
        get_engine(),
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
        autocommit=False,
    )
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to get database session.

    Returns:
        AsyncGenerator[AsyncSession, None]: Database session generator
    """
    async with get_async_session() as session:
        yield session


async def close_db_connection() -> None:
    """Close database connections."""
    if engine is not None:
        await engine.dispose()
