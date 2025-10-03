"""Authentication utilities for JWT token management."""

from datetime import datetime, timedelta
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db_session
from ..crud.user import UserCRUD
from ..models.user import User
from ..schemas.auth import TokenData
from .config import get_settings

settings = get_settings()

# HTTP Bearer token scheme
security = HTTPBearer()


async def get_user_crud(session: Annotated[AsyncSession, Depends(get_db_session)]) -> UserCRUD:
    """Dependency to get UserCRUD instance with session."""
    return UserCRUD(session=session)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token.

    Args:
        data: The data to encode in the token.
        expires_delta: Optional expiration time delta.

    Returns:
        str: The encoded JWT token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)  # 7 days validity

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> TokenData | None:
    """Verify and decode a JWT token.

    Args:
        token: The JWT token to verify.

    Returns:
        Optional[TokenData]: The decoded token data or None if invalid.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int | None = payload.get("sub")
        email: str | None = payload.get("email")
        exp: datetime | None = payload.get("exp")

        if user_id is None or email is None:
            return None

        return TokenData(user_id=user_id, email=email, exp=exp)
    except JWTError:
        return None


async def get_current_user(
    user_crud: Annotated[UserCRUD, Depends(get_user_crud)],
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    """Get the current user from JWT token.

    Args:
        user_crud: User CRUD operations instance.
        credentials: HTTP Bearer token credentials.

    Returns:
        User: The current user if token is valid.

    Raises:
        HTTPException: If token is invalid or user not found.
    """
    token_data = verify_token(credentials.credentials)
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Use CRUD layer to get user by email
    user = await user_crud.get_by_email(email=token_data.email or "")
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user
