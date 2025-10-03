import asyncio
import os
from collections.abc import AsyncGenerator, Generator
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

# Set environment variable before importing app
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"

from app.core.database import get_db_session  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture
def client() -> TestClient:
    """Test client fixture"""
    return TestClient(app)


@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Async test client fixture"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Database session fixture for testing."""
    # Create test database engine using SQLite for testing
    test_database_url = "sqlite+aiosqlite:///:memory:"
    test_engine = create_async_engine(
        test_database_url,
        echo=False,
        future=True,
    )

    # Create test session factory
    TestingSessionLocal = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    # Create tables
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    # Create session
    async with TestingSessionLocal() as session:
        yield session

    # Clean up
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)

    await test_engine.dispose()


@pytest.fixture
def override_get_async_session(db_session: AsyncSession) -> Generator[None, None, None]:
    """Override database session dependency for testing."""

    async def _override_get_db_session() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db_session] = _override_get_db_session
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def mock_claude_response() -> MagicMock:
    """Mock Claude API response fixture"""
    mock_response = MagicMock()
    mock_response.content = [
        MagicMock(
            text="Here's a binary search implementation:\n\n```python\ndef binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    # ... implementation\n```"
        )
    ]
    return mock_response


@pytest.fixture
def mock_text_block() -> MagicMock:
    """Mock TextBlock for testing"""
    block = MagicMock()
    block.text = "Test response content"
    return block


@pytest.fixture(autouse=True)
def mock_claude_sdk() -> Generator[None, None, None]:
    """Auto-use fixture to mock Claude SDK globally"""
    with patch("app.services.claude_service.query") as mock_query:

        async def mock_async_generator() -> AsyncGenerator[MagicMock, None]:
            # System message
            mock_system = MagicMock()
            mock_system.__class__.__name__ = "SystemMessage"
            yield mock_system

            # Assistant message with code
            mock_assistant = MagicMock()
            mock_assistant.__class__.__name__ = "AssistantMessage"
            mock_assistant.content = [MagicMock(text="Here's your code assistance response.")]
            yield mock_assistant

        mock_query.return_value = mock_async_generator()
        yield


@pytest.fixture
def mock_settings() -> Generator[MagicMock, None, None]:
    """Mock settings fixture"""
    with patch("app.core.config.get_settings") as mock_get_settings:
        mock_settings_obj = MagicMock()
        mock_settings_obj.DATABASE_URL = "sqlite+aiosqlite:///:memory:"
        mock_settings_obj.CLAUDE_PERMISSION_MODE = "bypassPermissions"
        mock_settings_obj.CLAUDE_REQUEST_TIMEOUT = 300
        mock_settings_obj.SECRET_KEY = "test-secret-key"
        mock_settings_obj.ALGORITHM = "HS256"
        mock_settings_obj.ACCESS_TOKEN_EXPIRE_MINUTES = 30
        mock_settings_obj.REFRESH_TOKEN_EXPIRE_DAYS = 7
        mock_get_settings.return_value = mock_settings_obj
        yield mock_settings_obj


# Configure pytest for async tests
@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()
