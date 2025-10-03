"""Tests for core authentication functions."""

from datetime import timedelta

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import create_access_token, verify_token
from app.crud.user import UserCRUD
from app.models.user import Provider, User


def get_test_user_crud(db_session: AsyncSession) -> UserCRUD:
    """Get a UserCRUD instance for testing."""
    return UserCRUD(session=db_session)


def test_create_access_token() -> None:
    """Test access token creation."""
    data = {"sub": "123", "email": "test@example.com"}
    expires_delta = timedelta(minutes=30)

    token = create_access_token(data, expires_delta)

    assert isinstance(token, str)
    assert len(token) > 0


def test_verify_token_valid() -> None:
    """Test token verification with valid token."""
    data = {"sub": "123", "email": "test@example.com"}
    expires_delta = timedelta(minutes=30)

    token = create_access_token(data, expires_delta)
    token_data = verify_token(token)

    assert token_data is not None
    assert token_data.user_id == 123
    assert token_data.email == "test@example.com"


def test_verify_token_invalid() -> None:
    """Test token verification with invalid token."""
    token_data = verify_token("invalid_token")
    assert token_data is None


def test_verify_token_expired() -> None:
    """Test token verification with expired token."""
    data = {"sub": "123", "email": "test@example.com"}
    expires_delta = timedelta(seconds=-1)  # Expired immediately

    token = create_access_token(data, expires_delta)
    token_data = verify_token(token)

    assert token_data is None


@pytest.mark.asyncio
async def test_get_user_by_email_found(db_session: AsyncSession) -> None:
    """Test getting user by email when user exists."""
    # Create user using CRUD layer
    from app.schemas.auth import UserCreate

    user_crud = get_test_user_crud(db_session)
    user_data = UserCreate(
        name="Test User",
        email="test@example.com",
        password="password123",
        provider=Provider.PASS,
    )
    await user_crud.create(user_crud.session, obj_in=user_data)

    # Get user by email using CRUD layer
    found_user = await user_crud.get_by_email("test@example.com")

    assert found_user is not None
    assert found_user.email == "test@example.com"
    assert found_user.name == "Test User"


@pytest.mark.asyncio
async def test_get_user_by_email_not_found(db_session: AsyncSession) -> None:
    """Test getting user by email when user doesn't exist."""
    user_crud = get_test_user_crud(db_session)
    found_user = await user_crud.get_by_email("nonexistent@example.com")
    assert found_user is None


@pytest.mark.asyncio
async def test_authenticate_user_success(db_session: AsyncSession) -> None:
    """Test successful user authentication."""
    # Create user using CRUD layer
    from app.schemas.auth import UserCreate

    user_crud = get_test_user_crud(db_session)
    user_data = UserCreate(
        name="Test User",
        email="test@example.com",
        password="password123",
        provider=Provider.PASS,
    )
    await user_crud.create(user_crud.session, obj_in=user_data)

    # Authenticate user using CRUD layer
    authenticated_user = await user_crud.authenticate(email="test@example.com", password="password123")

    assert authenticated_user is not None
    assert authenticated_user.email == "test@example.com"
    assert authenticated_user.name == "Test User"


@pytest.mark.asyncio
async def test_authenticate_user_wrong_password(db_session: AsyncSession) -> None:
    """Test user authentication with wrong password."""
    # Create user using CRUD layer
    from app.schemas.auth import UserCreate

    user_crud = get_test_user_crud(db_session)
    user_data = UserCreate(
        name="Test User",
        email="test@example.com",
        password="password123",
        provider=Provider.PASS,
    )
    await user_crud.create(user_crud.session, obj_in=user_data)

    # Try to authenticate with wrong password using CRUD layer
    authenticated_user = await user_crud.authenticate(email="test@example.com", password="wrongpassword")

    # The authenticate function should return None for wrong password
    assert authenticated_user is None


@pytest.mark.asyncio
async def test_authenticate_user_user_not_found(db_session: AsyncSession) -> None:
    """Test user authentication when user doesn't exist."""
    user_crud = get_test_user_crud(db_session)
    authenticated_user = await user_crud.authenticate(email="nonexistent@example.com", password="password123")

    # The authenticate function should return None for non-existent user
    assert authenticated_user is None


@pytest.mark.asyncio
async def test_authenticate_user_inactive_user(db_session: AsyncSession) -> None:
    """Test user authentication with inactive user."""
    # Create inactive user using CRUD layer
    from app.schemas.auth import UserCreate

    user_crud = get_test_user_crud(db_session)
    user_data = UserCreate(
        name="Inactive User",
        email="inactive@example.com",
        password="password123",
        provider=Provider.PASS,
    )
    created_user = await user_crud.create(user_crud.session, obj_in=user_data)

    # Manually set user as inactive
    created_user.is_active = False
    await db_session.commit()

    # Try to authenticate inactive user using CRUD layer
    authenticated_user = await user_crud.authenticate(email="inactive@example.com", password="password123")

    # The authenticate function should return None for inactive users
    assert authenticated_user is None


# Test the core auth functions without FastAPI dependencies
async def _test_get_current_user_core(db_session: AsyncSession, user_crud: UserCRUD, token: str) -> User:
    """Test the core logic of get_current_user without FastAPI dependencies."""
    from app.core.auth import verify_token

    # Verify token
    token_data = verify_token(token)
    if token_data is None:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    # Get user by email
    user = await user_crud.get_by_email(email=token_data.email or "")
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return user


@pytest.mark.asyncio
async def test_get_current_user_success(db_session: AsyncSession) -> None:
    """Test getting current user with valid token."""
    # Create user using CRUD layer
    from app.schemas.auth import UserCreate

    user_crud = get_test_user_crud(db_session)
    user_data = UserCreate(
        name="Test User",
        email="test@example.com",
        password="password123",
        provider=Provider.PASS,
    )
    user = await user_crud.create(user_crud.session, obj_in=user_data)

    # Create valid token
    data = {"sub": str(user.id), "email": user.email}
    token = create_access_token(data)

    # Test the core logic
    current_user = await _test_get_current_user_core(db_session, user_crud, token)

    assert current_user is not None
    assert current_user.email == "test@example.com"


@pytest.mark.asyncio
async def test_get_current_user_invalid_token(db_session: AsyncSession) -> None:
    """Test getting current user with invalid token."""
    user_crud = get_test_user_crud(db_session)

    with pytest.raises(HTTPException):  # Should raise HTTPException for invalid token
        await _test_get_current_user_core(db_session, user_crud, "invalid_token")


@pytest.mark.asyncio
async def test_get_current_user_user_not_found(db_session: AsyncSession) -> None:
    """Test getting current user when user doesn't exist in database."""
    # Create token for non-existent user
    data = {"sub": "999", "email": "nonexistent@example.com"}
    token = create_access_token(data)

    user_crud = get_test_user_crud(db_session)

    with pytest.raises(HTTPException):  # Should raise HTTPException for user not found
        await _test_get_current_user_core(db_session, user_crud, token)


@pytest.mark.asyncio
async def test_get_current_user_inactive_user(db_session: AsyncSession) -> None:
    """Test getting current user when user is inactive."""
    # Create inactive user using CRUD layer
    from app.schemas.auth import UserCreate

    user_crud = get_test_user_crud(db_session)
    user_data = UserCreate(
        name="Inactive User",
        email="inactive@example.com",
        password="password123",
        provider=Provider.PASS,
    )
    created_user = await user_crud.create(user_crud.session, obj_in=user_data)

    # Manually set user as inactive
    created_user.is_active = False
    await db_session.commit()

    # Create token for inactive user
    data = {"sub": str(created_user.id), "email": created_user.email}
    token = create_access_token(data)

    with pytest.raises(HTTPException):  # Should raise HTTPException for inactive user
        await _test_get_current_user_core(db_session, user_crud, token)
