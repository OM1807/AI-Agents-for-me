"""Authentication endpoints for user registration, login, and token management."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer

from app.core.auth import create_access_token, get_current_user, get_user_crud
from app.crud.user import UserCRUD
from app.models.user import User
from app.schemas.auth import Token, UserCreate, UserLogin, UserResponse

router = APIRouter()
security = HTTPBearer()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    user_crud: Annotated[UserCRUD, Depends(get_user_crud)],
) -> UserResponse:
    """Register a new user.

    Args:
        user_data: User registration data.
        user_crud: User CRUD operations instance.

    Returns:
        UserResponse: The created user data.

    Raises:
        HTTPException: If email already exists or validation fails.
    """
    # Check if user already exists using CRUD layer
    if await user_crud.exists_by_email(email=user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user using CRUD layer
    db_user = await user_crud.create(obj_in=user_data)
    return UserResponse.model_validate(db_user)


@router.post("/login", response_model=Token)
async def login(
    user_credentials: UserLogin,
    user_crud: Annotated[UserCRUD, Depends(get_user_crud)],
) -> Token:
    """Authenticate user and return JWT tokens.

    Args:
        user_credentials: User login credentials.
        user_crud: User CRUD operations instance.

    Returns:
        Token: JWT access and refresh tokens.

    Raises:
        HTTPException: If credentials are invalid.
    """
    # Authenticate user using CRUD layer
    user = await user_crud.authenticate(email=user_credentials.email, password=user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token with 7 days validity
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})

    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=7 * 24 * 60 * 60,  # 7 days in seconds
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    """Get current user information.

    Args:
        current_user: Current authenticated user.

    Returns:
        UserResponse: Current user data.
    """
    return UserResponse.model_validate(current_user)
