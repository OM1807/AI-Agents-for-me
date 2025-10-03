"""Authentication schemas for request/response models."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from ..models.user import Provider


class UserBase(BaseModel):
    """Base user schema with common fields."""

    name: str = Field(..., min_length=1, max_length=255, description="User's full name")
    email: EmailStr = Field(..., description="User's email address")
    provider: Provider = Field(default=Provider.PASS, description="Authentication provider")


class UserCreate(UserBase):
    """Schema for user registration."""

    password: str = Field(..., min_length=8, description="User password (min 8 characters)")


class UserUpdate(BaseModel):
    """Schema for user update request."""

    name: str | None = Field(None, min_length=1, max_length=255, description="User's full name")
    email: EmailStr | None = Field(None, description="User's email address")
    password: str | None = Field(None, min_length=8, description="User's password")
    provider: Provider | None = Field(None, description="Authentication provider")
    is_active: bool | None = Field(None, description="Account status")


class UserLogin(BaseModel):
    """Schema for user login."""

    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="User password")


class UserResponse(UserBase):
    """Schema for user response (without sensitive data)."""

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={datetime: lambda v: v.isoformat()},
    )

    id: int = Field(..., description="User ID")
    is_active: bool = Field(..., description="Account status")
    created_at: datetime = Field(..., description="Account creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


class Token(BaseModel):
    """Schema for JWT token response."""

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")


class TokenData(BaseModel):
    """Schema for token payload data."""

    user_id: int | None = Field(None, description="User ID from token")
    email: str | None = Field(None, description="User email from token")
    exp: datetime | None = Field(None, description="Token expiration time")
