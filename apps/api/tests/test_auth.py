"""Tests for authentication endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.user import UserCRUD
from app.models.user import Provider


def get_test_user_crud(db_session: AsyncSession) -> UserCRUD:
    """Get a UserCRUD instance for testing."""
    return UserCRUD(session=db_session)


@pytest.mark.asyncio
async def test_register_user_success(
    async_client: AsyncClient, db_session: AsyncSession, override_get_async_session: None
) -> None:
    """Test successful user registration."""
    user_data = {"name": "Test User", "email": "test@example.com", "password": "securepassword123", "provider": "PASS"}

    response = await async_client.post("/api/v1/auth/register", json=user_data)

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == user_data["name"]
    assert data["email"] == user_data["email"]
    assert data["provider"] == user_data["provider"]
    assert "password" not in data
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_register_user_duplicate_email(
    async_client: AsyncClient, db_session: AsyncSession, override_get_async_session: None
) -> None:
    """Test registration with duplicate email."""
    # Create existing user using CRUD layer
    from app.schemas.auth import UserCreate

    user_crud = get_test_user_crud(db_session)
    user_data = UserCreate(
        name="Existing User",
        email="test@example.com",
        password="password123",
        provider=Provider.PASS,
    )
    await user_crud.create(user_crud.session, obj_in=user_data)

    # Try to register with same email
    duplicate_user_data = {
        "name": "New User",
        "email": "test@example.com",
        "password": "securepassword123",
        "provider": "PASS",
    }

    response = await async_client.post("/api/v1/auth/register", json=duplicate_user_data)

    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]


@pytest.mark.asyncio
async def test_register_user_invalid_data(async_client: AsyncClient, override_get_async_session: None) -> None:
    """Test registration with invalid data."""
    # Test with invalid email
    user_data = {"name": "Test User", "email": "invalid-email", "password": "securepassword123", "provider": "PASS"}
    response = await async_client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 422

    # Test with short password
    user_data = {"name": "Test User", "email": "test@example.com", "password": "123", "provider": "PASS"}
    response = await async_client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 422

    # Test with missing required fields
    user_data = {"name": "Test User", "email": "test@example.com"}
    response = await async_client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_success(
    async_client: AsyncClient, db_session: AsyncSession, override_get_async_session: None
) -> None:
    """Test successful user login."""
    # Create user using CRUD layer
    from app.schemas.auth import UserCreate

    user_crud = get_test_user_crud(db_session)
    user_data = UserCreate(
        name="Test User",
        email="test@example.com",
        password="securepassword123",
        provider=Provider.PASS,
    )
    await user_crud.create(user_crud.session, obj_in=user_data)

    login_data = {"email": "test@example.com", "password": "securepassword123"}

    response = await async_client.post("/api/v1/auth/login", json=login_data)

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] == 604800  # 7 days in seconds


@pytest.mark.asyncio
async def test_login_invalid_credentials(
    async_client: AsyncClient, db_session: AsyncSession, override_get_async_session: None
) -> None:
    """Test login with invalid credentials."""
    login_data = {"email": "nonexistent@example.com", "password": "wrongpassword"}

    response = await async_client.post("/api/v1/auth/login", json=login_data)

    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_inactive_user(
    async_client: AsyncClient, db_session: AsyncSession, override_get_async_session: None
) -> None:
    """Test login with inactive user."""
    # Create inactive user using CRUD layer
    from app.schemas.auth import UserCreate

    user_crud = get_test_user_crud(db_session)
    user_data = UserCreate(
        name="Inactive User",
        email="inactive@example.com",
        password="securepassword123",
        provider=Provider.PASS,
    )
    created_user = await user_crud.create(user_crud.session, obj_in=user_data)

    # Manually set user as inactive
    created_user.is_active = False
    await db_session.commit()

    login_data = {"email": "inactive@example.com", "password": "securepassword123"}
    response = await async_client.post("/api/v1/auth/login", json=login_data)

    assert response.status_code == 401  # FastAPI returns 401 for invalid credentials
    assert "Incorrect email or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_invalid_data(async_client: AsyncClient, override_get_async_session: None) -> None:
    """Test login with invalid data."""
    # Test with invalid email format
    login_data = {"email": "invalid-email", "password": "securepassword123"}
    response = await async_client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 422

    # Test with missing fields
    login_data = {"email": "test@example.com"}
    response = await async_client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_current_user_success(
    async_client: AsyncClient, db_session: AsyncSession, override_get_async_session: None
) -> None:
    """Test getting current user with valid token."""
    # Create user using CRUD layer
    from app.schemas.auth import UserCreate

    user_crud = get_test_user_crud(db_session)
    user_data = UserCreate(
        name="Test User",
        email="test@example.com",
        password="securepassword123",
        provider=Provider.PASS,
    )
    await user_crud.create(user_crud.session, obj_in=user_data)

    # Login to get token
    login_data = {"email": "test@example.com", "password": "securepassword123"}
    login_response = await async_client.post("/api/v1/auth/login", json=login_data)
    token = login_response.json()["access_token"]

    # Get current user
    headers = {"Authorization": f"Bearer {token}"}
    response = await async_client.get("/api/v1/auth/me", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test User"
    assert data["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_get_current_user_invalid_token(async_client: AsyncClient) -> None:
    """Test getting current user with invalid token."""
    headers = {"Authorization": "Bearer invalid_token"}
    response = await async_client.get("/api/v1/auth/me", headers=headers)

    assert response.status_code == 401
    assert "Could not validate credentials" in response.json()["detail"]


@pytest.mark.asyncio
async def test_get_current_user_no_token(async_client: AsyncClient) -> None:
    """Test getting current user without token."""
    response = await async_client.get("/api/v1/auth/me")

    assert response.status_code == 403
    assert "Not authenticated" in response.json()["detail"]
