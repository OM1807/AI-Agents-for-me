"""User model for authentication and user management."""

from enum import Enum
from typing import TYPE_CHECKING

from pydantic import ConfigDict
from sqlalchemy import Column, String
from sqlalchemy_utils import StringEncryptedType  # type: ignore
from sqlmodel import Field

from app.core.config import get_settings
from app.models.base import BaseModel

if TYPE_CHECKING:
    pass


def get_secret_key() -> str:
    """Get the secret key for encryption from settings."""
    settings = get_settings()
    return settings.SECRET_KEY


class Provider(str, Enum):
    """Authentication provider enum."""

    PASS = "PASS"
    GITHUB = "GITHUB"
    MICROSOFT = "MICROSOFT"


class User(BaseModel, table=True):
    """User model for authentication and user management.

    Based on the ER diagram with the following fields:
    - id: Primary key
    - name: User's full name
    - password: Encrypted password (for PASS provider)
    - provider: Authentication provider (PASS/GITHUB/MICROSOFT)
    - email: Unique email address
    - is_active: Account status
    - created_at: Record creation timestamp
    - updated_at: Record last update timestamp
    """

    __tablename__ = "users"

    model_config = ConfigDict(use_enum_values=True)

    name: str = Field(max_length=255, description="User's full name")
    password: str | None = Field(
        sa_column=Column(StringEncryptedType(String(8), key=get_secret_key), nullable=True),
        default=None,
        description="Encrypted password field (for PASS provider)",
    )
    provider: Provider = Field(default=Provider.PASS, description="Authentication provider (PASS/GITHUB/MICROSOFT)")
    email: str = Field(max_length=255, unique=True, index=True, description="Unique email address")
    is_active: bool = Field(default=True, description="Account status")
