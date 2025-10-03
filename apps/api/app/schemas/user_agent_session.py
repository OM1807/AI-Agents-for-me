"""Session schemas for read-only response models."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.agent import AgentCompact


class SessionCompact(BaseModel):
    """Schema for Session compact response (read-only)."""

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={datetime: lambda v: v.isoformat()},
    )

    id: int = Field(..., description="Session ID")
    agent: AgentCompact = Field(..., description="Agent associated with this session")
    created_at: datetime = Field(..., description="Session creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


class SessionResponse(BaseModel):
    """Schema for Session response (read-only)."""

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={datetime: lambda v: v.isoformat()},
    )

    id: int = Field(..., description="Session ID")
    project_id: int = Field(..., description="Project ID")
    agent_id: int = Field(..., description="Agent ID")
    messages: list[dict[str, Any]] = Field(..., description="Conversation history")
    is_active: bool = Field(..., description="Session status")
    mcps: list[str] = Field(..., description="MCP names array")
    custom_properties: dict[str, Any] = Field(..., description="Custom properties values")
    created_at: datetime = Field(..., description="Session creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    created_by: int = Field(..., description="User ID who created the session")
    agent: AgentCompact = Field(..., description="Agent associated with this session")

    # Computed fields from model properties
    message_count: int = Field(default=0, description="Number of messages in the session")
    mcp_count: int = Field(default=0, description="Number of MCPs in the session")


class SessionListResponse(BaseModel):
    """Schema for paginated session list response."""

    model_config = ConfigDict(from_attributes=True)

    results: list[SessionResponse] = Field(..., description="List of sessions")
    total: int = Field(..., description="Total number of sessions")
    skip: int = Field(..., description="Number of sessions skipped")
    limit: int = Field(..., description="Maximum number of sessions returned")
    has_more: bool = Field(..., description="Whether there are more sessions available")
