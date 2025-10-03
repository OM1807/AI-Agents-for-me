"""Base model with common fields for all database models."""

from datetime import datetime

from pydantic import ConfigDict
from sqlmodel import Field, SQLModel


class BaseModel(SQLModel):
    """Base model with common fields for all database models.

    Provides:
    - id: Primary key
    - created_at: Record creation timestamp
    - updated_at: Record last update timestamp
    """

    model_config = ConfigDict(
        from_attributes=True, json_encoders={datetime: lambda v: v.isoformat()}, use_enum_values=True
    )  # type: ignore

    id: int | None = Field(default=None, primary_key=True, description="Primary key")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Record creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Record last update timestamp")


class AuditedModel(BaseModel):
    """Base model with common fields for all database models.

    Provides:
    - created_by: Record creation timestamp
    - updated_by: Record last update timestamp
    """

    created_by: int = Field(description="Created by user id")
    updated_by: int = Field(description="Updated by user id")
