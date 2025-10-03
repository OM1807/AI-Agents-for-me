"""Agent schemas for read-only response models."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.agents.enums import AgentIdentifier, AgentModule


class AIAgentResponse(BaseModel):
    """Schema for AI Agent response (read-only)."""

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={datetime: lambda v: v.isoformat()},
    )

    id: int = Field(..., description="Agent ID")
    name: str = Field(..., description="Agent name")
    description: str = Field(..., description="Agent description")
    identifier: AgentIdentifier = Field(..., description="Type of workflow to use")
    module: AgentModule = Field(..., description="Category of the agent")
    tags: list[str] = Field(..., description="Tags used on agent definition")
    is_active: bool = Field(..., description="Agent status")
    custom_properties_schema: dict[str, Any] = Field(..., description="Custom properties JSON schema")
    created_at: datetime = Field(..., description="Agent creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


class AgentCompact(BaseModel):
    """Compact schema for AI Agent response excluding non-required fields for frontend."""

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={datetime: lambda v: v.isoformat()},
    )

    id: int = Field(..., description="Agent ID")
    name: str = Field(..., description="Agent name")
    description: str = Field(..., description="Agent description")
    identifier: AgentIdentifier = Field(..., description="Type of workflow to use")
    module: AgentModule = Field(..., description="Category of the agent")
    tags: list[str] = Field(..., description="Tags used on agent definition")
    is_active: bool = Field(..., description="Agent status")


class AIAgentListResponse(BaseModel):
    """Schema for paginated agent list response."""

    model_config = ConfigDict(from_attributes=True)

    results: list[AIAgentResponse] = Field(..., description="List of agents")
    total: int = Field(..., description="Total number of agents")
    skip: int = Field(..., description="Number of agents skipped")
    limit: int = Field(..., description="Maximum number of agents returned")
    has_more: bool = Field(..., description="Whether there are more agents available")
