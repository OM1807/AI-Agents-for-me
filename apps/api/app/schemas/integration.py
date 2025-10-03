"""Integration schemas for request/response models."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.integrations.enums import AuthType, IntegrationProvider


class IntegrationBase(BaseModel):
    """Base integration schema with common fields."""

    name: str = Field(..., min_length=1, max_length=100, description="Integration name")
    auth_type: AuthType = Field(..., description="Authentication type")
    type: IntegrationProvider = Field(..., description="Integration type")
    is_active: bool = Field(default=True, description="Integration status")


class IntegrationCreate(IntegrationBase):
    """Schema for integration creation with credential validation."""

    credentials: dict[str, Any] = Field(..., description="Integration credentials based on auth_type")


class IntegrationUpdate(BaseModel):
    """Schema for integration update."""

    auth_type: AuthType = Field(..., description="Authentication type")
    credentials: dict[str, Any] = Field(..., description="Integration credentials based on auth_type")
    is_active: bool = Field(default=True, description="Integration status")


class IntegrationResponse(IntegrationBase):
    """Schema for integration response (without sensitive data)."""

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={datetime: lambda v: v.isoformat()},
    )

    id: int = Field(..., description="Integration ID")
    created_at: datetime = Field(..., description="Integration creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    created_by: int = Field(..., description="User ID who created the integration")
    updated_by: int = Field(..., description="User ID who updated the integration")
