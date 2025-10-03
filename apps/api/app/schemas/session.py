""" session schemas for API endpoints."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.integrations.enums import IntegrationProvider


class SessionCreate(BaseModel):
    """Schema for creating a new  session."""

    project_name: str | None = Field(None, description="Optional project name, auto-generated if not provided")
    mcps: list[IntegrationProvider] | None = Field(None, description="MCP integrations to use in this session")
    custom_properties: dict[str, Any] = Field(default_factory=dict, description="Custom properties for the session")


class SessionResponse(BaseModel):
    """Schema for session response."""

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={datetime: lambda v: v.isoformat()},
    )

    session_id: int = Field(..., description="Session ID")
    project_id: int = Field(..., description="Project ID")
    agent_id: int = Field(..., description="Agent ID")
    is_active: bool = Field(..., description="Session status")
    mcps: list[str] = Field(..., description="MCP names array")
    custom_properties: dict[str, Any] = Field(..., description="Custom properties values")
    created_at: datetime = Field(..., description="Session creation timestamp")
